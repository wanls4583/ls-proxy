const encoder = new TextEncoder()

export default class {
  constructor({ saveNode, getNode }) {
    this.nodeList = []
    this.saveNode = saveNode
    this.getNode = getNode
    this.restoreNode()
  }
  addNode(node) {
    node = Object.assign({}, node)
    if (typeof node.enable === 'undefined') {
      node.enable = true
    } else {
      node.enable = !!node.enable
    }
    if (typeof node.enableWildcard === 'undefined') {
      node.enableWildcard = true
    } else {
      node.enableWildcard = !!node.enableWildcard
    }
    if (this.getNodeById(node.id)) {
      this.modNode(node)
      return
    }
    this.nodeList.push(node)
    this.storeNode()
  }
  modNode(option = {}) {
    let ruleObj = this.getNodeById(option.id)
    if (ruleObj) {
      Object.assign(ruleObj, option)
      this.storeNode()
    }
  }
  delNode(id, store = true) {
    let ruleObj = this.getNodeById(id)
    if (ruleObj) {
      this.nodeList = this.nodeList.filter(item => item.id !== id)
      store && this.storeNode()
      return true
    }
    return false
  }
  setEnable(id, enable) {
    let ruleObj = this.getNodeById(id)
    if (ruleObj) {
      ruleObj.enable = enable
      this.storeNode()
    }
  }
  getNodeList() {
    return JSON.parse(JSON.stringify(this.nodeList))
  }
  getNodeById(id) {
    return this.nodeList.find(item => item.id === id)
  }
  clearNode() {
    this.nodeList = []
    this.storeNode()
  }
  async storeNode() {
    let res = await this.saveNode(encoder.encode(JSON.stringify(this.nodeList)))
    if (res.status === 200) {
      console.log('断点保存成功')
    }
  }
  async restoreNode() {
    let res = await this.getNode()
    if (res.status === 200) {
      this.nodeList = res.data || []
    }
  }
}