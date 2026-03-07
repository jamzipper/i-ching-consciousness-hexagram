// ─────────────────── Trigram Data ───────────────────
const T = [null,
  { n: '乾', el: '天', sym: '☰', l: [1, 1, 1] },
  { n: '兌', el: '澤', sym: '☱', l: [1, 1, 0] },
  { n: '離', el: '火', sym: '☲', l: [1, 0, 1] },
  { n: '震', el: '雷', sym: '☳', l: [1, 0, 0] },
  { n: '巽', el: '風', sym: '☴', l: [0, 1, 1] },
  { n: '坎', el: '水', sym: '☵', l: [0, 1, 0] },
  { n: '艮', el: '山', sym: '☶', l: [0, 0, 1] },
  { n: '坤', el: '地', sym: '☷', l: [0, 0, 0] },
];

// HT[lower][upper] = King-Wen number
const HT = [null,
  [null, 1, 43, 14, 34, 9, 5, 26, 11],
  [null, 10, 58, 38, 54, 61, 60, 41, 19],
  [null, 13, 49, 30, 55, 37, 63, 22, 36],
  [null, 25, 17, 21, 51, 42, 3, 27, 24],
  [null, 44, 28, 50, 32, 57, 48, 18, 46],
  [null, 6, 47, 64, 40, 59, 29, 4, 7],
  [null, 33, 31, 56, 62, 53, 39, 52, 15],
  [null, 12, 45, 35, 16, 20, 8, 23, 2],
];

const HN = {
  1: '乾為天', 2: '坤為地', 3: '水雷屯', 4: '山水蒙',
  5: '水天需', 6: '天水訟', 7: '地水師', 8: '水地比',
  9: '風天小畜', 10: '天澤履', 11: '地天泰', 12: '天地否',
  13: '天火同人', 14: '火天大有', 15: '地山謙', 16: '雷地豫',
  17: '澤雷隨', 18: '山風蠱', 19: '地澤臨', 20: '風地觀',
  21: '火雷噬嗑', 22: '山火賁', 23: '山地剝', 24: '地雷復',
  25: '天雷無妄', 26: '山天大畜', 27: '山雷頤', 28: '澤風大過',
  29: '坎為水', 30: '離為火', 31: '澤山咸', 32: '雷風恆',
  33: '天山遯', 34: '雷天大壯', 35: '火地晉', 36: '地火明夷',
  37: '風火家人', 38: '火澤睽', 39: '水山蹇', 40: '雷水解',
  41: '山澤損', 42: '風雷益', 43: '澤天夬', 44: '天風姤',
  45: '澤地萃', 46: '地風升', 47: '澤水困', 48: '水風井',
  49: '澤火革', 50: '火風鼎', 51: '震為雷', 52: '艮為山',
  53: '風山漸', 54: '雷澤歸妹', 55: '雷火豐', 56: '火山旅',
  57: '巽為風', 58: '兌為澤', 59: '風水渙', 60: '水澤節',
  61: '風澤中孚', 62: '雷山小過', 63: '水火既濟', 64: '火水未濟',
};

const BRANCHES = [
  { n: '子', num: 1, r: '23:00–01:00' }, { n: '丑', num: 2, r: '01:00–03:00' },
  { n: '寅', num: 3, r: '03:00–05:00' }, { n: '卯', num: 4, r: '05:00–07:00' },
  { n: '辰', num: 5, r: '07:00–09:00' }, { n: '巳', num: 6, r: '09:00–11:00' },
  { n: '午', num: 7, r: '11:00–13:00' }, { n: '未', num: 8, r: '13:00–15:00' },
  { n: '申', num: 9, r: '15:00–17:00' }, { n: '酉', num: 10, r: '17:00–19:00' },
  { n: '戌', num: 11, r: '19:00–21:00' }, { n: '亥', num: 12, r: '21:00–23:00' },
];

function getBranch() {
  const h = new Date().getHours();
  if (h === 23 || h === 0) return BRANCHES[0];
  if (h <= 2) return BRANCHES[1];
  if (h <= 4) return BRANCHES[2];
  if (h <= 6) return BRANCHES[3];
  if (h <= 8) return BRANCHES[4];
  if (h <= 10) return BRANCHES[5];
  if (h <= 12) return BRANCHES[6];
  if (h <= 14) return BRANCHES[7];
  if (h <= 16) return BRANCHES[8];
  if (h <= 18) return BRANCHES[9];
  if (h <= 20) return BRANCHES[10];
  return BRANCHES[11];
}

function trigramFromLines(ls) {
  for (let i = 1; i <= 8; i++)
    if (T[i].l[0] === ls[0] && T[i].l[1] === ls[1] && T[i].l[2] === ls[2]) return i;
  return 1;
}

function calculate(strokes, branchNum) {
  let up = strokes % 8; if (up === 0) up = 8;
  const lo = ((up - 1 + branchNum) % 8) + 1;
  let mv = (strokes + branchNum) % 6; if (mv === 0) mv = 6;

  const origNum = HT[lo][up];
  const origLines = [...T[lo].l, ...T[up].l];

  const futLines = [...origLines];
  futLines[mv - 1] = futLines[mv - 1] === 1 ? 0 : 1;
  const futLo = trigramFromLines(futLines.slice(0, 3));
  const futUp = trigramFromLines(futLines.slice(3, 6));
  const futNum = HT[futLo][futUp];

  return {
    up, lo, mv,
    origNum, origLines,
    futNum, futLines,
    origUp: up, origLo: lo,
    futUp, futLo,
    origName: HN[origNum],
    futName: HN[futNum],
    origTriUp: T[up], origTriLo: T[lo],
    futTriUp: T[futUp], futTriLo: T[futLo],
  };
}

function fetchStrokes(char) {
  return new Promise((resolve) => {
    wx.request({
      url: `https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0.1/${encodeURIComponent(char)}.json`,
      success(res) {
        if (res.statusCode === 200 && res.data && Array.isArray(res.data.strokes)) {
          resolve(res.data.strokes.length);
        } else {
          resolve(null);
        }
      },
      fail() { resolve(null); }
    });
  });
}

module.exports = {
  T, HT, HN, BRANCHES,
  getBranch, trigramFromLines, calculate, fetchStrokes,
};
