const time = require('./time.js');
const app = getApp();
// pages/music/player/player.js
Page({
  // 页面的初始数据
  data: {
    playList: {},
    id: '',
    index: 0,
    musicData: {},
    animationData: {},
    stickAnimationData: {},
    currentProcess: '00:00', // 左值
    totalProcess: '00:00', // 右值
    isStop: false, // 是否暂停
    statusImg: '../img/pause.png', // 暂停播放图片
    isMovingSlider: false, // 判断是否在滑动滚动条
    isWaiting: false, // 判断是否在加载
    loopStatus: null,// 当前循环模式
    showLrc: false, // 显示歌词
    lrc: [], // 歌词 xxx
    lyr: [], // 歌词属性 [00:00.00] xxx
    active: ['Active'], // 用于单条歌词高亮
    scroll: 0, // 用于歌词滚动
    lrcHeight: 0,  // 歌词高亮歌词的高度
    lrcIndex: null // 当前高亮歌词索引
  },
  // 生命周期函数--监听页面加载
  onLoad: function (options) {
    wx.showLoading({
      title: '加载中'
    })
    this.setData({
      id: options.id
    })
    if (app.globalData.playing['music'].length == 0) {
      this.getMusicInfo();
      this.requestMusic();
      this.getLoopStatus();
      this.getLyric();
      this.getAlbumImg();
    } else {
      let music = app.globalData.playing['music'];
      this.setData({
        id: music.id,
        playList: music.playList,
        musicData: music.musicData,
        lrc: music.lrc,
        lyr: music.lyr,
        loopStatus: music.loopStatus
      })
      let isSameMusic = this.isCurrentAudio();
      this.createAudio(isSameMusic);
    }
    setTimeout(()=>{
      wx.hideLoading();
    },500)
  },
  // 监听页面关闭
  onUnload: function () {
    app.globalData.lrcIndex = this.data.lrcIndex;
    clearInterval(this.inter);
    app.globalData.newSong = [];
    app.globalData.searchRes = [];
    if (app.globalData.playing['music'].id != this.data.id) {
      app.globalData.playing['music'] = {
        id: this.data.id,
        playList: this.data.playList,
        musicData: this.data.musicData,
        lrc: this.data.lrc,
        lyr: this.data.lyr,
        loopStatus: this.data.loopStatus
      }
    }
  },
  // 获取音乐url
  requestMusic: function(){
    console.log('requestMusic')
    let _this = this;
    let url = app.globalData.requestUrl + 'music/url'
    wx.request({
      url: url,
      data: {
        id: _this.data.id
      },
      success: function(res) {
        _this.setData({
          musicData: res.data
        })
        let isSameMusic = _this.isCurrentAudio();
        _this.createAudio(isSameMusic);
      },
      fail: function(res) {
        console.log('请求错误')
      },
    })
  },
  // 获取歌曲信息
  getMusicInfo: function () {
    console.log('getMusicInfo')
    let playList = {};
    let isSearchRes = false;
    let appPlayList = app.globalData.playList;
    if (app.globalData.newSong.length > 0) {
      appPlayList = app.globalData.newSong;
    }
    if (app.globalData.searchRes.length > 0) {
      appPlayList = app.globalData.searchRes;
    }
    playList = appPlayList.filter((res, index) => {
      if (res.id === +this.data.id) {
        this.setData({
          index: index
        })
        return true
      }
    })

    this.setData({
      playList: playList
    })
  },
  // 创建音频管理器
  createAudio: function (isSameMusic) {
    console.log('createAudio')
    let _this = this;
    let audio = app.globalData.audio;
    // 如果audio不存在 才创建
    if (!audio) {
      audio = wx.getBackgroundAudioManager();
      app.globalData.audio = audio;
    }
    app.globalData.audioPaused = audio.paused;

    // 若为相同音频
    if (isSameMusic && !!audio.currentTime && _this.data.musicData.data[0].id === audio.id) {
      // 音频未播放完
      _this.beginAnimation();

      // 背景音频播放进度更新事件
      audio.onTimeUpdate(res => {
        // 将loading隐藏
        if (_this.data.isWaiting) {
          this.setData({
            isWaiting: false
          });
          setTimeout(() => {
            wx.hideLoading()
          }, 300)
        }
        _this.setData({
          currentProcess: time.formatTime(audio.currentTime),
          totalProcess: time.formatTime(audio.duration),
          sliderValue: Math.floor(audio.currentTime),
          slideMax: Math.floor(audio.duration),
        })
      })
      // 为了处理用户暂停音乐时点击进入播放器 属性不见的bug
      setTimeout(function () {
        if (app.globalData.audioPaused) {
          _this.data.isStop = false;
          _this.changeStatus();  // 改变播放图标
          _this.stopAnimation(); // 停止动画
          // 设置播放时间属性
          _this.setData({
            currentProcess: time.formatTime(audio.currentTime),
            totalProcess: time.formatTime(audio.duration),
            sliderValue: Math.floor(audio.currentTime),
            slideMax: Math.floor(audio.duration),
          })
          audio.pause();
        }
      })

      return false
    } else if (isSameMusic) {
      // 若未暂停 先暂停
      if (!audio.paused) {
        _this.changeStatus();
      }
    }
    
    this.audio = audio;
    // 在audio对象中看不到以下设置的值 不设置的话 ios无法播放？？
    audio.title = _this.data.playList[0].name;
    audio.epname = _this.data.playList[0].album ? _this.data.playList[0].album.name : _this.data.playList[0].song.album.name;
    audio.singer = _this.data.playList[0].artists ? _this.data.playList[0].artists[0].name : _this.data.playList[0].song.artists[0].name;
    audio.coverImgUrl = _this.data.playList[0].album ? _this.data.playList[0].album.picUrl : _this.data.playList[0].song.album.picUrl;

    audio.id = _this.data.musicData.data[0].id;
    // 需要处理UI
    if (_this.data.musicData.data[0].url === null) {
      wx.showModal({
        content: '暂无版权',
        showCancel: false,
        confirmText: '确定',
        complete: function (res) {
          // 若无版权 正在播放的对象设置为空
          if (_this.data.musicData.data[0].url === null) {
            app.globalData.playing = {}
            app.globalData.searchRes = {}
          }
          wx.stopBackgroundAudio();
          wx.navigateTo({
            url: '../index/index'
          })
          return
        }
      })
    }else {
      audio.src = _this.data.musicData.data[0].url;
    }

    // 背景音频播放事件
    audio.onPlay(res => {
      _this.beginAnimation();
      this.setData({
        statusImg: '../img/pause.png',
        isStop: false
      })
    })
    // 背景音频播放进度更新事件
    audio.onTimeUpdate(res => {
      // 将loading隐藏
      if (_this.data.isWaiting) {
        this.setData({
          isWaiting: false
        });
        setTimeout(() => {
          wx.hideLoading()
        }, 300)
      }
      // 判断用户是否拖动slider
      if (!_this.data.isMovingSlider){
        _this.setData({
          currentProcess: time.formatTime(audio.currentTime),
          totalProcess: time.formatTime(audio.duration),
          sliderValue: Math.floor(audio.currentTime),
          slideMax: Math.floor(audio.duration),
        })
      }
    })
    // 音频播放结束事件
    audio.onEnded(() => {
      _this.stopAnimation();
      this.setData({
        statusImg: '../img/play.png',
        isStop: true
      })
      _this.nextMusic();
    })
    // 加载提示
    audio.onCanplay(() => {
      wx.showLoading({
        title: '音乐加载中',
      })
      this.setData({
        isWaiting: true
      })
    })
    audio.onError((res)=>{
      console.log(res)
    })
    audio.onWaiting(res=>{
      console.log('音频加载中.. ' + res)
    })
    audio.onPause(() => {
      this.setData({
        statusImg: '../img/play.png',
        isStop: true
      })
      this.inter && clearInterval(this.inter);
      console.log('stop')
    })
  },
  // 开始动画
  beginAnimation: function(){
    let animation = wx.createAnimation({
      duration: 500000,
      timingFunction: "linear",
    })
    // let stickAnimation = wx.createAnimation({
    //   duration: 500,
    //   timingFunction: "linear",
    //   transformOrigin: 'top'
    // })
    this.animation = animation;
    animation.rotate(3600).step().rotate(1).step().rotate(3600).step();
    // stickAnimation.rotate(20).step();
    this.setData({
      animationData: animation.export(),
      // stickAnimationData: stickAnimation.export()
    })
  },
  // 停止动画
  stopAnimation: function() {
    let animation = wx.createAnimation({
      duration: 500000,
      timingFunction: "linear",
    })
    // let stickAnimation = wx.createAnimation({
    //   duration: 500,
    //   timingFunction: "linear",
    //   transformOrigin: 'top'
    // })
    this.animation = animation;
    animation.rotate(0).step();
    // stickAnimation.rotate(-20).translate(0, -20).step();
    this.setData({
      animationData: animation.export(),
      // stickAnimationData: stickAnimation.export()
    })
  },
  // 获取拖动进度条的位置
  handleSliderChange: function(e) {
    let position = e.detail.value; // 进度条位置
    this.seekCurrentAudio(position);
    this.scrollLrc();
  },
  // 更新进度条位置
  seekCurrentAudio: function(position) {
    const audio = app.globalData.audio;
    const _this = this;
    const pause = audio.paused;
    // seek在暂停状态下无法改变currentTime 需要先play再pause 但是会出现播放按钮图标bug
    if (pause) {
      audio.play();
    }
    // 音频控制跳转
    let _position = Math.floor(position);
    wx.seekBackgroundAudio({
      position: _position,
      success: function(res) {
        _this.setData({
          currentProcess: time.formatTime(position),
          sliderValue: Math.floor(position)
        });
        // 先前播放了 现在还原状态
        if (pause) {
          audio.pause();
        }
      }
    })
  },
  // 暂停播放功能
  changeStatus: function() {
    let audio = app.globalData.audio;
    // 解决关闭了音频 无法再播放的bug
    if (audio.src === "") {
      this.createAudio();
    }
    if (this.data.isStop) {
      // 播放
      this.setData({
        statusImg: '../img/pause.png',
        isStop: false
      })
      audio.play();
      this.beginAnimation();
      this.scrollLrc();
    }else {
      // 暂停
      this.setData({
        statusImg: '../img/play.png',
        isStop: true
      })
      audio.pause();
      this.stopAnimation();
      clearInterval(this.inter);
    }
  },
  // 解决播放状态下slider自动更新跟手动滑动滚动条更新的 冲突问题
  handleSliderMoveStart: function() {
    this.setData({
      isMovingSlider: true
    })
  },
  handleSliderMoveEnd: function () {
    this.setData({
      isMovingSlider: false
    })
  },
  // 判断当前是否有歌曲正在播放
  isCurrentAudio: function() {
    const audio = app.globalData.audio;
    // 若为true 则有歌曲正在播放
    if (!!(audio && audio.src) && !!audio.currentTime){
      return true
    }else {
      return false
    }
  },
  // 下一首
  nextMusic: function (e) {
    wx.showLoading({
      title: '加载中'
    })
    let index = ++(this.data.index);
    let singStatus = this.data.loopStatus;
    // 兼容乐库中的最新歌曲
    let playList = app.globalData.playList;
    if (app.globalData.newSong.length != 0) {
      playList = app.globalData.newSong
    }
    // 兼容搜索歌曲
    if (app.globalData.searchRes.length != 0) {
      playList = app.globalData.searchRes
    }
    // 如果该歌曲为最后一首 && 当前为歌单循环模式
    if (index === playList.length && singStatus == 'loop') {
      index = 0;
    }
    // 如果歌单循环模式为随机 
    if (singStatus == 'random') {
      index = this.getRandom()
    }
    // 如果模式为单曲循环 && 自动播放完毕
    if (e === undefined && singStatus == 'oneLoop') {
      index = --index;
    }
    this.setData({
      id: playList[index].id,
      isStop: true
    })
    this.getMusicInfo();
    this.requestMusic();
    this.getLyric();
    this.getAlbumImg();
    this.data.showLrc === true ? this.stopAnimation() : this.beginAnimation()
    app.globalData.playing['id'] = playList[index].id;
    app.globalData.playing['index'] = index;
    setTimeout(() => {
      wx.hideLoading();
    },500)
  },
  // 上一首
  preMusic: function () {
    wx.showLoading({
      title: '加载中'
    })
    let index = --(this.data.index);
    let singStatus = this.data.loopStatus;
    // 兼容乐库中的最新歌曲
    let playList = app.globalData.playList;
    if (app.globalData.newSong.length != 0) {
      playList = app.globalData.newSong
    }
    // 兼容搜索歌曲
    if (app.globalData.searchRes.length != 0) {
      playList = app.globalData.searchRes
    }
    // 如果该歌曲为最后一首 && 当前为歌单循环模式
    if (index === -1 && singStatus == 'loop') {
      index = playList.length - 1;
    }
    // 如果歌单循环模式为随机 
    if (singStatus == 'random') {
      index = this.getRandom()
    }
    this.setData({
      id: playList[index].id,
      isStop: true
    })
    this.getMusicInfo();
    this.requestMusic();
    this.getLyric();
    this.getAlbumImg();
    this.data.showLrc === true ? this.stopAnimation() : this.beginAnimation()
    app.globalData.playing['id'] = playList[index].id;
    app.globalData.playing['index'] = index;
    setTimeout(() => {
      wx.hideLoading();
    },500)
  },
  // 判断当前歌曲循环模式 返回当前循环模式
  getLoopStatus: function() {
    const loopStatus = app.globalData.singStatus
    let nowLoopStatus = null;
    for (let i in loopStatus) {
      if (loopStatus[i]) {
        nowLoopStatus = i
      }
    }
    this.setData({
      loopStatus: nowLoopStatus
    })
  },
  // 获取随机歌曲索引
  getRandom: function() {
    const max = app.globalData.playList.length - 1;
    const min = 0;
    return Math.floor(Math.random() * (max - min + 1) + min);
  },
  // 改变循环模式 
  changeLoopStatus: function() {
    const singStatus = app.globalData.singStatus;
    let loopStatus = this.data.loopStatus;
    singStatus[loopStatus] = false;
    if (loopStatus == 'loop') {
      this.setData({
        loopStatus: 'oneLoop'
      })
      loopStatus = 'oneLoop';
      singStatus[loopStatus] = true;
    } else if (loopStatus == 'oneLoop') {
      this.setData({
        loopStatus: 'random'
      })
      loopStatus = 'random';
      singStatus[loopStatus] = true;
    } else {
      this.setData({
        loopStatus: 'loop'
      })
      loopStatus = 'loop';
      singStatus[loopStatus] = true;
    }
  },
  // 获取歌词
  getLyric: function() {
    let _this = this;
    let url = app.globalData.requestUrl + 'lyric'
    wx.request({
      url: url,
      data: {
        id: this.data.id 
      },
      dataType: 'json',
      responseType: 'text',
      success: function(res) {
        let lyric = _this.parseLyric(res.data.lrc && res.data.lrc.lyric);
        _this.setData({
          lyr: lyric.result,
          lrc: lyric.lrc
        })
      },
      fail: function(res) {
        console.log('歌词获取失败')
      }
    })
  },
  // 整理歌词
  parseLyric: function (t) {
    if (t === undefined) {
      return  {
        result: '暂无歌词',
        lrc: '暂无歌词'
      }
    }
    // 讲文本分割成一行行 存入数组
    let lines = t.split('\n');
    // 匹配类[00:00.00]
    let pattern = /\[\d{2}:\d{2}.\d{2}\]/g; 
    // 保存结果
    let result = [], lrc= [];
    // 去掉不含时间的行
    while(!pattern.test(lines[0])) {
      lines = lines.slice(1)
      if (lines.length == 0) {
        return { result: '暂无歌词', lrc: '暂无歌词' }
      }
    }
    // 将最后一个空元素去掉 
    lines[lines.length - 1].length === 0 && lines.pop();
    lines.forEach((value, index, arr) => {
      // 提取时间[00:00.00]
      let time = value.match(pattern);
      // 提取歌词
      let lyr = value.replace(pattern, '');
      // 因为可能存在[00:00.00][00:00.00]歌词
      time && time.forEach((value1, index1, arr1) => {
        // 去掉[] 获取时间00:00:00
        let t = value1.slice(1, -1).split(":");
        // 将结果push进数组
        lyr && result.push([parseInt(t[0], 10) * 60 + parseFloat(t[1]), lyr]);
      })
    })
    // 时间排序
    result.sort((a,b) => {
      return a[0] - b[0];
    })
    result.filter((e) => {
      lrc.push(e[1])
    })
    return { result: result, lrc: lrc};
  },
  // 更改展示歌词标签
  changeShowLrc: function() {
    if (!this.data.showLrc) {
      this.setData({
        showLrc: true
      })
      this.scrollLrc();
      this.stopAnimation();
    }else {
      this.setData({
        showLrc: false
      })
      this.beginAnimation();
    }
  },
  // 歌词滚动
  scrollLrc: function() {
    let _this = this;
    let audio = app.globalData.audio;
    let lyr = _this.data.lyr;
    let temp = 0, active = [];
    let lrcIndex = app.globalData.lrcIndex;
    let lrcHeight = _this.data.lrcHeight;
    if (_this.inter) {
      console.log('存在inter计时器了')
      return
    }
    if (app.globalData.playing.id == audio.id && lrcIndex) {
      let height = wx.getSystemInfoSync().windowHeight * 0.85 * 0.7
      _this.data.scroll = lrcIndex == 0 ? 37 * lrcIndex : 37 * lrcIndex - height / 2;
      active[lrcIndex] = 'Active';
      _this.setData({
        active: active,
        lrcHeight: _this.data.scroll
      });
      setTimeout(() => {
        active[lrcIndex] = '';
      },500)
    }
    const inter = setInterval(function () {
      for(let i in lyr) {
        if (Math.floor(lyr[i][0]) == Math.floor(audio.currentTime)) {
          let query = wx.createSelectorQuery()
          query.select('.Active').boundingClientRect()
          query.exec(function (res) {
            lrcHeight = res[0].top // 这个组件内 #the-id 节点的上边界坐标
          })
          active[temp] = '';
          active[i] = 'Active';
          let height = wx.getSystemInfoSync().windowHeight * 0.85 * 0.7
          _this.data.scroll = i == 0 ? 37 * i : 37 * i - height/2
          _this.setData({
            active: active,
            lrcHeight: _this.data.scroll,
            lrcIndex: i
          })
          temp = i;
          break;
        }
      }
    }, 500)
    _this.inter = inter;
  },
  // 通过搜索的歌曲缺少图片 由此函数获取  调用的是专辑的接口
  getAlbumImg: function() {
    if (!this.data.playList[0].album.picUrl) {
      let _this = this;
      let url = app.globalData.requestUrl + 'album'
      wx.request({
        url: url,
        data: {
          id: _this.data.playList[0].album.id
        },
        method: 'GET',
        dataType: 'json',
        responseType: 'text',
        success: function(res) {
          _this.setData({
            "playList[0].album.picUrl": res.data.album.picUrl
           })
        }
      })
    }
  }
})