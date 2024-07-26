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
    let num = uint8array[1]
    num |= uint8array[0] << 1 * 8

    return num
}

export const u8To32Uint = function (uint8array) {
    let num = uint8array[3]
    num |= uint8array[2] << 1 * 8
    num |= uint8array[1] << 2 * 8
    num |= uint8array[0] << 3 * 8

    return num
}

export const u8To64Uint = function (uint8array) {
    let num = uint8array[7]
    num |= uint8array[6] << 1 * 8
    num |= uint8array[5] << 2 * 8
    num |= uint8array[4] << 3 * 8
    num |= uint8array[3] << 4 * 8
    num |= uint8array[2] << 5 * 8
    num |= uint8array[1] << 6 * 8
    num |= uint8array[0] << 7 * 8

    return num
}