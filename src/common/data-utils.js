import { getStringFromU8Array, u8To64Uint, u8To32Uint, u8To16Uint } from '../common/utils'
import { RULE_TYPE, extList } from '../common/const'
import {
  MSG_REQ_HEAD,
  MSG_RULE_BREAK_REQ,
  MSG_RULE_SCRIPT_REQ,
  MSG_RULE_SCRIPT_RES,
} from '../common/const'
// import { gunzip, inflate } from 'fflate';
// import brotliPromise from 'brotli-wasm'
import { remoteDecode } from './http'

export function getDecoededBody(header, body) {
  let data = new Uint8Array()
  header = header || {}
  if (header['Transfer-Encoding'] === 'chunked') {
    let index = -1
    while ((index = body.kmpSearch([13, 10])) > -1) {
      let num = getStringFromU8Array(new Uint8Array(body.slice(0, index)))
      num = parseInt(num, 16)
      if (!num) {
        break
      }
      data = data.concat(body.slice(index + 2, index + 2 + num))
      body = body.slice(index + 2 + num + 2)
    }
  } else if (header['Content-Type']?.indexOf('boundary=') > -1) {
    let index = header['Content-Type'].indexOf('boundary=')
    let boundary = header['Content-Type'].slice(index + 'boundary='.length)
    body = body.slice(boundary.length + 2)
    while ((index = body.kmpSearch(boundary)) > -1) {
      if (getStringFromU8Array(new Uint8Array(body.slice(index + boundary.length, index + boundary.length + 4))) === '--\r\n') {
        break
      }
      data.push(body.slice(0, index))
      body = body.slice(index + boundary.length + 2)
    }
  } else {
    data = body
  }
  let encoding = header['Content-Encoding']
  if (data.length && ['gzip', 'br', 'deflate'].includes(encoding)) {
    return new Promise(async (resolve) => {
      // let decodeFun = null
      // let zlib = {}
      // if (window.require) {
      //   zlib = window.require('node:zlib')
      // }
      // if (encoding === 'gzip') {
      //   decodeFun = zlib.gunzip || gunzip
      // }
      // if (encoding === 'deflate') {
      //   decodeFun = zlib.inflate || inflate
      // }
      // if (encoding === 'br') {
      //   decodeFun = zlib.brotliDecompress
      //   if (!decodeFun) {
      //     const brotli = await brotliPromise;
      //     resolve(new Uint8Array(brotli.decompress(data)))
      //   }
      // }
      // decodeFun?.(data, (err, buf) => {
      //   if (err) {
      //     return resolve([])
      //   }
      //   resolve(new Uint8Array(buf))
      // })
      const res = await remoteDecode(data, encoding)
      resolve(new Uint8Array(res.data))
    })
  }
  return new Uint8Array(data)
}

export function getDataInfo(dataObj, u8Array) {
  let index = 0
  let msgType = u8Array[index++]

  if (msgType > MSG_RULE_SCRIPT_RES) {
    return {}
  }

  let idSize = u8Array[index++]
  dataObj.idSize = idSize
  window.u64Size = idSize
  if (idSize === 8) {
    dataObj.id = u8To64Uint(u8Array, index) + ''
  } else {
    dataObj.id = u8To32Uint(u8Array, index) + ''
  }
  index += idSize

  let sockIdSize = u8Array[index++]
  dataObj.sockIdSize = sockIdSize
  if (sockIdSize === 8) {
    dataObj.sockId = u8To64Uint(u8Array, index) + ''
  } else {
    dataObj.sockId = u8To32Uint(u8Array, index) + ''
  }
  index += sockIdSize

  if (msgType == MSG_REQ_HEAD || msgType === MSG_RULE_BREAK_REQ || msgType === MSG_RULE_SCRIPT_REQ) {
    switch (u8Array[index++]) {
      case 1:
        dataObj.protocol = 'http:'
        break
      case 2:
        dataObj.protocol = 'https:'
        break
      case 3:
        dataObj.protocol = 'ws:'
        break
      case 4:
        dataObj.protocol = 'wss:'
        break
    }
    let ptSize = u8Array[index++]
    let portU8Array = u8Array.slice(index, index + ptSize)
    if (ptSize === 4) {
      dataObj.clntPort = u8To32Uint(portU8Array) // 客户端端口号
    } else {
      dataObj.clntPort = u8To16Uint(portU8Array) // 客户端端口号
    }
    index += ptSize

    let ipSize = u8Array[index++]
    dataObj.clntIp = getStringFromU8Array(u8Array.slice(index, index + ipSize))
    index += ipSize

    let pathLenBytes = u8Array[index++]
    let pathLen = 0
    if (pathLenBytes === 4) {
      pathLen = u8To32Uint(u8Array, index) // 路径长度
    } else {
      pathLen = u8To16Uint(u8Array, index) // 路径长度
    }
    index += pathLenBytes
    if (pathLen) {
      let processPath = getStringFromU8Array(u8Array.slice(index, index + pathLen))
      let divIndex = processPath.indexOf('.app')
      if (divIndex > -1) {
        processPath = processPath.slice(0, divIndex)
      }
      dataObj.processPath = processPath
      divIndex = processPath.lastIndexOf('/')
      dataObj.processName = processPath.slice(divIndex + 1)
    }
    index += pathLen
  }
  u8Array = u8Array.slice(index)

  return { msgType, u8Array }
}

export function getReqDataObj({ dataObj, u8Array, hasBobdy }) {
  let index = u8Array.kmpSearch([13, 10, 13, 10]) // \r\n\r\n
  let head, spaceIndex, lineIndex

  head = u8Array.slice(0, index + 4)
  hasBobdy && (dataObj.head = head)
  hasBobdy && (dataObj.body = u8Array.slice(index + 4))
  dataObj.size = '0 B'
  dataObj.reqBodyIndex = 0

  spaceIndex = u8Array.kmpSearch(32)
  dataObj.method = getStringFromU8Array(head.slice(0, spaceIndex))

  head = head.slice(spaceIndex + 1)
  spaceIndex = head.kmpSearch(32)
  dataObj.path = getStringFromU8Array(head.slice(0, spaceIndex))

  head = head.slice(spaceIndex + 1)
  lineIndex = head.kmpSearch([13, 10]) // \r\n
  dataObj.version = getStringFromU8Array(head.slice(0, lineIndex))

  head = head.slice(lineIndex + 2)
  dataObj.reqHeader = {}
  getHttpHeader(dataObj.reqHeader, head)

  dataObj.params = {}
  dataObj.reqType = getFileType(dataObj.reqHeader, dataObj).toUpperCase() || '?'
  // 先添加上需要渲染的属性，使其可响应，避免异步设置属性时没有更新视图
  dataObj.status = 'Pending'
  dataObj.ext = ''
  dataObj.type = ''
  dataObj.duration = ''

  if (dataObj.reqHeader.Host) {
    let port = dataObj.reqHeader.Host.indexOf(':')
    if (port > -1) {
      dataObj.port = dataObj.reqHeader.Host.slice(port + 1)
    } else {
      dataObj.port = ['wss:', 'https:'].includes(dataObj.protocol) ? 443 : 80
    }
    dataObj.url = dataObj.protocol + '//' + dataObj.reqHeader.Host + dataObj.path
    getHttpParams(dataObj.params, dataObj.url)
  }
}

export function getResDataObj({ dataObj, u8Array, hasBobdy }) {
  let urlLenSize = u8Array[0]
  let urlLenU8Array = u8Array.slice(1, urlLenSize + 1)
  let urlLen = 0
  if (urlLenSize === 4) {
    urlLen = u8To32Uint(urlLenU8Array)
  } else {
    urlLen = u8To16Uint(urlLenU8Array)
  }
  if (urlLen) {
    dataObj.url = dataObj.url || getStringFromU8Array(u8Array.slice(urlLenSize + 1, urlLenSize + 1 + urlLen))
  }
  u8Array = u8Array.slice(urlLenSize + 1 + urlLen)

  let index = u8Array.kmpSearch([13, 10, 13, 10]) // \r\n\r\n
  let head, spaceIndex, lineIndex

  head = u8Array.slice(0, index + 4)
  hasBobdy && (dataObj.head = head)
  hasBobdy && (dataObj.body = u8Array.slice(index + 4))
  dataObj.resBodySize = u8Array.length
  dataObj.resBodyIndex = 0

  spaceIndex = u8Array.kmpSearch(32)
  dataObj.version = getStringFromU8Array(head.slice(0, spaceIndex))
  head = head.slice(spaceIndex + 1)
  spaceIndex = head.kmpSearch(32)
  dataObj.status = getStringFromU8Array(head.slice(0, spaceIndex))

  lineIndex = head.kmpSearch([13, 10])
  head = head.slice(lineIndex + 2)

  dataObj.resHeader = {}
  getHttpHeader(dataObj.resHeader, head)
  dataObj.ext = getExt(dataObj).toUpperCase()
  dataObj.type = getFileType(dataObj.resHeader, dataObj).toUpperCase() || '?'
}

export function getWsDataObj({ dataObj, u8Array, hasBobdy }) {
  let index = 0
  let fragIdBtyes = u8Array[index++]
  if (fragIdBtyes === 8) {
    dataObj.fragId = u8To64Uint(u8Array, index) + ''
  } else {
    dataObj.fragId = u8To32Uint(u8Array, index) + ''
  }
  index += fragIdBtyes

  dataObj.side = u8Array[index++] == 0x01 ? RULE_TYPE.REQ : RULE_TYPE.RES
  // 0x0：表示一个延续帧。当Opcode为0时，表示本次数据传输采用了数据分片，当前收到的数据帧为其中一个数据分片
  // 0x1：表示这是一个文本帧（frame）
  // 0x2：表示这是一个二进制帧（frame）
  // 0x3-7：保留的操作代码，用于后续定义的非控制帧
  // 0x8：表示连接断开
  // 0x9：表示这是一个ping操作
  // 0xA：表示这是一个pong操作
  // 0xB-F：保留的操作代码，用于后续定义的控制帧
  dataObj.opCode = u8Array[index++]

  let endIndex = 0
  let fragmentSize = 0
  let sizeBytes = u8Array[index++]
  if (sizeBytes === 8) {
    fragmentSize = Number(u8To64Uint(u8Array, index) + '')
  } else {
    fragmentSize = u8To32Uint(u8Array, index)
  }
  index += sizeBytes
  endIndex = index + fragmentSize

  dataObj.fragmentList = []
  if (dataObj.opCode === 0x02 && !hasBobdy) { // 实时消息只返回了长度
    dataObj.fragmentDataSize = fragmentSize
    index += fragmentSize
  } else {
    let fragment = {}
    while (index < fragmentSize) {
      sizeBytes = u8Array[index++]
      if (sizeBytes === 8) {
        fragment.fragmentHeadSize = Number(u8To64Uint(u8Array, index) + '')
      } else {
        fragment.fragmentHeadSize = u8To32Uint(u8Array, index)
      }
      index += sizeBytes

      fragment.fragmentHead = u8Array.slice(index, index + fragment.fragmentHeadSize)
      index += fragment.fragmentHeadSize

      sizeBytes = u8Array[index++]
      if (sizeBytes === 8) {
        fragment.fragmentDataSize = Number(u8To64Uint(u8Array, index) + '')
      } else {
        fragment.fragmentDataSize = u8To32Uint(u8Array, index)
      }
      index += sizeBytes

      fragment.fragmentData = u8Array.slice(index, index + fragment.fragmentDataSize)
      index += fragment.fragmentDataSize

      dataObj.fragmentList.push(fragment)
    }

    dataObj.fragmentData = new Uint8Array()
    dataObj.fragmentList.forEach((fragment) => {
      dataObj.fragmentData = dataObj.fragmentData.concat(fragment.fragmentData)
    })
    dataObj.fragmentDataSize = dataObj.fragmentData.length
    if (dataObj.opCode === 0x01) {
      dataObj.wsMessage = getStringFromU8Array(dataObj.fragmentData)
    }
  }

  return endIndex
}

export function getHttpHeader(reqHeader, head) {
  let lineIndex = -1,
    colonIndex = -1,
    line,
    prop,
    value

  while (head.length) {
    lineIndex = head.kmpSearch([13, 10])
    if (lineIndex < 0) {
      break
    }
    line = head.slice(0, lineIndex)
    if (line.length) {
      colonIndex = line.kmpSearch([58, 32]) //': '
      prop = getStringFromU8Array(line.slice(0, colonIndex))
      value = getStringFromU8Array(line.slice(colonIndex + 2))
      reqHeader[prop] = value
    }
    head = head.slice(lineIndex + 2)
  }
}

export function getHttpParams(params, url) {
  try {
    url = new URL(url)
    for (const [key, value] of url.searchParams) {
      params[key] = value
    }
  } catch (e) { }
}

export function getExt(dataObj) {
  let path = dataObj.path || ''
  let ext = path.lastIndexOf('/')
  path = path.slice(ext + 1)
  ext = /^[\w\.\-\@]+\.([a-zA-Z0-9\_\-]+)/.exec(path)
  ext = ext && ext[1]
  if (ext && extList.includes(ext)) {
    return ext
  }
  return ''
}

export function getFileType(header, dataObj) {
  let contentType = header['Content-Type'] || ''
  let type = null
  if (dataObj.protocol === 'ws:' || dataObj.protocol === 'wss:') {
    type = dataObj.protocol === 'ws:' ? 'ws' : 'wss'
  } else if (contentType.startsWith('application/json')) {
    type = 'json'
  } else if (contentType.startsWith('application/javascript')) {
    type = 'js'
  } else if (contentType.startsWith('text/')) {
    if (contentType.indexOf('html') > -1) {
      type = 'html'
    } else if (contentType.indexOf('xml') > -1) {
      type = 'xml'
    } else if (contentType.indexOf('css') > -1) {
      type = 'css'
    } else {
      type = 'txt'
    }
  } else if (contentType.startsWith('image/')) {
    type = 'image'
  } else if (contentType.startsWith('audio/')) {
    type = 'audio'
  } else if (contentType.startsWith('video/')) {
    type = 'video'
  } else {
    type = ''
  }
  return type
}