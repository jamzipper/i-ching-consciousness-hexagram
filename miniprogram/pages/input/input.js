const { getBranch, fetchStrokes } = require('../../utils/iching');
const { convertChar, isConverted } = require('../../utils/sc2tc');
const { localStrokes } = require('../../utils/strokes');

Page({
  data: {
    charValue: '',
    strokeValue: '',
    charInfo: null,
    branch: null,
    currentTime: '',
  },

  onLoad() {
    const b = getBranch();
    const now = new Date();
    const ts = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    this.setData({
      branch: b,
      currentTime: ts,
    });
  },

  onCharInput(e) {
    const raw = e.detail.value;
    if (!raw) {
      this.setData({ charValue: '', charInfo: null });
      return;
    }
    const m = raw.match(/[\u4e00-\u9fff\u3400-\u4dbf]/);
    if (!m) {
      // During IME composition (pinyin), don't overwrite the display
      // Only clear charInfo so we don't show stale results
      if (this.data.charInfo) {
        this.setData({ charInfo: null });
      }
      return { value: raw };
    }

    const ch = m[0];
    this._processChar(ch);
    return { value: ch };
  },

  onCharConfirm(e) {
    const raw = e.detail.value;
    if (!raw) return;
    const m = raw.match(/[\u4e00-\u9fff\u3400-\u4dbf]/);
    if (m) {
      this._processChar(m[0]);
    }
  },

  _processChar(ch) {
    const tc = convertChar(ch);
    const converted = isConverted(ch);

    this.setData({
      charValue: ch,
      charInfo: {
        origChar: ch,
        tcChar: tc,
        converted: converted,
        loading: true,
        strokes: null,
        noData: false,
      },
    });

    this.lookupStrokes(tc, ch);
  },

  lookupStrokes(tc, orig) {
    fetchStrokes(tc).then((count) => {
      if (!count && tc !== orig) {
        return fetchStrokes(orig);
      }
      return count;
    }).then((count) => {
      // Fallback to local dictionary if API fails
      if (!count) count = localStrokes(tc);
      if (!count && tc !== orig) count = localStrokes(orig);

      const info = Object.assign({}, this.data.charInfo, {
        loading: false,
        strokes: count || null,
        noData: !count,
      });
      const update = { charInfo: info };
      if (count) update.strokeValue = String(count);
      this.setData(update);
    });
  },

  onStrokeInput(e) {
    this.setData({ strokeValue: e.detail.value });
  },

  doCalculate() {
    const raw = parseInt(this.data.strokeValue);
    if (!raw || raw < 1) {
      wx.showToast({ title: '請輸入正確的筆畫數', icon: 'none' });
      return;
    }

    const branch = this.data.branch;

    wx.redirectTo({
      url: '/pages/result/result?strokes=' + raw +
           '&branchNum=' + branch.num +
           '&branchName=' + branch.n,
    });
  },
});
