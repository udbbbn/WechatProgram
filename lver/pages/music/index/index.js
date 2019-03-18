//index.js
//获取应用实例
const app = getApp()

Page({
  data: {
    userInfo: {},
    playList: {}, // 用户歌单
    playing: {}, // 更在播放的歌曲信息
    perSong: {}, //推荐歌单
    newSong: {}, //最新歌曲
    showFlag: 0, // 当前显示的页面标示
    indexImg: '../img/first-white.png', //首页图片
    libImg: '../img/second-gray.png', //乐库图片
    searchImg: '../img/search_gray.png', //搜索图片
    searchRes: [], // 搜索结果数组
  },
  // 获取用户信息
  getUserInfo: function () {
    let _this = this;
    let url = app.globalData.requestUrl + 'user/detail';
    wx.request({
      url: url,
      data: {
        uid: app.globalData.userInfo.account.id,
      },
      method: 'GET',
      success: function (res) {
        _this.setData({
          userInfo: res.data
        })
      }
    })
  },
  // 获取用户歌单
  getUserList: function() {
    let _this = this;
    let url = app.globalData.requestUrl + 'user/playlist';
    wx.request({
      url: url,
      data: {
        uid: app.globalData.userInfo.account.id,
      },
      success: function(res) {
        _this.setData({
          playList: res.data.playlist
        })
        app.globalData.playList = res.data.playlist
        _this.getPerSong();
      }
    })
  },
  onLoad: function () {
    this.getUserInfo();
    this.getUserList();
  },
  onShow: function () {
    this.getPlaying();
    //页面显示
    console.log('index Show')
  },
  // 导航函数
  hrefDetail: function(e) {
    wx.navigateTo({
      url: '../detail/detail?id=' + e.currentTarget.dataset.id,
      success: function(res) {
        
      },
      fail: function(res) {
        wx.showModal({
          title: '',
          content: '未知错误',
          showCancel: false
        })
      }
    })
  },
  // 获取正在播放的歌曲id 跟索引
  getPlaying: function() {
    if (app.globalData.playing.playlist) {
      this.setData({
        playing: app.globalData.playing
      })
      this.setData({
        playInfo: this.data.playing['playlist'][this.data.playing['index']]
      })
    }
  },
  // 跳转播放器
  hrefPlayer: function (e) {
    wx.navigateTo({
      url: '../player/player?id=' + e.currentTarget.dataset.id
    })
  },
  // 更改当前显示标示
  changeShow: function(e) {
    // 首页 乐库 搜索
    if (e.target.dataset.id === "index") {
      this.setData({
        showFlag: 0,
        indexImg: '../img/first-white.png',
        libImg: '../img/second-gray.png',
        searchImg: '../img/search_gray.png'
      })
    } else if (e.target.dataset.id === "lib") {
      this.setData({
        showFlag: 1,
        indexImg: '../img/first-gray.png',
        libImg: '../img/second-white.png',
        searchImg: '../img/search_gray.png'
      })
    }else {
      this.setData({
        showFlag: 2,
        indexImg: '../img/first-gray.png',
        libImg: '../img/second-gray.png',
        searchImg: '../img/search_white.png'
      })
    }
  },
  // 获取推荐歌单
  getPerSong: function() {
    let _this = this;
    let url = app.globalData.requestUrl + "personalized";
    wx.request({
      url: url,
      method: 'GET',
      dataType: 'json',
      responseType: 'text',
      success: function (res) {
        _this.setData({
          perSong: res.data.result
        })
        _this.getNewSong();
      },
      fail: function(res) {}
    })
  },
  // 获取推荐歌单
  getNewSong: function () {
    let _this = this;
    let url = app.globalData.requestUrl + "personalized/newsong";
    wx.request({
      url: url,
      method: 'GET',
      dataType: 'json',
      responseType: 'text',
      success: function (res) {
        _this.setData({
          newSong: res.data.result
        })
      },
      fail: function (res) { }
    })
  },
  // 最新音乐跳转到播放器
  newSongHerfPlayer: function (e) {
    this.setData({
      playing: {
        playlist: this.data.newSong,
        index: e.currentTarget.dataset.index,
        id: e.currentTarget.dataset.id,
        music: {length: 0}
      }
    })
    app.globalData.playing = this.data.playing;
    app.globalData.newSong = this.data.newSong
    wx.navigateTo({
      url: '../player/player?id=' + e.currentTarget.dataset.id
    })
  },
  // 实现input数据绑定
  getSearchRes: function(e) {
    let _this = this;
    let url = app.globalData.requestUrl + 'search';
    wx.request({
      url: url,
      data: {
        keywords: e.detail.value
      },
      method: 'GET',
      dataType: 'json',
      responseType: 'text',
      success: function(res) {
        _this.setData({
          searchRes: res.data.result.songs 
        })
      },
    })
  },
  // 搜索音乐跳转到播放器
  searchHerfPlayer: function (e) {
    this.setData({
      playing: {
        playlist: this.data.searchRes,
        index: e.currentTarget.dataset.index,
        id: e.currentTarget.dataset.id,
        music: { length: 0 }
      }
    })
    app.globalData.playing = this.data.playing;
    app.globalData.searchRes = this.data.searchRes
    wx.navigateTo({
      url: '../player/player?id=' + e.currentTarget.dataset.id
    })
  }
})
