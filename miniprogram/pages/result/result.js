const { T, HN, calculate } = require('../../utils/iching');
const { getInterpretation } = require('../../utils/interp');

Page({
  data: {
    question: '',
    strokes: 0,
    branchNum: 0,
    branchName: '',
    origNum: 0,
    origName: '',
    futNum: 0,
    futName: '',
    moveLine: 0,
    origLinesReversed: [],
    futLinesReversed: [],
    origTriUp: '',
    origTriLo: '',
    futTriUp: '',
    futTriLo: '',
    origInterp: '',
    futInterp: '',
    interpOpen: false,
  },

  onLoad(options) {
    const strokes = parseInt(options.strokes);
    const branchNum = parseInt(options.branchNum);
    const branchName = options.branchName;
    const question = getApp().globalData.question || '';

    const r = calculate(strokes, branchNum);

    // Reverse lines for display (top=line6, bottom=line1)
    const origLinesReversed = [];
    for (let i = 5; i >= 0; i--) {
      origLinesReversed.push({
        num: i + 1,
        yang: r.origLines[i] === 1,
        moving: i === r.mv - 1,
      });
    }

    const futLinesReversed = [];
    for (let i = 5; i >= 0; i--) {
      futLinesReversed.push({
        num: i + 1,
        yang: r.futLines[i] === 1,
        moving: false,
      });
    }

    this.setData({
      question,
      strokes,
      branchNum,
      branchName,
      origNum: r.origNum,
      origName: r.origName,
      futNum: r.futNum,
      futName: r.futName,
      moveLine: r.mv,
      origLinesReversed,
      futLinesReversed,
      origTriUp: T[r.origUp].n + T[r.origUp].sym,
      origTriLo: T[r.origLo].n + T[r.origLo].sym,
      futTriUp: T[r.futUp].n + T[r.futUp].sym,
      futTriLo: T[r.futLo].n + T[r.futLo].sym,
      origInterp: getInterpretation(r.origNum),
      futInterp: getInterpretation(r.futNum),
    });
  },

  toggleInterp() {
    this.setData({ interpOpen: !this.data.interpOpen });
  },

  doReset() {
    wx.reLaunch({ url: '/pages/index/index' });
  },
});
