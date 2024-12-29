const axios = require('axios')

const api = 'http://localhost:8000/api'

export async function request(url, data, conifg = {}) {
  return axios({
    method: conifg.method || 'post',
    url: url,
    data: data,
    responseType: conifg.responseType || 'arraybuffer',
    headers: {
      'Content-Type': conifg.contentType || 'application/octet-stream',
    },
  }).catch((res) => { return res })
}

export function remoteDecode(byteArray, type) {
  return request(`${api}/decompress/${type}`, byteArray)
}

export function clearData() {
  return request(`${api}/put/clear`)
}

export function saveRule(byteArray) {
  return request(`${api}/put/rule`, byteArray)
}

export function saveBreak(byteArray) {
  return request(`${api}/put/break`, byteArray)
}

export function saveScript(byteArray) {
  return request(`${api}/put/script`, byteArray)
}

export function saveMirror(byteArray) {
  return request(`${api}/put/mirror`, byteArray)
}

export function saveGateway(byteArray) {
  return request(`${api}/put/gateway`, byteArray)
}

export function addRootCert(byteArray) {
  return request(`${api}/put/cert_add`, byteArray)
}

export function saveRuleOnOff(enable) {
  return request(`${api}/put/rule/${enable ? 'on' : 'off'}`)
}

export function saveBreakOnOff(enable) {
  return request(`${api}/put/break/${enable ? 'on' : 'off'}`)
}

export function saveScriptOnOff(enable) {
  return request(`${api}/put/script/${enable ? 'on' : 'off'}`)
}

export function saveMirrorOnOff(enable) {
  return request(`${api}/put/mirror/${enable ? 'on' : 'off'}`)
}

export function saveGatewayOnOff(enable) {
  return request(`${api}/put/gateway/${enable ? 'on' : 'off'}`)
}

export function saveProxyOnOff(enable) {
  return request(`${api}/put/proxy/${enable ? 'on' : 'off'}`)
}

export function runBreak(reqId, byteArray) {
  return request(`${api}/put/break/run/${reqId}`, byteArray)
}

export function runScript(reqId, byteArray) {
  return request(`${api}/put/script/run/${reqId}`, byteArray)
}

export function getRule() {
  return request(`${api}/get/rule`, undefined, { responseType: 'json' })
}

export function getBreak() {
  return request(`${api}/get/break`, undefined, { responseType: 'json' })
}

export function getScript() {
  return request(`${api}/get/script`, undefined, { responseType: 'json' })
}

export function getMirror() {
  return request(`${api}/get/mirror`, undefined, { responseType: 'json' })
}

export function getGateway() {
  return request(`${api}/get/gateway`, undefined, { responseType: 'json' })
}

export function getRootCertStatus() {
  return request(`${api}/get/cert_status`, undefined, { responseType: 'json' })
}

export function getRuleOnOff() {
  return request(`${api}/get/rule/on_off`, undefined, { responseType: 'json' })
}

export function getBreakOnOff() {
  return request(`${api}/get/break/on_off`, undefined, { responseType: 'json' })
}

export function getScriptOnOff() {
  return request(`${api}/get/script/on_off`, undefined, { responseType: 'json' })
}

export function getMirrorOnOff() {
  return request(`${api}/get/mirror/on_off`, undefined, { responseType: 'json' })
}

export function getGatewayOnOff() {
  return request(`${api}/get/gateway/on_off`, undefined, { responseType: 'json' })
}

export function getProxyOnOff() {
  return request(`${api}/get/proxy/on_off`, undefined, { responseType: 'json' })
}

export function getCert(reqId) {
  return request(`${api}/get/cert/${reqId}`)
}

export function getReqHead(reqId) {
  return request(`${api}/get/req_head/${reqId}`)
}

export function getResHead(reqId) {
  return request(`${api}/get/res_head/${reqId}`)
}

export function getReqBody(reqId) {
  return request(`${api}/get/req_body/${reqId}`)
}

export function getResBody(reqId) {
  return request(`${api}/get/res_body/${reqId}`)
}

export function getWebsocket(reqId) {
  return request(`${api}/get/websocket/${reqId}`)
}

export function getWebsocketFragment(reqId, fragId) {
  return request(`${api}/get/fragment/${reqId}/${fragId}`)
}