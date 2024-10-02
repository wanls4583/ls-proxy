import { getStringFromU8Array, u8To64Uint, u8To32Uint, u8To16Uint, extList } from '../common/utils'
import { MSG_REQ_HEAD, MSG_RULE } from '../common/utils'
import { gunzip, inflate } from 'fflate';
import brotliPromise from 'brotli-wasm'

export function getDecoededBody(header, body) {
  let arr = []
  header = header || {}
  if (header['Transfer-Encoding'] === 'chunked') {
    let index = -1
    while ((index = body.search([13, 10])) > -1) {
      let num = getStringFromU8Array(new Uint8Array(body.slice(0, index)))
      num = parseInt(num, 16)
      if (!num) {
        break
      }
      arr = arr.concat(Array.from(body.slice(index + 2, index + 2 + num)))
      body = body.slice(index + 2 + num + 2)
    }
  } else if (header['Content-Type']?.indexOf('boundary=') > -1) {
    let index = header['Content-Type'].indexOf('boundary=')
    let boundary = header['Content-Type'].slice(index + 'boundary='.length)
    body = body.slice(boundary.length + 2)
    while ((index = body.search(boundary)) > -1) {
      if (getStringFromU8Array(new Uint8Array(body.slice(index + boundary.length, index + boundary.length + 4))) === '--\r\n') {
        break
      }
      arr.push(body.slice(0, index))
      body = body.slice(index + boundary.length + 2)
    }
  } else {
    arr = Array.from(body)
  }
  let encoding = header['Content-Encoding']
  if (arr.length && ['gzip', 'br', 'deflate'].includes(encoding)) {
    return new Promise(async (resolve) => {
      let decodeFun = null
      let zlib = {}
      if (window.require) {
        zlib = window.require('node:zlib')
      }
      arr = new Uint8Array(arr)
      if (encoding === 'gzip') {
        decodeFun = zlib.gunzip || gunzip
      }
      if (encoding === 'deflate') {
        decodeFun = zlib.inflate || inflate
      }
      if (encoding === 'br') {
        decodeFun = zlib.brotliDecompress
        if (!decodeFun) {
          const brotli = await brotliPromise;
          resolve(Array.from(brotli.decompress(arr)))
        }
      }
      decodeFun?.(arr, (err, buf) => {
        if (err) {
          return resolve([])
        }
        resolve(Array.from(buf))
      })
    })
  }
  return arr
}

export function getDataInfo(dataObj, u8Array) {
  let index = 0
  let msgType = u8Array[index++]

  if (msgType > MSG_RULE) {
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

  if (msgType == MSG_REQ_HEAD) {
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
    let ptSize = u8Array[index]
    let portU8Array = u8Array.slice(index + 1, index + ptSize + 1)
    if (ptSize === 4) {
      dataObj.clntPort = u8To32Uint(portU8Array) // 客户端端口号
    } else {
      dataObj.clntPort = u8To16Uint(portU8Array) // 客户端端口号
    }
    index += ptSize + 1

    let ipSize = u8Array[index++]
    dataObj.clntIp = getStringFromU8Array(u8Array.slice(index, index + ipSize))
    index += ipSize
  }
  u8Array = u8Array.slice(index)

  return { msgType, u8Array }
}

export function getReqDataObj({ dataObj, u8Array, hasBobdy }) {
  let index = u8Array.search([13, 10, 13, 10]) // \r\n\r\n
  let head, spaceIndex, lineIndex

  head = u8Array.slice(0, index + 4)
  hasBobdy && (dataObj.head = head)
  hasBobdy && (dataObj.body = u8Array.slice(index + 4))
  dataObj.size = '0 B'
  dataObj.reqBodyIndex = 0

  spaceIndex = u8Array.search(32)
  dataObj.method = getStringFromU8Array(head.slice(0, spaceIndex))

  head = head.slice(spaceIndex + 1)
  spaceIndex = head.search(32)
  dataObj.path = getStringFromU8Array(head.slice(0, spaceIndex))

  head = head.slice(spaceIndex + 1)
  lineIndex = head.search([13, 10]) // \r\n
  dataObj.version = getStringFromU8Array(head.slice(0, lineIndex))

  head = head.slice(lineIndex + 2)
  dataObj.reqHeader = {}
  getHttpHeader(dataObj.reqHeader, head)

  dataObj.status = 'Pending'
  dataObj.params = {}

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

  let index = u8Array.search([13, 10, 13, 10]) // \r\n\r\n
  let head, spaceIndex, lineIndex

  head = u8Array.slice(0, index + 4)
  hasBobdy && (dataObj.head = head)
  hasBobdy && (dataObj.body = u8Array.slice(index + 4))
  dataObj.reqBodySize = u8Array.length
  dataObj.resBodyIndex = 0

  spaceIndex = u8Array.search(32)
  head = head.slice(spaceIndex + 1)
  spaceIndex = head.search(32)
  dataObj.status = getStringFromU8Array(head.slice(0, spaceIndex))

  lineIndex = head.search([13, 10])
  head = head.slice(lineIndex + 2)

  dataObj.resHeader = {}
  getHttpHeader(dataObj.resHeader, head)

  dataObj.type = getFileType(dataObj).toUpperCase() || '?'
}

export function getHttpHeader(reqHeader, head) {
  let lineIndex = -1,
    colonIndex = -1,
    line,
    prop,
    value

  while (head.length) {
    lineIndex = head.search([13, 10])
    if (lineIndex < 0) {
      break
    }
    line = head.slice(0, lineIndex)
    if (line.length) {
      colonIndex = line.search([58, 32]) //': '
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

export function getFileType(dataObj) {
  let path = dataObj.path || ''
  let ext = path.lastIndexOf('/')
  path = path.slice(ext + 1)
  ext = /^[\w\.\-\@]+\.([a-zA-Z0-9\_\-]+)/.exec(path)
  ext = ext && ext[1]
  if (ext && extList.includes(ext)) {
    return ext
  } else {
    let contentType = dataObj.resHeader['Content-Type'] || ''
    let type = null
    if (!type) {
      if (contentType.startsWith('application/json')) {
        type = 'json'
      } else if (contentType.startsWith('text/')) {
        if (contentType.indexOf('html') > -1) {
          type = 'html'
        } else if (contentType.indexOf('xml') > -1) {
          type = 'xml'
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
    }
    return type
  }
}