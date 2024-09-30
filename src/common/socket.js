const emptyCb = () => { }

export default class {
  constructor({ url, openCb, closeCb, messageCb, errorCb }) {
    this.url = url
    this.openCb = openCb || emptyCb
    this.closeCb = closeCb || emptyCb
    this.messageCb = messageCb || emptyCb
    this.errorCb = errorCb || emptyCb
  }
  initSocket() {
    clearTimeout(this.initSocketTimer)
    clearTimeout(this.pingTimer)
    this.socket = new WebSocket(this.url)
    this.socket.addEventListener('open', event => {
      this.socketState = 'open'
      this.socket.send('start')
      this.openCb()
    })
    this.socket.addEventListener('close', event => {
      this.socketState = 'close'
      clearTimeout(this.pingTimer)
      if (this.processing && (!event.wasClean || event.code === 1006)) {
        clearTimeout(this.initSocketTimer)
        this.initSocketTimer = setTimeout(() => {
          this.initSocket()
        }, 1000)
      } else {
        this.closeCb(event)
      }
    })
    this.socket.addEventListener('error', event => {
      this.socketState = 'close'
      this.errorCb(event)
    })
    this.socket.addEventListener('message', event => {
      this.messageCb(event)
      clearTimeout(this.pingTimer)
      this.pingTimer = setTimeout(() => {
        if (this.processing && this.socketState == 'open') {
          this.socket.send('ping')
        }
      }, 5000) // 5秒检测一次心跳
    })
  }
  startSocket(flag) {
    if (flag) {
      if (!this.processing) {
        this.initSocket()
      }
    } else {
      clearTimeout(this.initSocketTimer)
      clearTimeout(this.pingTimer)
      if (this.socketState == 'open') {
        this.socket.close()
      }
    }
    this.processing = flag
  }
  send(data) {
    this.socket.send(data)
  }
  state() {
    return this.socketState
  }
}