const axios = require('axios')

const api = 'http://localhost:8000/api'

export function request(url, data, conifg = {}) {
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

export function saveRuleOnOff(enable) {
  return request(`${api}/put/rule/${enable ? 'on' : 'off'}`)
}

export function getRule() {
  return request(`${api}/get/rule`, undefined, { responseType: 'json' })
}

export function getRuleOnOff() {
  return request(`${api}/get/rule/on_off`, undefined, { responseType: 'json' })
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