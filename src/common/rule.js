import { getStringFromU8Array } from './utils'
import { saveRule, getRule } from './http'
const encoder = new TextEncoder()

export default class {
  constructor() {
    this.ruleList = []
    this.restoreRule()
  }
  getUrlReg(url) {
    let reg = url.replace(/([^0-9a-zA-Z])/g, '\\$1')
    reg = reg.replace(/\\\?/g, '.')
    reg = reg.replace(/\\\*/g, '.?')
    return new RegExp(reg)
  }
  addRule({ id, url, type, methodType, method, name, key, value, icase, enableReg = false, enable = true, enableWildcard = true }) {
    if (this.getRuleById(id)) {
      this.modRule({ id, url, type, methodType, method, name, key, value, icase, enableReg, enable, enableWildcard })
      return
    }
    this.ruleList.push({
      id, url, type, methodType, method, name, key, value, icase, enableReg, enable, enableWildcard
    })
    this.storeRule()
  }
  modRule(option = {}) {
    let ruleObj = this.getRuleById(option.id)
    if (ruleObj) {
      Object.assign(ruleObj, option)
      this.storeRule()
    }
  }
  delRule(id, store = true) {
    let ruleObj = this.getRuleById(id)
    if (ruleObj) {
      this.ruleList = this.ruleList.filter(item => item.id !== id)
      store && this.storeRule()
      return true
    }
    return false
  }
  setEnable(id, enable) {
    let ruleObj = this.getRuleById(id)
    if (ruleObj) {
      ruleObj.enable = enable
      this.storeRule()
    }
  }
  getRuleList() {
    return JSON.parse(JSON.stringify(this.ruleList))
  }
  getRuleById(id) {
    return this.ruleList.find(item => item.id === id)
  }
  clearRule() {
    this.ruleList = []
    this.storeRule()
  }
  async storeRule() {
    let res = await saveRule(encoder.encode(JSON.stringify(this.ruleList)))
    if (res.status === 200) {
      console.log('规则保存成功')
    }
  }
  async restoreRule() {
    let res = await getRule()
    if (res.status === 200) {
      this.ruleList = JSON.parse(getStringFromU8Array(new Uint8Array(res.data)) || '[]')
    }
  }
}