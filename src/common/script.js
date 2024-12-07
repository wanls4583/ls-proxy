import Node from './node'
import { saveScript, getScript, runScript } from './http'
import { createWorker, scriptWorker, wildcardMatch, getU8ArrayFromString } from './utils'
import { RULE_TYPE, HTTP_STATUS } from './const'

export default class Script extends Node {
  constructor() {
    super({ saveNode: saveScript, getNode: getScript })
    this.promiseObjList = []
    this.worder = createWorker(scriptWorker)
    this.worder.onmessage = (e) => {
      let data = e.data
      let { id, type, header, body } = data
      let obj = this.promiseObjList.find(item => item.dataObj.id === id && item.dataObj.scriptType === type)
      if (obj) {
        if (obj.dataObj.reqHeader) {
          obj.dataObj.reqHeader = header
        } else {
          obj.dataObj.resHeader = header
        }
        obj.dataObj.body = body
        obj.resolve(obj)
      }
    }
    window.eventBus.$on('show-script-run', (e) => {
      this.runScript(e)
    })
  }
  async runScript(dataObj) {
    for (let i = 0; i < this.nodeList.length; i++) {
      let item = this.nodeList[i]
      if (wildcardMatch(dataObj.url, item.url)) {
        await _run.call(this, item.script)
      }
    }
    let req = this.getReq(dataObj)
    runScript(dataObj.id, req)

    async function _run(code) {
      return new Promise(resolve => {
        let body = new Uint8Array(dataObj.body.length)
        body.set(dataObj.body)
        this.worder.postMessage({
          id: dataObj.id,
          type: dataObj.scriptType,
          header: dataObj.reqHeader || dataObj.resHeader,
          body: body,
          code: code
        }, [body.buffer])
        this.promiseObjList.push({
          dataObj: dataObj,
          resolve: resolve
        })
      })
    }
  }
  getHeaderStr(obj) {
    let header = ''
    for (let key in obj) {
      header += `${key}: ${obj[key] || ''}\r\n`
    }
    return header
  }
  getHead(dataObj) {
    let headLine = ''
    if (dataObj.scriptType === RULE_TYPE.REQ) {
      headLine = `${dataObj.method} ${dataObj.path} ${dataObj.version}\r\n`
    } else {
      let statusDesc = HTTP_STATUS.find(item => item.code === dataObj.status)?.desc || ''
      headLine = `${dataObj.version} ${dataObj.status} ${statusDesc}\r\n`
    }
    let header = this.getHeaderStr(dataObj.reqHeader || dataObj.resHeader)
    let head = headLine + header + '\r\n'
    let u8Array = getU8ArrayFromString(head)
    return u8Array
  }
  getReq(dataObj) {
    let head = this.getHead(dataObj)
    let body = dataObj.body
    let req = new Uint8Array(head.length + body.length)
    req.set(head)
    req.set(body, head.length)

    return req
  }
}