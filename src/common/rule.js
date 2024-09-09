import { bigintToUint8Array } from './utils'
import { RULE_TYPE, RULE_WAY } from './utils'
import { MSG_REQ_HEAD, MSG_RES_HEAD, MSG_RULE } from './utils'
import { getDataInfo, getReqDataObj, getResDataObj } from './data-utils'
import Socket from './socket'
const encoder = new TextEncoder()
const decoder = new TextDecoder()
export default class {
  constructor() {
    this.store = {}
    this.regMag = {}
    this.sendId = 0
    this.initSocket()
    this.initEvent()
    this.initStore()
    // this.restoreRule()
    this.addRule({
      id: 1,
      url: 'https://www.baidu*',
      type: RULE_TYPE.REQ,
      way: RULE_WAY.MODIFY_REQ_HEADER_ADD,
      option: {
        testAdd: 'abc',
      }
    })
    this.addRule({
      id: 2,
      url: 'https://www.baidu*',
      type: RULE_TYPE.REQ,
      way: RULE_WAY.MODIFY_REQ_HEADER_MOD,
      option: {
        'User-Agent': 'abc',
      }
    })
    this.addRule({
      id: 3,
      url: 'https://www.baidu*',
      type: RULE_TYPE.REQ,
      way: RULE_WAY.MODIFY_REQ_HEADER_DEL,
      option: {
        'Accept-Encoding': true,
      }
    })
    this.addRule({
      id: 4,
      url: 'https://www.baidu*',
      type: RULE_TYPE.RES,
      way: RULE_WAY.MODIFY_REQ_HEADER_ADD,
      option: {
        testAdd: 'abc',
      }
    })
    this.addRule({
      id: 5,
      url: 'https://www.baidu*',
      type: RULE_TYPE.RES,
      way: RULE_WAY.MODIFY_REQ_HEADER_MOD,
      option: {
        traceid: 'abc',
      }
    })
    this.addRule({
      id: 6,
      url: 'https://www.baidu*',
      type: RULE_TYPE.RES,
      way: RULE_WAY.MODIFY_REQ_HEADER_DEL,
      option: {
        vary: true,
      }
    })
  }
  initEvent() {
    window.eventBus.$on('start-listen', (val) => {
      this.socket.startSocket(val)
    })
    window.eventBus.$on('start-listen', (val) => {
      this.socket.startSocket(val)
    })
  }
  initStore() {
    if (window.require) {
      const levelup = window.require('levelup')
      const leveldown = window.require('leveldown')
      const path = window.require('path')
      const { app } = window.require('@electron/remote')
      const filename = path.join(app.getAppPath(), 'electron/level-rule.db')
      this.db = levelup(leveldown(filename))
    }
  }
  initSocket() {
    this.socket = new Socket({
      url: 'ws://localhost:8000/rule',
      openCb: () => {
        this.sendRule()
      },
      closeCb: () => {
        window.eventBus.$emit('socket-close')
      },
      messageCb: (event) => {
        const data = event.data
        if (data instanceof Blob) {
          data.arrayBuffer().then(async buffer => {
            let dataObj = this.getDataObj(new Uint8Array(buffer))
            if ([MSG_REQ_HEAD, MSG_RES_HEAD].includes(dataObj.msgType)) {
              let arr = await this.checkRule(dataObj)
              this.socket.socket.send(new Uint8Array(arr))
            }
          })
        }
      }
    })
  }
  getDataObj(data) {
    let dataObj = {}
    let { msgType, u8Array } = getDataInfo(dataObj, data)

    dataObj.msgType = msgType

    if (msgType == MSG_REQ_HEAD) {
      getReqDataObj({ dataObj, u8Array, hasBobdy: true })
    } else if (msgType == MSG_RES_HEAD) {
      getResDataObj({ dataObj, u8Array, hasBobdy: true })
    } else if (msgType === MSG_RULE) {
      this.reciveId == u8Array[0]
    }

    return dataObj
  }
  addRule({ id, url, type, way, option }) {
    this.delRule(id, false)
    this.store[url] = this.store[url] || {}
    this.store[url][type] = this.store[url][type] || {}
    this.store[url][type][way] = this.store[url][type][way] || []
    this.store[url][type][way].push({
      id: id,
      option: option
    })
    if (!this.regMag[url]) {
      let reg = url.replace(/([^0-9a-zA-Z])/g, '\\$1')
      reg = reg.replace(/\\\?/g, '.')
      reg = reg.replace(/\\\*/g, '.?')
      this.regMag[url] = new RegExp(reg)
    }
    this.storeRule()
  }
  modRule({ id, option }) {
    for (let url in this.store) {
      let urlObj = this.store[url]
      for (let type in urlObj) {
        let typeObj = urlObj[type]
        for (let way in typeObj) {
          let wayList = typeObj[way]
          wayList.forEach(wayObj => {
            if (id === wayObj.id) {
              wayObj.option = option
              this.storeRule()
            }
          })
        }
      }
    }
  }
  delRule(id, store = true) {
    for (let url in this.store) {
      let urlObj = this.store[url]
      for (let type in urlObj) {
        let typeObj = urlObj[type]
        for (let way in typeObj) {
          let wayList = typeObj[way].filter(item => item.id !== id)
          if (!wayList.length) {
            delete typeObj[way]
            if (Object.keys(typeObj).length === 0) {
              delete urlObj[type]
            }
            if (Object.keys(urlObj).length === 0) {
              delete this.store[url]
              delete this.regMag[url]
            }
            store && this.storeRule()
            return true
          }
        }
      }
    }
    return false
  }
  clearRule() {
    this.store = {}
    this.regMag = {}
    this.storeRule()
  }
  storeRule() {
    if (this.db) {
      this.db.del('rule-stroe', (err) => {
        if (!err) {
          this.db.put('rule-stroe', JSON.stringify(this.store))
        }
      })
    }
    this.sendRule()
  }
  restoreRule() {
    if (this.db) {
      this.db.get('rule-stroe', { asBuffer: false }, (err, value) => {
        if (!err) {
          this.store = JSON.parse(value)
        }
      })
    }
    this.sendRule()
  }
  sendRule() {
    if (this.socket.socketState === 'open') {
      this.socket.socket.send(this.createRuleMsg())
      // setTimeout(() => {
      //   if (this.reciveId !== this.sendId) {
      //     this.sendRule()
      //   }
      // }, 2000)
    }
  }
  createRuleMsg() {
    const msg = []
    this.sendId = (++this.sendId) % 256
    msg.push(...Array.from(encoder.encode('rule:')))
    msg.push(this.sendId)
    for (let url in this.store) {
      let urlObj = this.store[url]
      url = Array.from(encoder.encode(url))
      if (urlObj[RULE_TYPE.REQ]) {
        msg.push(_findBodyRule(urlObj[RULE_TYPE.REQ]) ? 2 : 1)
      } else {
        msg.push(0)
      }
      if (urlObj[RULE_TYPE.RES]) {
        msg.push(_findBodyRule(urlObj[RULE_TYPE.RES]) ? 2 : 1)
      } else {
        msg.push(0)
      }
      msg.push(Math.floor(url.length / 256));
      msg.push(url.length % 256);
      msg.push(...url);
    }
    return new Uint8Array(msg)

    function _findBodyRule(typeObj) {
      for (let way in typeObj) {
        if (way === RULE_WAY.MODIFY_REQ_BODY || way === RULE_WAY.MODIFY_RES_BODY) {
          return true
        }
      }
      return false
    }
  }
  async checkRule(dataObj) {
    let { msgType, head, body, reqHeader, resHeader } = dataObj
    let result = Array.from(encoder.encode('data:'));
    result.push(msgType)
    result.push(8)
    result.push(...Array.from(bigintToUint8Array(dataObj.id, 8)))
    for (let url in this.store) {
      if (this.regMag[url].exec(dataObj.url)) {
        let typeObj = null
        if ([MSG_REQ_HEAD].includes(msgType)) {
          typeObj = this.store[url][RULE_TYPE.REQ]
        } else if ([MSG_RES_HEAD].includes(msgType)) {
          typeObj = this.store[url][RULE_TYPE.RES]
        }
        if (!typeObj) {
          break
        }
        let ways = Object.keys(typeObj).sort((a, b) => typeObj[a] - typeObj[b])
        for (let i = 0; i < ways.length; i++) {
          let way = ways[i]
          let wayList = typeObj[way]
          for (let j = 0; j < wayList.length; j++) {
            let { option } = wayList[j]
            if (way === RULE_WAY.MODIFY_REQ_PARAM_ADD) {
              Object.keys(option).forEach(param => {
                head = this.addParam({ param, val: option[param], u8Array: head })
              })
            } else if (way === RULE_WAY.MODIFY_REQ_PARAM_MOD) {
              Object.keys(option).forEach(param => {
                head = this.modParam({ param, val: option[param], u8Array: head })
              })
            } else if (way === RULE_WAY.MODIFY_REQ_PARAM_DEL) {
              Object.keys(option).forEach(param => {
                head = this.delParam({ param, u8Array: head })
              })
            } else if ([RULE_WAY.MODIFY_REQ_HEADER_ADD, RULE_WAY.MODIFY_RES_HEADER_ADD].includes(way)) {
              Object.keys(option).forEach(prop => {
                head = this.addHeader({ prop, val: option[prop], u8Array: head })
              })
            } else if ([RULE_WAY.MODIFY_REQ_HEADER_MOD, RULE_WAY.MODIFY_RES_HEADER_MOD].includes(way)) {
              Object.keys(option).forEach(prop => {
                head = this.modHeader({ prop, val: option[prop], u8Array: head })
              })
            } else if ([RULE_WAY.MODIFY_REQ_HEADER_DEL, RULE_WAY.MODIFY_RES_HEADER_DEL].includes(way)) {
              Object.keys(option).forEach(prop => {
                head = this.delHeader({ prop, u8Array: head })
              })
            } else if ([RULE_WAY.MODIFY_REQ_BODY, RULE_WAY.MODIFY_RES_BODY].includes(way)) {
              body = await getDecoededBody(MODIFY_REQ_BODY === way ? reqHeader : resHeader, body)
              body = this.modBody({ body: option.body })
              head = this.delHeader({ prop: 'transfer-encoding', u8Array: head })
              head = this.delHeader({ prop: 'content-encoding', u8Array: head })
              head = this.delHeader({ prop: 'content-length', u8Array: head })
              head = this.addHeader({ prop: 'content-length', val: body.length, u8Array: head })
            }
          }
        }
      }
    }
    head = Array.from(head)
    body = Array.from(body)
    result = result.concat(head).concat(body)

    return result
  }
  modHeader({ prop, val, u8Array }) {
    let txt = decoder.decode(u8Array)
    let reg = prop.replace(/([^0-9a-zA-Z])/g, '\\$1')
    txt = txt.replace(new RegExp(`^(${reg}\:)[^\r\n]*`, 'img'), `$1 ${val}`)
    return encoder.encode(txt)
  }
  addHeader({ prop, val, u8Array }) {
    let txt = decoder.decode(u8Array)
    let index = txt.indexOf('\n')
    txt = txt.slice(0, index + 1) + `${prop}: ${val}\r\n` + txt.slice(index + 1)
    return encoder.encode(txt)
  }
  delHeader({ prop, u8Array }) {
    let txt = decoder.decode(u8Array)
    let reg = prop.replace(/([^0-9a-zA-Z])/g, '\\$1')
    txt = txt.replace(new RegExp(`^(${reg}\:)[^\r\n]*\r?\n`, 'img'), '')
    return encoder.encode(txt)
  }
  addParam({ param, val, u8Array }) {
    let txt = decoder.decode(u8Array)
    let index = txt.indexOf('\n')
    let headLine = txt.slice(0, index)
    headLine = headLine[headLine.length - 1] === '\r' ? headLine.slice(0, -1) : headLine

    let quesIndex = headLine.indexOf('?')
    if (quesIndex < 0) {
      return u8Array
    }

    let url = headLine.slice(0, quesIndex)
    let search = headLine.slice(quesIndex + 1)
    let arr = search.split('&')

    arr.push(`${param}=${encodeURIComponent(val)}`)
    txt = url + '?' + arr.join('&') + '\r\n' + txt.slice(index + 1)

    return encoder.encode(txt)
  }
  modParam({ param, val, u8Array }) {
    let txt = decoder.decode(u8Array)
    let index = txt.indexOf('\n')
    let headLine = txt.slice(0, index)
    headLine = headLine[headLine.length - 1] === '\r' ? headLine.slice(0, -1) : headLine

    let quesIndex = headLine.indexOf('?')
    if (quesIndex < 0) {
      return u8Array
    }

    let url = headLine.slice(0, quesIndex)
    let search = headLine.slice(quesIndex + 1)
    let arr = search.split('&')

    arr.forEach((item, index) => {
      let [key] = item.split('=')
      if (key.toLowerCase() === param.toLowerCase()) {
        arr[index] = `${param}=${encodeURIComponent(val)}`
      }
    })

    txt = url + '?' + arr.join('&') + '\r\n' + txt.slice(index + 1)

    return encoder.encode(txt)
  }
  delParam({ param, u8Array }) {
    let txt = decoder.decode(u8Array)
    let index = txt.indexOf('\n')
    let headLine = txt.slice(0, index)
    headLine = headLine[headLine.length - 1] === '\r' ? headLine.slice(0, -1) : headLine

    let quesIndex = headLine.indexOf('?')
    if (quesIndex < 0) {
      return u8Array
    }

    let url = headLine.slice(0, quesIndex)
    let search = headLine.slice(quesIndex + 1)
    let arr = search.split('&').filter(item => {
      let [key] = item.split('=')
      if (key.toLowerCase() === param.toLowerCase()) {
        return false
      }
      return true
    })

    txt = url + '?' + arr.join('&') + '\r\n' + txt.slice(index + 1)

    return encoder.encode(txt)
  }
  modBody({ body }) {
    if (typeof body === 'string') {
      return encoder.encode(body)
    }
    return new Uint8Array(body)
  }
}