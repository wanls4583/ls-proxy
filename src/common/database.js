import { u8To64Uint, u8To32Uint, getStringFromU8Array, bigintToUint8Array } from './utils'
import { DATA_TYPE_REQ_HEAD, DATA_TYPE_RES_HEAD, DATA_TYPE_REQ_BODY, DATA_TYPE_RES_BODY, DATA_TYPE_CERT, DATA_TYPE_RULE } from './utils'
import Socket from './socket'
const encoder = new TextEncoder()

export default class {
  constructor() {
    this.promiseMap = {}
    this.initSocket()
    this.initEvent()
  }
  initEvent() {
    window.eventBus.$on('start-listen', (val) => {

    })
  }
  initSocket() {
    this.socket = new Socket({
      url: 'ws://localhost:8000/data',
      openCb: () => {
      },
      closeCb: () => {
      },
      messageCb: (event) => {
        const data = event.data
        if (data instanceof Blob) {
          data.arrayBuffer().then(async buffer => {
            this.parseData(new Uint8Array(buffer))
          })
        }
      }
    })
    this.socket.startSocket(true)
  }
  getData(msgType, id = 0) {
    if (this.socket.state() !== 'open') {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve()
        }, 1000)
      }).then(() => {
        return this.getData(msgType, id)
      })
    }

    let promiseKey = `${msgType}-${id}`
    let data = Array.from(encoder.encode('data-get:'))
    let u64Size = window.u64Size || 8
    let arr = this.promiseMap[promiseKey] || []
    this.promiseMap[promiseKey] = arr
    data.push(msgType)
    data.push(u64Size)
    data.push(...Array.from(bigintToUint8Array(id, u64Size)))

    return new Promise(resolve => {
      arr.push(resolve)
      this.socket.send(new Uint8Array(data))
    })
  }
  saveData(msgType, u8Array) {
    let data = Array.from(encoder.encode('data-put:'));
    data.push(msgType)
    data = data.concat(Array.from(u8Array))
    this.socket.send(new Uint8Array(data))
  }
  parseData(u8Array) {
    let dataObj = {}
    let index = 0
    let msgType = u8Array[index++]

    if (msgType > DATA_TYPE_RULE) {
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
    u8Array = u8Array.slice(index)

    switch (msgType) {
      case DATA_TYPE_RULE:
        dataObj.ruleStore = JSON.parse(getStringFromU8Array(u8Array) || '{}')
        break
      case DATA_TYPE_CERT:
        dataObj.pem = getStringFromU8Array(u8Array)
        break
      case DATA_TYPE_REQ_HEAD:
        dataObj.reqHead = Array.from(u8Array)
        break
      case DATA_TYPE_RES_HEAD:
        dataObj.resHead = Array.from(u8Array)
        break
      case DATA_TYPE_REQ_BODY:
        dataObj.reqBody = Array.from(u8Array)
        break
      case DATA_TYPE_RES_BODY:
        dataObj.resBody = Array.from(u8Array)
        break
    }

    let promiseKey = `${msgType}-${dataObj.id}`
    let arr = this.promiseMap[promiseKey] || []
    this.promiseMap[promiseKey] = []
    arr.forEach(resolve => {
      resolve(dataObj)
    })
  }
}