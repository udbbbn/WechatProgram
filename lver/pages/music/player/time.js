function formatTime(seconds) {
  return [
    parseInt(seconds / 60 % 60),
    parseInt(seconds % 60)
  ].join(":")
   .replace(/\b(\d)\b/g,"0$1");// 补0
}
module.exports = {
  formatTime: formatTime
}