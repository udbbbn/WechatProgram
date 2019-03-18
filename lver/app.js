//app.js
App({
  onLaunch: function (scence) {
    // 展示本地存储能力
    var logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      }
    })
    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              // 可以将 res 发送给后台解码出 unionId
              this.globalData.userInfo = res.userInfo

              // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
              // 所以此处加入 callback 以防止这种情况
              if (this.userInfoReadyCallback) {
                this.userInfoReadyCallback(res)
              }
            }
          })
        }
      }
    })
  },
  globalData: {
    // 用户信息
    userInfo: null,
    // 请求地址
    // requestUrl: 'http://localhost:3000/',
    requestUrl: 'http://47.106.147.245:3000/',
    // 歌单
    playList: {},
    
    // 歌曲状态 全部循环 单曲循环 随机播放
    singStatus: {
      loop: true, 
      oneLoop: false,
      random: false
    },
    // 音频控制器
    audio:null,
    // 正在播放的歌曲的id 跟 索引
    playing: {},
    lrcIndex: null, // 歌词索引
    newSong: [], // 最新音乐列表
    searchRes: [], //搜索结果列表
  }
})