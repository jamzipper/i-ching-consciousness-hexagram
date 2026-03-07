Page({
  data: {
    question: '',
    methodOpen: false,
    steps: [
      { num: 'STEP 1', title: '問卦 · 寫下問題', desc: '心中帶著一個清晰的問題，建議以是非題表達，例如「這次升職有沒有機會？」。問題愈具體，卦象愈能聚焦。' },
      { num: 'STEP 2', title: '靜心 · 安定意識', desc: '閉眼，以出離心（不執著於結果）默念問題 10–15 秒。此步驟讓潛意識與當下時空相應，準備接收訊息。' },
      { num: 'STEP 3', title: '觀想 · 浮現漢字', desc: '靜心後，讓一個正體漢字自然浮現於腦海，不要刻意選擇。浮現的字承載了意識當下的感知，即為起卦的媒介。' },
      { num: 'STEP 4', title: '起卦 · 筆畫與時辰', desc: '輸入觀想的字，系統取其正體字筆畫數，並記錄當前時辰，依公式推算卦象。' },
      { num: '結果', title: '本卦與之卦', desc: '本卦代表當前處境；動爻翻轉後得到之卦，象徵事態的發展趨勢。兩卦合看，即可理解現狀與走向。' },
    ],
  },

  onQuestionInput(e) {
    this.setData({ question: e.detail.value });
  },

  toggleMethod() {
    this.setData({ methodOpen: !this.data.methodOpen });
  },

  goMeditate() {
    const question = this.data.question.trim();
    if (!question) {
      wx.showToast({ title: '請先輸入問題', icon: 'none' });
      return;
    }
    getApp().globalData.question = question;
    wx.navigateTo({ url: '/pages/meditate/meditate' });
  },
});
