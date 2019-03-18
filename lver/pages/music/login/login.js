//index.js
//获取应用实例
const app = getApp()

Page({
  data: {
    account: '',
    password: '',
  },
  login: function() {
    let _this = this;
    let url = app.globalData.requestUrl + 'login/cellphone';
    wx.request({
      url: url,
      data: {
        phone: _this.data.account,
        password: _this.data.password
      },
      method: 'GET',
      success: (res) => {
        if (res.data.code === 200) {
          app.globalData.userInfo = res.data
          wx.navigateTo({
            url: '../index/index'
          })
        }else {
          wx.showModal({
            title: '',
            content: '登录失败',
            showCancel: false
          })
        }
      },
      fail: (res => {
        wx.showModal({
          title: '',
          content: '登录失败' +  JSON.stringify(res),
          showCancel: false
        });
        console.log(JSON.stringify(res))
      }) 
    })
  },
  account: function (e) {
    this.setData({
      account: e.detail.value
    })
  },
  password: function (e) {
    this.setData({
      password: e.detail.value
    })
  }
})
