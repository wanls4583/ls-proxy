import { saveBreak, getBreak } from './http'
const encoder = new TextEncoder()

export default class {
  constructor() {
    this.breakpointList = []
    this.restoreBreak()
  }
  addBreak({ id, url, types, name, enable = true, enableWildcard = true }) {
    if (this.getBreakById(id)) {
      this.modBreak({ id, url, types, name, enable, enableWildcard })
      return
    }
    this.breakpointList.push({
      id, url, types, name, enable, enableWildcard
    })
    this.storeBreak()
  }
  modBreak(option = {}) {
    let ruleObj = this.getBreakById(option.id)
    if (ruleObj) {
      Object.assign(ruleObj, option)
      this.storeBreak()
    }
  }
  delBreak(id, store = true) {
    let ruleObj = this.getBreakById(id)
    if (ruleObj) {
      this.breakpointList = this.breakpointList.filter(item => item.id !== id)
      store && this.storeBreak()
      return true
    }
    return false
  }
  setEnable(id, enable) {
    let ruleObj = this.getBreakById(id)
    if (ruleObj) {
      ruleObj.enable = enable
      this.storeBreak()
    }
  }
  getBreakList() {
    return JSON.parse(JSON.stringify(this.breakpointList))
  }
  getBreakById(id) {
    return this.breakpointList.find(item => item.id === id)
  }
  clearRule() {
    this.breakpointList = []
    this.storeBreak()
  }
  async storeBreak() {
    let res = await saveBreak(encoder.encode(JSON.stringify(this.breakpointList)))
    if (res.status === 200) {
      console.log('断点保存成功')
    }
  }
  async restoreBreak() {
    let res = await getBreak()
    if (res.status === 200) {
      this.breakpointList = res.data || []
    }
  }
}