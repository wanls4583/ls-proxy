import $ from 'jquery'

export const RULE_TYPE = {
  REQ: '1',
  RES: '2'
}

export const RULE_WAY = {
  MODIFY_REQ_URL: '1',
  MODIFY_REQ_PARAM_ADD: '1',
  MODIFY_REQ_PARAM_MOD: '2',
  MODIFY_REQ_PARAM_DEL: '3',
  MODIFY_REQ_HEADER_ADD: '4',
  MODIFY_REQ_HEADER_MOD: '5',
  MODIFY_REQ_HEADER_DEL: '6',
  MODIFY_REQ_BODY: '7',
  MODIFY_RES_HEADER_ADD: '8',
  MODIFY_RES_HEADER_MOD: '9',
  MODIFY_RES_HEADER_DEL: '10',
  MODIFY_RES_BODY: '11',
}
export const [
  TIME_DNS_START,
  TIME_DNS_END,
  TIME_CONNECT_START,
  TIME_CONNECT_END,
  TIME_CONNECT_SSL_START,
  TIME_CONNECT_SSL_END,
  TIME_REQ_START,
  TIME_REQ_END,
  TIME_RES_START,
  TIME_RES_END
] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

export const [
  MSG_REQ_HEAD,
  MSG_REQ_BODY,
  MSG_REQ_BODY_END,
  MSG_RES_HEAD,
  MSG_RES_BODY,
  MSG_RES_BODY_END,
  MSG_DNS,
  MSG_STATUS,
  MSG_TIME,
  MSG_CIPHER,
  MSG_CERT,
  MSG_PORT,
  MSG_RULE
] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]

export const [STATUS_FAIL_CONNECT, STATUS_FAIL_SSL_CONNECT] = [1, 2]

// 拥有图标的文件扩展名
export const extList = [
  '3g2', '3gp', '7z',
  'aac', 'adt', 'ai', 'aiff', 'aly', 'amiga', 'amr', 'ape', 'apk', 'arj', 'asf', 'asm', 'asx', 'au', 'avc', 'avi', 'avs',
  'bak', 'bas', 'bat', 'bmp', 'bom',
  'c', 'cda', 'cdr', 'chm', 'cmd', 'com', 'cpp', 'css', 'csv',
  'dat', 'ddb', 'dif', 'divx', 'dll', 'doc', 'docm', 'docx', 'dot', 'dotm', 'dotx', 'dsl', 'dv', 'dvd', 'dvdaudio', 'dwg', 'dxf',
  'emf', 'env', 'eot', 'eps', 'exe', 'exif',
  'f4v', 'flc', 'fli', 'flv', 'fon', 'font', 'for', 'fpx',
  'gif', 'gz',
  'hdri', 'hlp', 'htm', 'html',
  'int', 'iso',
  'jpeg', 'jpg', 'js', 'json',
  'ksp',
  'lib', 'lic', 'lst', 'lua',
  'm4v', 'mac', 'map', 'md', 'mdf', 'mht', 'mhtml', 'mid', 'midi', 'mkv', 'mmf', 'mod', 'mov', 'mp3', 'mp3pro', 'mp4', 'mpa', 'mpe', 'mpeg', 'mpeg-1', 'mpeg-2', 'mpeg-4', 'mpeg1', 'mpeg2', 'mpeg4', 'mpg', 'msg', 'mts', 'mux',
  'navi',
  'obj', 'ogg', 'otf',
  'pas', 'pcd', 'pcx', 'pdf', 'pic', 'png', 'ppt', 'pptx', 'proe', 'prt', 'psd', 'py',
  'qsv', 'quicktime',
  'ra', 'ram', 'rar', 'raw', 'realaudio', 'rm', 'rmvb', 'rp', 'rtf',
  's48', 'sacd', 'sch', 'sh', 'stp', 'svcd', 'svg', 'swf', 'sys',
  'tga', 'tiff', 'tmp', 'ttc', 'ttf', 'txt',
  'ufo',
  'vcd', 'vob', 'voc', 'vqf',
  'wav', 'wdl', 'webm', 'wki', 'wma', 'wmf', 'wmv', 'wmvhd', 'woff', 'woff2', 'wps', 'wpt',
  'x_t', 'xls', 'xlsm', 'xlsx', 'xlt', 'xltm', 'xltx', 'xmind', 'xml', 'xv', 'xvid',
  'z', 'zip'
];

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
  // var uint8array = new TextEncoder().encode("someString啊哈哈ddd");
  var string = new TextDecoder().decode(uint8array);
  return string
}

export const u8To16Uint = function (uint8array, offset = 0) {
  return new DataView(uint8array.buffer).getUint16(offset)
}

export const u8To32Uint = function (uint8array, offset = 0) {
  return new DataView(uint8array.buffer).getUint32(offset)
}

export const u8To64Uint = function (uint8array, offset = 0) {
  return new DataView(uint8array.buffer).getBigUint64(offset)
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
  return n[1] ? n : "0" + n;
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

export function formatTime(date, joinSymbol = "-", isUsec) {
  if (!date) return "";
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
    result: [year, month, day].map(formatNumber).join(joinSymbol) + " " + [hour, minute, second].map(formatNumber).join(":"),
    fullResult: [year, month, day].map(formatNumber).join(joinSymbol) + " " + [hour, minute, second].map(formatNumber).join(":") + '.' + msec + usec,
    ymdhm: [year, month, day].map(formatNumber).join(joinSymbol) + " " + [hour, minute].map(formatNumber).join(":"),
    date: [year, month, day].map(formatNumber).join(joinSymbol),
    chinaDate: `${year}年${month}月${day}日`,
    clock: [hour, minute, second].map(formatNumber).join(":"),
    hm: [hour, minute].map(formatNumber).join(":"),
    mdhm: [month, day].map(formatNumber).join(joinSymbol) + " " + [hour, minute].map(formatNumber).join(":"),
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