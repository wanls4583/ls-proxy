import $ from 'jquery'

//KMP 算法核心（获取失败连接数组）
function getFlink(p) {
  var flink = [-1, 0]; //为-1是为了标记第一个位置（方便之后使用flink去匹配）
  for (var i = 2; i < p.length; i++) {
    var preFlink = flink[i - 1];
    //循环寻找初始子串（从0开始的子串），这个初始子串与以 i-1 字符结尾的子串相匹配
    while (preFlink > -1 && p[i - 1] !== p[preFlink]) {
      preFlink = flink[preFlink];
    }
    flink[i] = preFlink + 1;
  }
  return flink;
}

export const kmpSearch = function (p) {
  if (p.length === undefined) {
    p = [p]
  }
  var i = 0, j = 0;
  var flink = getFlink(p);

  while (i < this.length && j < p.length) {
    //如果字符相等，或者是模式的第一个字符，主串和模式都应该向后移动一个位置
    if (this[i] === p[j] || j === -1) {
      i++;
      j++;
    } else { // 查找失败，只需移动模式串的位置，不需要i回溯
      j = flink[j];
    }
  }

  if (j === p.length) { //匹配成功，返回模式串在子串开始的索引下标
    return i - p.length;
  } else { //匹配失败，返回-1
    return -1;
  }
}

export const getStringFromU8Array = function (uint8array) {
  var string = new TextDecoder().decode(uint8array);
  return string
}

export const getStringFromU8ArrayWithCheck = function (uint8array) {
  try {
    var string = new TextDecoder('utf-8', { fatal: true }).decode(uint8array)
    return string
  } catch (e) {
    return false
  }
}

export const getU8ArrayFromString = function (str) {
  var uint8array = new TextEncoder().encode(str);
  return uint8array
}

export const u8To16Uint = function (uint8array, offset = 0) {
  return new DataView(uint8array.buffer).getUint16(offset + uint8array.byteOffset)
}

export const u8To32Uint = function (uint8array, offset = 0) {
  return new DataView(uint8array.buffer).getUint32(offset + uint8array.byteOffset)
}

export const u8To64Uint = function (uint8array, offset = 0) {
  return new DataView(uint8array.buffer).getBigUint64(offset + uint8array.byteOffset)
}

export const bigintToUint8Array = function (value, len) {
  let hex = BigInt(value).toString(16)
  let u8 = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    u8[len - i - 1] = parseInt(hex.slice(-2), 16);
    hex = hex.slice(0, -2)
  }
  return u8
}

const formatNumber = (n) => {
  n = n.toString();
  return n[1] ? n : '0' + n;
}

const formatWeek = (week) => {
  return parseInt(week.toString()) || 7;
}

const formatThousand = (num) => {
  num += ''
  while (num.length < 3) {
    num = '0' + num
  }
  return num
}

export function formatTime(date, joinSymbol = '-', isUsec) {
  if (!date) return '';
  let usec = 0
  if (isUsec) {
    usec = formatThousand(date % 1000)
    date = Math.floor(date / 1000)
  }
  const msec = formatThousand(date % 1000)
  date = new Date(date)
  const year = date.getFullYear();
  const month = formatNumber(date.getMonth() + 1);
  const day = formatNumber(date.getDate());
  const week = formatWeek(date.getDay());
  const hour = formatNumber(date.getHours());
  const minute = formatNumber(date.getMinutes());
  const second = formatNumber(date.getSeconds());
  const msecond = date.getTime()
  return {
    result: [year, month, day].map(formatNumber).join(joinSymbol) + ' ' + [hour, minute, second].map(formatNumber).join(':'),
    fullResult: [year, month, day].map(formatNumber).join(joinSymbol) + ' ' + [hour, minute, second].map(formatNumber).join(':') + '.' + msec + usec,
    ymdhm: [year, month, day].map(formatNumber).join(joinSymbol) + ' ' + [hour, minute].map(formatNumber).join(':'),
    date: [year, month, day].map(formatNumber).join(joinSymbol),
    chinaDate: `${year}年${month}月${day}日`,
    clock: [hour, minute, second].map(formatNumber).join(':'),
    hm: [hour, minute].map(formatNumber).join(':'),
    mdhm: [month, day].map(formatNumber).join(joinSymbol) + ' ' + [hour, minute].map(formatNumber).join(':'),
    year,
    month,
    week,
    day,
    hour,
    minute,
    second,
    msecond,
  };
}

export function getUUID(len) {
  len = len || 16;
  var str = '';
  for (var i = 0; i < len; i++) {
    str += ((Math.random() * 16) | 0).toString(16);
  }
  return str;
}

//获取字符宽度
export function getCharWidth(wrap, template) {
  let str1 = '';
  let str2 = '';
  for (let i = 0; i < 100; i++) {
    str1 += '1';
    str2 += '啊';
  }
  template = template && template.indexOf('[dom]') > -1 ? template : '<div style="white-space:nowrap">[dom]</div>'
  let fontSize = 0;
  let id1 = 'char-width-' + getUUID();
  let id2 = 'char-width-' + getUUID();
  let $tempDom1 = $(template.replace('[dom]', `<span id="${id1}">${str1}</span>`));
  let $tempDom2 = $(template.replace('[dom]', `<span id="${id2}">${str2}</span>`));
  $(wrap).append($tempDom1).append($tempDom2);
  id1 = $('#' + id1);
  id2 = $('#' + id2);
  if (window.getComputedStyle) {
    fontSize = parseFloat(window.getComputedStyle(id1[0], null).fontSize);
  } else {
    fontSize = parseFloat(id1[0].currentStyle.fontSize);
  }
  let rect = id1[0].getBoundingClientRect()
  let charWidth = rect.width / str1.length;
  let charHight = rect.height;
  let fullCharWidth = id2[0].getBoundingClientRect().width / str2.length;
  $tempDom1.remove();
  $tempDom2.remove();
  return {
    charWidth: charWidth,
    charScale: charWidth / fontSize,
    fullCharWidth: fullCharWidth,
    fullCharScale: fullCharWidth / fontSize,
    charHight: charHight,
    fontSize: fontSize
  };
}

export function readClipboard() {
  if (window.clipboardData) {
    return new Promise(resolve => {
      resolve(clipboardData.getData('Text'))
    })
  } else if (navigator.clipboard) {
    return navigator.clipboard.readText()
  }
}

export function wildcardMatch(s, p) {
  let len_s = s.length, len_p = p.length;
  while (len_s && len_p && p[len_p - 1] != '*') {
    if (charMatch(s[len_s - 1], p[len_p - 1])) {
      len_s--;
      len_p--;
    } else {
      return false;
    }
  }
  if (len_p == 0) {
    return len_s == 0;
  }

  let sIndex = 0, pIndex = 0;
  let sRecord = -1, pRecord = -1;
  while (sIndex < len_s && pIndex < len_p) {
    if (p[pIndex] == '*') {
      ++pIndex;
      sRecord = sIndex;
      pRecord = pIndex;
    } else if (charMatch(s[sIndex], p[pIndex])) {
      ++sIndex;
      ++pIndex;
    } else if (sRecord != -1 && sRecord + 1 < len_s) {
      ++sRecord;
      sIndex = sRecord;
      pIndex = pRecord;
    } else {
      return false;
    }
  }
  return allStars(p, pIndex, len_p);

  function charMatch(u, v) { return u == v || v == '?'; }
  function allStars(str, left, right) {
    for (let i = left; i < right; ++i) {
      if (str[i] != '*') {
        return false;
      }
    }
    return true;
  }
}

export function writeClipboard(text) {
  if (window.clipboardData) {
    clipboardData.setData('Text', text)
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(text)
  }
}

export function createWorker(fun) {
  var funStr = `(${fun.toString()})()`;
  var blob = new Blob([funStr]);
  var url = window.URL.createObjectURL(blob);
  var worker = new Worker(url);
  return worker;
}

export function scriptWorker() {
  const getStringFromU8ArrayWithCheck = function (uint8array) {
    try {
      var string = new TextDecoder('utf-8', { fatal: true }).decode(uint8array)
      return string
    } catch (e) {
      return false
    }
  }

  const getU8ArrayFromString = function (str) {
    var uint8array = new TextEncoder().encode(str);
    return uint8array
  }

  const evalCode = function ({ id, type, header, body, code }) {
    try {
      let newHeader = null
      let newBody = null
      let originBody = body
      let bodyTxt = getStringFromU8ArrayWithCheck(body)

      if (bodyTxt !== false) {
        body = bodyTxt
      }

      eval(code)

      if (type == 1 && typeof onHttpRequest === 'function') {
        let obj = onHttpRequest({ header, body })
        newHeader = obj.header
        newBody = obj.body
      } else if (typeof onHttpResponse === 'function') {
        let obj = onHttpResponse({ header, body })
        newHeader = obj.header
        newBody = obj.body
      } else {
        newHeader = header
        newBody = body
      }

      if (!(newHeader instanceof Object)) {
        newHeader = header
      }

      if (typeof newBody === 'string') {
        newBody = getU8ArrayFromString(newBody)
      } else if (!(newBody instanceof Uint8Array)) {
        newBody = originBody
      }

      self.postMessage({ id, type, header: newHeader, body: newBody }, [newBody.buffer])
    } catch (e) {
      console.log(e)
    }
  }

  self.onmessage = function (e) {
    let data = e.data
    let { id, type, header, body, code } = data
    if (id && code) {
      evalCode({ id, type, header, body, code })
    }
  }
}