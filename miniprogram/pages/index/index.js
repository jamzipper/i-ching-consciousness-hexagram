const { T, HT, HN, getBranch, trigramFromLines, buildHexLines } = require('../../utils/hexData');
const { toTC, SC_TC_MAP } = require('../../utils/scTcMap');
const { getInterpretation } = require('../../utils/interpData');

// Canvas dimensions (px, will be scaled by devicePixelRatio)
const CANVAS_SIZE = 120;
const RADIUS = 48;
const CIRC = 2 * Math.PI * RADIUS;
const TOTAL_SECS = 15;

Page({
  data: {
    currentStep: 1,
    // Step 1
    question: '',
    // Step 2 – timer
    countdown: TOTAL_SECS,
    timerMsg: '靜心中…',
    timerDone: false,
    skipVisible: false,
    // Step 3 – character
    branchChar: '',
    branchName: '',
    branchRange: '',
    branchNum: 0,
    currentTime: '',
    charInput: '',
    charFocus: false,
    origChar: '',
    tcChar: '',
    convState: '',       // '' | 'converted' | 'already'
    strokeInput: '',
    strokeLoading: false,
    strokeAuto: false,
    strokeFailed: false,
    // Step 4 – result
    rawStrokes: 0,
    branchLabel: '',
    origLines: [],
    futLines: [],
    origKw: '',
    origName: '',
    futKw: '',
    futName: '',
    origInterp: '',
    futInterp: '',
    interpOpen: false,
    rQuestion: '',
  },

  _timerID: null,
  _canvasCtx: null,
  _canvasNode: null,

  // ─── Step 1 ───────────────────────────────────────────────
  onQuestionInput(e) {
    this.setData({ question: e.detail.value });
  },

  goMeditate() {
    const q = this.data.question.trim();
    if (!q) {
      wx.showToast({ title: '請先輸入問題', icon: 'none' });
      return;
    }
    this.setData({ currentStep: 2, countdown: TOTAL_SECS, timerDone: false, skipVisible: false, timerMsg: '靜心中…' });
    // Canvas must render before we can get its node
    wx.nextTick(() => this._startTimer());
  },

  // ─── Timer ────────────────────────────────────────────────
  _startTimer() {
    const query = wx.createSelectorQuery();
    query.select('#timerCanvas').fields({ node: true, size: true }).exec((res) => {
      if (!res || !res[0] || !res[0].node) {
        // Canvas not ready yet, retry
        setTimeout(() => this._startTimer(), 100);
        return;
      }
      const canvas = res[0].node;
      const dpr = wx.getWindowInfo ? wx.getWindowInfo().pixelRatio : (wx.getSystemInfoSync().pixelRatio || 2);
      canvas.width = CANVAS_SIZE * dpr;
      canvas.height = CANVAS_SIZE * dpr;
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      this._canvasCtx = ctx;
      this._canvasNode = canvas;
      this._drawArc(TOTAL_SECS);

      let remaining = TOTAL_SECS;
      // Show skip after 5s
      setTimeout(() => this.setData({ skipVisible: true }), 5000);

      this._timerID = setInterval(() => {
        remaining--;
        if (remaining <= 0) {
          clearInterval(this._timerID);
          this._timerID = null;
          this._drawArc(0);
          this.setData({ countdown: '✓', timerDone: true, timerMsg: '靜心完成，記住那個字。' });
          // Auto-advance after 0.8s
          setTimeout(() => this._goStrokes(), 800);
        } else {
          this._drawArc(remaining);
          this.setData({ countdown: remaining });
        }
      }, 1000);
    });
  },

  _drawArc(remaining) {
    const ctx = this._canvasCtx;
    if (!ctx) return;
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    const cx = CANVAS_SIZE / 2;
    const cy = CANVAS_SIZE / 2;

    // Background ring
    ctx.beginPath();
    ctx.arc(cx, cy, RADIUS, 0, 2 * Math.PI);
    ctx.strokeStyle = '#2a2010';
    ctx.lineWidth = 5;
    ctx.stroke();

    // Progress arc
    const fraction = remaining / TOTAL_SECS;
    if (fraction > 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, RADIUS, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * fraction);
      ctx.strokeStyle = '#c9a84c';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  },

  skipTimer() {
    if (this._timerID) { clearInterval(this._timerID); this._timerID = null; }
    this._goStrokes();
  },

  _goStrokes() {
    const branch = getBranch();
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    this.setData({
      currentStep: 3,
      branchChar: branch.n,
      branchName: branch.n,
      branchRange: branch.r,
      branchNum: branch.num,
      currentTime: `${hh}:${mm}`,
      charInput: '',
      origChar: '',
      tcChar: '',
      convState: '',
      strokeInput: '',
      strokeAuto: false,
      strokeFailed: false,
      charFocus: true,
    });
  },

  // ─── Step 3 ───────────────────────────────────────────────
  onCharInput(e) {
    const raw = e.detail.value;
    const m = raw.match(/[\u4e00-\u9fff\u3400-\u4dbf]/);
    if (!m) {
      this.setData({ charInput: raw, convState: '' });
      return;
    }
    const ch = m[0];
    const tc = toTC(ch);
    const converted = tc !== ch;

    this.setData({
      charInput: ch,
      origChar: ch,
      tcChar: tc,
      convState: converted ? 'converted' : 'already',
      strokeInput: '',
      strokeLoading: true,
      strokeAuto: false,
      strokeFailed: false,
    });

    this._fetchStrokes(tc, ch);
  },

  _fetchStrokes(tc, orig) {
    const tryChar = (ch, fallback) => {
      const url = `https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0.1/${encodeURIComponent(ch)}.json`;
      wx.request({
        url,
        success: (res) => {
          if (res.statusCode === 200 && res.data && Array.isArray(res.data.strokes)) {
            const count = res.data.strokes.length;
            this.setData({ strokeInput: String(count), strokeLoading: false, strokeAuto: true, strokeFailed: false });
          } else if (fallback && fallback !== ch) {
            tryChar(fallback, null);
          } else {
            this.setData({ strokeLoading: false, strokeAuto: false, strokeFailed: true });
          }
        },
        fail: () => {
          if (fallback && fallback !== ch) {
            tryChar(fallback, null);
          } else {
            this.setData({ strokeLoading: false, strokeAuto: false, strokeFailed: true });
          }
        },
      });
    };
    tryChar(tc, orig !== tc ? orig : null);
  },

  onStrokeInput(e) {
    this.setData({ strokeInput: e.detail.value, strokeAuto: false });
  },

  // ─── Calculation ──────────────────────────────────────────
  doCalculate() {
    const raw = parseInt(this.data.strokeInput);
    if (!raw || raw < 1) {
      wx.showToast({ title: '請輸入正確的筆畫數', icon: 'none' });
      return;
    }

    const branch = getBranch();
    const tn = branch.num;

    let up = raw % 8; if (up === 0) up = 8;
    const lo = ((up - 1 + tn) % 8) + 1;
    let mv = (raw + tn) % 6; if (mv === 0) mv = 6;

    const origNum = HT[lo][up];
    const origLines = [...T[lo].l, ...T[up].l];

    const futLines = [...origLines];
    futLines[mv - 1] = futLines[mv - 1] === 1 ? 0 : 1;
    const futLo = trigramFromLines(futLines.slice(0, 3));
    const futUp = trigramFromLines(futLines.slice(3, 6));
    const futNum = HT[futLo][futUp];

    this.setData({
      currentStep: 4,
      rawStrokes: raw,
      branchLabel: `${branch.n}時（時辰數 ${tn}）`,
      rQuestion: `「${this.data.question}」`,
      origLines: buildHexLines(origLines, mv - 1),
      futLines: buildHexLines(futLines, -1),
      origKw: `第 ${origNum} 卦`,
      origName: HN[origNum],
      futKw: `第 ${futNum} 卦`,
      futName: HN[futNum],
      origInterp: getInterpretation(origNum),
      futInterp: getInterpretation(futNum),
      interpOpen: false,
    });
  },

  // ─── Interpretation toggle ────────────────────────────────
  toggleInterp() {
    this.setData({ interpOpen: !this.data.interpOpen });
  },

  // ─── Reset ────────────────────────────────────────────────
  doReset() {
    if (this._timerID) { clearInterval(this._timerID); this._timerID = null; }
    this._canvasCtx = null;
    this._canvasNode = null;
    this.setData({
      currentStep: 1,
      question: '',
      countdown: TOTAL_SECS,
      timerMsg: '靜心中…',
      timerDone: false,
      skipVisible: false,
      charInput: '',
      origChar: '',
      tcChar: '',
      convState: '',
      strokeInput: '',
      strokeLoading: false,
      strokeAuto: false,
      strokeFailed: false,
      interpOpen: false,
    });
  },
});
