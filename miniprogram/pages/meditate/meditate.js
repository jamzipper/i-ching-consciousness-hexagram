Page({
  data: {
    remaining: 15,
    canSkip: false,
    done: false,
  },

  timerID: null,
  canvas: null,
  ctx: null,
  TOTAL: 15,

  onReady() {
    this.initCanvas();
    this.startTimer();
    setTimeout(() => {
      this.setData({ canSkip: true });
    }, 5000);
  },

  onUnload() {
    if (this.timerID) clearInterval(this.timerID);
  },

  initCanvas() {
    const query = this.createSelectorQuery();
    query.select('#timerCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0]) return;
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        const dpr = wx.getWindowInfo().pixelRatio;
        const cssW = res[0].width;
        const cssH = res[0].height;
        canvas.width = cssW * dpr;
        canvas.height = cssH * dpr;
        ctx.scale(dpr, dpr);
        this.canvas = canvas;
        this.ctx = ctx;
        this.cssW = cssW;
        this.cssH = cssH;
        this.drawRing(1);
      });
  },

  drawRing(progress) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const cx = this.cssW / 2;
    const cy = this.cssH / 2;
    const r = cx * 0.87;
    const lineWidth = cx * 0.073;

    ctx.clearRect(0, 0, this.cssW, this.cssH);

    // Track
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = '#1c1a10';
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    // Arc
    ctx.beginPath();
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + Math.PI * 2 * progress;
    ctx.arc(cx, cy, r, startAngle, endAngle);
    ctx.strokeStyle = '#c9a84c';
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();
  },

  startTimer() {
    this.timerID = setInterval(() => {
      let remaining = this.data.remaining - 1;
      if (remaining <= 0) {
        remaining = 0;
        clearInterval(this.timerID);
        this.setData({ remaining, done: true, canSkip: true });
        this.drawRing(0);
        return;
      }
      this.setData({ remaining });
      this.drawRing(remaining / this.TOTAL);
    }, 1000);
  },

  goInput() {
    if (this.timerID) clearInterval(this.timerID);
    wx.redirectTo({ url: '/pages/input/input' });
  },
});
