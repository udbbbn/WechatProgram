const app = getApp();

Page({
  data: {
    songId: '',
    ListDetail: {},
    playList: {},
    playing: null // 音频是否正在播放
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.showLoading({
      title: '加载中',
    })
    this.setData({
      songId: options.id
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.listDetail();
    this.getPlaying();
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    
  },
  // 加载歌单详情
  listDetail: function() {
    let url = app.globalData.requestUrl + 'playlist/detail';
    let id = this.data.songId;
    let _this = this;
    wx.request({
      url: url,
      data: {
        id: id
      },
      success: function(res) {
        let el = res.data.result;
        res.data.result = {
          coverImgUrl: el.coverImgUrl,
          name: el.name,
          creator: el.creator,
          trackCount: el.trackCount,
        }
        _this.setData({
          ListDetail: res.data.result,
        })
        _this.renderData('ListDetail.tracks', el.tracks, 0)
        _this.setListData(el.tracks);
        setTimeout(() => {
          wx.hideLoading()
        })
      },
      fail: function(res) {
        wx.showModal({
          content: '请求失败',
          showCancel: false
        })
      },
    })
  },
  // 分段更新数据
  renderData(key, dataArr, start) {
    if (!dataArr.length) return
    let arr = [...dataArr];
    let temp = {};
    let end = start + 100;
    let el;
    while(start < end) {
      el = arr.shift();
      if (el === undefined) {
        start = end;
        break;
      }
      temp[`${key}[${start}]`] = el;
      start++;
    }
    this.renderData(key, arr, end);
    this.setData(temp);
  },
  // 设置playList属性
  setListData: function(data) {
    // this.setData({
    //   playList: this.data.ListDetail.tracks
    // })
      this.renderData('playList', data, 0)
      app.globalData.playList = this.data.playList;
  },
  // 跳转播放器
  hrefPlayer: function(e) {
    this.setData({
      playing: {
        playlist: this.data.playList,
        index: e.currentTarget.dataset.index,
        id: e.currentTarget.dataset.id,
        music: {length:0}
      }
    })
    app.globalData.playing = this.data.playing;
    wx.navigateTo({
      url: '../player/player?id=' + e.currentTarget.dataset.id
    })
  },
  // 获取正在播放的歌曲的值
  getPlaying: function() {
    this.setData({
      playing: app.globalData.playing
    })
  }
})