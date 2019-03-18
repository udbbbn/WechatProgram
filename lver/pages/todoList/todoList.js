var app = getApp()

Page({
	data:{
		userInfo: '',
		hasUserInfo: false,
    canIuse: wx.canIUse('button.open-type.getUserInfo'),
    lists: [],
    curLists: [],
    addShow: false,
    focus: false,
    addText: '',
    status: '1',
    delBtnWidth: 120
	},
	onLoad: function() {
    var _this = this
    wx.getStorage({
      key: 'lists',
      success: function(res) {
        _this.setData({
          lists: res.data,
          curLists: res.data
        })
      },
    })
		if (app.globalData.userInfo) {
			this.setData({
				userInfo: app.globalData.userInfo,
				hasUserInfo: true
			})
			} else if (this.data.canIuse) {
				// 由于userInfo是网络请求 可能在onload后返回数据
				// 因此加入回调函数解决
				app.userInfoReadyCallback = res => {
					this.setData({
						userInfo: res.userInfo,
						hasUserInfo: true
					})
				}
			} else {
      	// 在没有 open-type=getUserInfo 版本的兼容处理
				wx.getUserInfo({
					success: res => {
						app.globalData.userInfo = res.userInfo
						this.setData({
							userInfo: res.userInfo,
							hasUserInfo: true
						})
					}
				})
			}
		},
  getUserInfo: function(e) {
    app.globalData.userInfo = e.detail.userInfo
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  },
  setInput: function(e) {
    this.setData({
      addText: e.detail.value
    })
  },
  addTodoShow: function() {
    this.setData({
      addShow: true,
      focus: true
    })
  },
  addTodo: function() {
    if (!this.data.addText.trim()) {
      return
    }
    var temp = this.data.lists
    var addT = {
      id: new Date().getTime(),
      title: this.data.addText,
      status: '0'
    }
    temp.push(addT)
    this.showCur(temp)
    this.addTodoHide()
    wx.setStorage({
      key: 'lists',
      data: temp,
    })
    wx.showToast({
      title: '添加成功',
      icon: 'success',
      duration: 1000
    })
  },
  addTodoHide: function() {
    this.setData({
      addShow: false,
      focus: false,
      addText: ''
    })
  },
  showCur: function(data) {
    // if (this.data.status === '1') {
      this.setData({
        lists: data,
        curLists: data
      }) 
      // } else {
      //   this.setData({
      //     lists: data,
      //     curLists: data.filter(item => +item.status === (this.data.status - 2),console.log(this.data.status-2))
      //   })
      // }
    },
  showStatus: function(e) {
    var st = e.currentTarget.dataset.status
    if (this.data.status === st) {return}
    if (st === '1') {
      this.setData({
        status: st,
        curLists: this.data.lists
      })
      return
    }
    this.setData({
      status: st,
      curLists: this.data.lists.filter(item => +item.status === (st - 2))
    })
  },
  changTodo: function(e) {
    var _this = this
    var item = e.currentTarget.dataset.item
    var temp = _this.data.lists
    temp.forEach(el => {
      if (el.id === item) {
        if (el.status === '0') {
          el.status = '1'
          _this.showCur(temp)
          wx.setStorage({
            key: 'lists',
            data: temp,
          })
          wx.showToast({
            title: '已完成任务',
            icon: 'success',
            duration: 1000
          })
        }else {
          wx.showModal({
            title: '',
            content: '该任务已完成，确定要重新开始任务？',
            confirmText: '确定',
            cancelText: '取消',
            success: function(res) {
              if (res.confirm) {
                el.status = '0'
                _this.showCur(temp)
                wx.setStorage({
                  key: 'lists',
                  data: temp,
                })
              }else {
                console.log('取消操作')
              }
            }
          })
        }
      }
    })
  },
  touchS: function(e) {
    if (e.touches.length === 1) {
      this.setData({
        // 设置初始位置
        StartX: e.touches[0].clientX
      })
    }
  },
  touchM: function(e) {
    var _this = this
    if (e.touches.length === 1) {
      var moveX = e.touches[0].clientX
      // 计算移动的距离
      var disX = _this.data.StartX - moveX;
      var txtStyle = ''
      // delBtnWidth 为右侧按钮区域的宽度
      var delBtnWidth = _this.data.delBtnWidth
      // 向右滑动处理
      if (disX < 0 || disX == 0) {
        txtStyle = 'left: 0'
      }
      // 向左滑动处理
      if (disX > 0) {
        txtStyle = 'left: -' + disX + 'rpx'
        if (disX > delBtnWidth) {
          txtStyle = 'left: -' + delBtnWidth + 'rpx'
        }
      }
      // 确定滑动的list索引
      var index = e.currentTarget.dataset.index
      var list = _this.data.curLists
      // 设置样式
      list[index].txtStyle = txtStyle
      // 更新列表
      this.setData({
        curLists: list
      })
    }
  },
  touchE: function(e) {
    var _this = this
    // 变量基本与touchM函数一致
    if (e.changedTouches.length === 1) {
      var moveX = e.changedTouches[0].clientX
      var disX = _this.data.StartX - moveX
      var delBtnWidth = _this.data.delBtnWidth
      // 如果距离小于删除按钮的一半 则不显示删除按钮
      var txtStyle = disX < delBtnWidth / 2 ? 'left: 0' : 'left: -' + delBtnWidth + 'rpx'
      var index = e.currentTarget.dataset.index
      var list = _this.data.curLists
      list[index].txtStyle = txtStyle
      this.setData({
        curLists: list
      })
    }
  },
  delTodo: function(e) {
    var _this = this
    var item = e.currentTarget.dataset.item
    var temp = _this.data.lists
    temp.forEach((el, index) => {
      if (el.id === item) {
        // 根据curLists更新视图 所以在函数showCur执行后 该语句才会生效
        temp[index].txtStyle = 'left: 0'
        wx.showModal({
          content: '您确定要删除吗',
          cancelText: '考虑一下',
          confirmText: '确定',
          success: function (res) {
            if (res.confirm) {
              temp.splice(index, 1)
              _this.showCur(temp)
              wx.setStorage({
                key: 'lists',
                data: temp,
              })
            }else {
              _this.showCur(temp)
            }
          }
        })
      }
    })
  }
})