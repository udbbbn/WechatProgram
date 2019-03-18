var windowWidth, windowHeight, app;

class MetrixCanvas {
  constructor() {
    this.yArray = new Array(300).fill(0);
    this.ctx = wx.createCanvasContext("metrix");
    this.width = windowWidth;
    this.height = windowHeight;
    this.timer;
  }

  draw() {
    // 让背景从透明到不透明
    this.ctx.setFillStyle('rgba(0, 0, 0, .05)');
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.setFillStyle('rgb(0, 255, 0)');
    this.ctx.setFontSize(10);

    this.yArray.map((y, index) => {
      let text = String.fromCharCode(1e2 + Math.random() * 1e2);
      // 随机Unicode
      let x = (index * 10) + 10;
      // 记录x坐标
      this.ctx.fillText(text, x, y);
      this.ctx.draw(true);
      if (y > 100 + Math.random() * 1e4) {
        this.yArray[index] = 0;
      } else {
        // 开局全体下落 以及普通下落
        this.yArray[index] = y + 10;
      }
    });
  }
  run() {
    if (!this.ctx) return;
    var self = this;

    function runAnime() {
      if (self.timer) {
        clearTimeout(self.timer);
      }
      self.draw();
      return self.timer = setInterval(runAnime, 100)
    }
    runAnime();
  }
  stop() {
    clearTimeout(this.timer);
    this.ctx.clearRect(0, 0, this.width, this.height);
  }
}
Page({

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.getSystemInfo({
      success: function (res) {
        windowWidth = res.windowWidth;
        windowHeight = res.windowHeight;
      }
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function (e) {
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function (e) {
    app = new MetrixCanvas('metrix');
    app.run();
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    app.stop();
  }
})
