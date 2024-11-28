import { saveScript, getScript } from './http'
const encoder = new TextEncoder()

export default class {
  constructor() {
    this.scriptList = []
    this.restoreScript()
  }
  addScript({ id, url, script, name, enable = true, enableWildcard = true }) {
    if (this.getScriptById(id)) {
      this.modScript({ id, url, script, name, enable, enableWildcard })
      return
    }
    this.scriptList.push({
      id, url, script, name, enable, enableWildcard
    })
    this.storeScript()
  }
  modScript(option = {}) {
    let item = this.getScriptById(option.id)
    if (item) {
      Object.assign(item, option)
      this.storeScript()
    }
  }
  delScript(id, store = true) {
    let item = this.getScriptById(id)
    if (item) {
      this.scriptList = this.scriptList.filter(item => item.id !== id)
      store && this.storeScript()
      return true
    }
    return false
  }
  setEnable(id, enable) {
    let item = this.getScriptById(id)
    if (item) {
      item.enable = enable
      this.storeScript()
    }
  }
  getScriptList() {
    return JSON.parse(JSON.stringify(this.scriptList))
  }
  getScriptById(id) {
    return this.scriptList.find(item => item.id === id)
  }
  clearRule() {
    this.scriptList = []
    this.storeScript()
  }
  async storeScript() {
    let res = await saveScript(encoder.encode(JSON.stringify(this.scriptList)))
    if (res.status === 200) {
      console.log('脚本保存成功')
    }
  }
  async restoreScript() {
    let res = await getScript()
    if (res.status === 200) {
      this.scriptList = res.data || []
    }
  }
}