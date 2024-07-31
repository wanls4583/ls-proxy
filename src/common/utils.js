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

export const u8To16Uint = function (uint8array) {
    return new DataView(uint8array.buffer).getUint16()
}

export const u8To32Uint = function (uint8array) {
    return new DataView(uint8array.buffer).getUint32()
}

export const u8To64Uint = function (uint8array) {
    return new DataView(uint8array.buffer).getBigUint64()
}
