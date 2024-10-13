import { bigintToUint8Array, getStringFromU8Array } from './utils'
import { RULE_TYPE, RULE_WAY } from './utils'
import { MSG_REQ_HEAD, MSG_RES_HEAD, MSG_RULE } from './utils'
import { getDataInfo, getReqDataObj, getResDataObj, getDecoededBody } from './data-utils'
import Socket from './socket'
import { saveRule, getRule } from './http'
const encoder = new TextEncoder()
const decoder = new TextDecoder()
export default class {
  constructor() {
    this.store = {}
    this.regMag = {}
    this.sendId = 0
    this.initSocket()
    this.initEvent()
    this.restoreRule()
  }
  initEvent() {
    window.eventBus.$on('start-listen', (val) => {
      this.socket.startSocket(val)
    })
  }
  initSocket() {
    this.socket = new Socket({
      url: 'ws://localhost:8000/rule',
      openCb: () => {
        this.sendRuleParseMsg()
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
              this.socket.send(new Uint8Array(arr))
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
  getUrlReg(url) {
    let reg = url.replace(/([^0-9a-zA-Z])/g, '\\$1')
    reg = reg.replace(/\\\?/g, '.')
    reg = reg.replace(/\\\*/g, '.?')
    return new RegExp(reg)
  }
  addRule({ id, url, type, way, name, option, enable = true }) {
    this.delRule(id, false)
    this.store[url] = this.store[url] || {}
    this.store[url][type] = this.store[url][type] || {}
    this.store[url][type][way] = this.store[url][type][way] || []
    this.store[url][type][way].push({
      id: id,
      name: name,
      option: option,
      enable: enable,
    })
    if (!this.regMag[url]) {
      this.regMag[url] = this.getUrlReg(url)
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
  setEnable(id, enable) {
    let obj = this.getRuleById(id)
    obj.ruleObj.enable = enable
    this.storeRule()
  }
  getRuleList() {
    let list = []
    for (let url in this.store) {
      let urlObj = this.store[url]
      for (let type in urlObj) {
        let typeObj = urlObj[type]
        for (let way in typeObj) {
          let wayList = typeObj[way].map(ruleObj => {
            return {
              ...ruleObj,
              ruleObj,
              url,
              type,
              way
            }
          })
          list = list.concat(wayList)
        }
      }
    }
    return list
  }
  getRuleById(id) {
    for (let url in this.store) {
      let urlObj = this.store[url]
      for (let type in urlObj) {
        let typeObj = urlObj[type]
        for (let way in typeObj) {
          let wayList = typeObj[way]
          let ruleObj = wayList.find(item => item.id === id)
          if (ruleObj) {
            return { ...ruleObj, ruleObj, url, type, way }
          }
        }
      }
    }
  }
  clearRule() {
    this.store = {}
    this.regMag = {}
    this.storeRule()
  }
  async storeRule() {
    let res = await saveRule(encoder.encode(JSON.stringify(this.store)))
    if (res.status === 200) {
      this.sendRuleParseMsg()
    }
  }
  async restoreRule() {
    let res = await getRule()
    let dataObj = {}
    if (res.status === 200) {
      dataObj.ruleStore = JSON.parse(getStringFromU8Array(new Uint8Array(res.data)) || '{}')
    }
    this.store = dataObj.ruleStore
    for (let url in this.store) {
      if (!this.regMag[url]) {
        this.regMag[url] = this.getUrlReg(url)
      }
    }
    this.sendRuleParseMsg()
  }
  sendRuleParseMsg() {
    if (this.socket?.state() !== 'open') {
      return
    }

    let that = this
    this.socket.send(_createRuleParseMsg())

    function _createRuleParseMsg() {
      const msg = []
      that.sendId = (++that.sendId) % 256
      msg.push(...Array.from(encoder.encode('rule-parse:')))
      msg.push(that.sendId)
      for (let url in that.store) {
        let urlObj = that.store[url]
        let reqFlag, resFlag

        reqFlag = _findRuleFlag(urlObj[RULE_TYPE.REQ])
        resFlag = _findRuleFlag(urlObj[RULE_TYPE.RES])
        if (!reqFlag && !resFlag) {
          continue
        }

        msg.push(reqFlag)
        msg.push(resFlag)

        url = Array.from(encoder.encode(url))
        msg.push(Math.floor(url.length / 256));
        msg.push(url.length % 256);
        msg.push(...url);
      }
      return new Uint8Array(msg)
    }

    function _findRuleFlag(typeObj) { // 0:无规则，1:请求头/响应头，2:请求体/响应体
      let flag = 0
      for (let way in typeObj) {
        if (typeObj[way].find(item => item.enable)) {
          flag = 1
          if (way === RULE_WAY.MODIFY_REQ_BODY_REP || way === RULE_WAY.MODIFY_RES_BODY_REP) {
            flag = 2
            break
          }
        }
      }
      return flag
    }
  }
  async checkRule(dataObj) {
    let { msgType, head, body, reqHeader, resHeader } = dataObj
    let result = Array.from(encoder.encode('rule-check:'));
    result.push(msgType)
    result.push(dataObj.idSize)
    result.push(...Array.from(bigintToUint8Array(dataObj.id, dataObj.idSize)))
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
            let { option, enable } = wayList[j]
            if (!enable) {
              continue
            }
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
            } else if ([RULE_WAY.MODIFY_REQ_BODY_REP, RULE_WAY.MODIFY_RES_BODY_REP].includes(way)) {
              body = await getDecoededBody(RULE_WAY.MODIFY_REQ_BODY_REP === way ? reqHeader : resHeader, body)
              body = this.modBody({ body: option.body })
              head = this.delHeader({ prop: 'transfer-encoding', u8Array: head })
              head = this.delHeader({ prop: 'content-encoding', u8Array: head })
              head = this.delHeader({ prop: 'content-length', u8Array: head })
              head = this.addHeader({ prop: 'content-length', val: body.length, u8Array: head })
              head = this.modHeader({ prop: 'content-type', val: '${val};charset=utf-8', u8Array: head })
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
    val = val.replaceAll('${val}', '$2')
    txt = txt.replace(new RegExp(`^(${reg}\:)\\s*([^\\r\\n]*)`, 'img'), `$1 ${val}`)
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
    if (body instanceof Array) {
      return new Uint8Array(body)
    }
    return new Uint8Array([])
  }
}