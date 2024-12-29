export const RULE_TYPE = {
  REQ: 1, // 请求
  RES: 2 // 响应
}

export const RULE_METHOD_TYPE = {
  RULE_METHOD_HEAD: 1, // 头部
  RULE_METHOD_BODY: 2 // 实体
}

export const RULE_METHOD = {
  MODIFY_PARAM_ADD: 1, // 新增参数
  MODIFY_PARAM_MOD: 2, // 修改参数
  MODIFY_PARAM_DEL: 3, // 删除参数
  MODIFY_HEADER_ADD: 4, // 新增首部
  MODIFY_HEADER_MOD: 5, // 修改首部
  MODIFY_HEADER_DEL: 6, // 删除首部
  MODIFY_BODY_REP: 7, // 替换实体
  MODIFY_BODY_MOD: 8, // 修改实体
  BREAK_POINT: 9 // 断点
}

export const RULE_METHOD_LIST = [
  {
    type: RULE_TYPE.REQ,
    methodType: RULE_METHOD_TYPE.RULE_METHOD_HEAD,
    method: RULE_METHOD.MODIFY_PARAM_ADD,
    value: RULE_TYPE.REQ + '_' + RULE_METHOD.MODIFY_PARAM_ADD,
    label: '新增参数'
  },
  {
    type: RULE_TYPE.REQ,
    methodType: RULE_METHOD_TYPE.RULE_METHOD_HEAD,
    method: RULE_METHOD.MODIFY_PARAM_MOD,
    value: RULE_TYPE.REQ + '_' + RULE_METHOD.MODIFY_PARAM_MOD,
    label: '修改参数'
  },
  {
    type: RULE_TYPE.REQ,
    methodType: RULE_METHOD_TYPE.RULE_METHOD_HEAD,
    method: RULE_METHOD.MODIFY_PARAM_DEL,
    value: RULE_TYPE.REQ + '_' + RULE_METHOD.MODIFY_PARAM_DEL,
    label: '删除参数'
  },
  {
    type: RULE_TYPE.REQ,
    methodType: RULE_METHOD_TYPE.RULE_METHOD_HEAD,
    method: RULE_METHOD.MODIFY_HEADER_ADD,
    value: RULE_TYPE.REQ + '_' + RULE_METHOD.MODIFY_HEADER_ADD,
    label: '新增请求头'
  },
  {
    type: RULE_TYPE.REQ,
    methodType: RULE_METHOD_TYPE.RULE_METHOD_HEAD,
    method: RULE_METHOD.MODIFY_HEADER_MOD,
    value: RULE_TYPE.REQ + '_' + RULE_METHOD.MODIFY_HEADER_MOD,
    label: '修改请求头'
  },
  {
    type: RULE_TYPE.REQ,
    methodType: RULE_METHOD_TYPE.RULE_METHOD_HEAD,
    method: RULE_METHOD.MODIFY_HEADER_DEL,
    value: RULE_TYPE.REQ + '_' + RULE_METHOD.MODIFY_HEADER_DEL,
    label: '删除请求头'
  },
  {
    type: RULE_TYPE.REQ,
    methodType: RULE_METHOD_TYPE.RULE_METHOD_BODY,
    method: RULE_METHOD.MODIFY_BODY_REP,
    value: RULE_TYPE.REQ + '_' + RULE_METHOD.MODIFY_BODY_REP,
    label: '替换请求体'
  },
  {
    type: RULE_TYPE.REQ,
    methodType: RULE_METHOD_TYPE.RULE_METHOD_BODY,
    method: RULE_METHOD.MODIFY_BODY_MOD,
    value: RULE_TYPE.REQ + '_' + RULE_METHOD.MODIFY_BODY_MOD,
    label: '修改请求体'
  },
  {
    type: RULE_TYPE.RES,
    methodType: RULE_METHOD_TYPE.RULE_METHOD_HEAD,
    method: RULE_METHOD.MODIFY_HEADER_ADD,
    value: RULE_TYPE.RES + '_' + RULE_METHOD.MODIFY_HEADER_ADD,
    label: '新增响应头'
  },
  {
    type: RULE_TYPE.RES,
    methodType: RULE_METHOD_TYPE.RULE_METHOD_HEAD,
    method: RULE_METHOD.MODIFY_HEADER_MOD,
    value: RULE_TYPE.RES + '_' + RULE_METHOD.MODIFY_HEADER_MOD,
    label: '修改响应头'
  },
  {
    type: RULE_TYPE.RES,
    methodType: RULE_METHOD_TYPE.RULE_METHOD_HEAD,
    method: RULE_METHOD.MODIFY_HEADER_DEL,
    value: RULE_TYPE.RES + '_' + RULE_METHOD.MODIFY_HEADER_DEL,
    label: '删除响应头'
  },
  {
    type: RULE_TYPE.RES,
    methodType: RULE_METHOD_TYPE.RULE_METHOD_BODY,
    method: RULE_METHOD.MODIFY_BODY_REP,
    value: RULE_TYPE.RES + '_' + RULE_METHOD.MODIFY_BODY_REP,
    label: '替换响应体'
  },
  {
    type: RULE_TYPE.RES,
    methodType: RULE_METHOD_TYPE.RULE_METHOD_BODY,
    method: RULE_METHOD.MODIFY_BODY_MOD,
    value: RULE_TYPE.RES + '_' + RULE_METHOD.MODIFY_BODY_MOD,
    label: '修改响应体'
  }
]

export const [
  TIME_DNS_START,
  TIME_DNS_END,
  TIME_CONNECT_START,
  TIME_CONNECT_END,
  TIME_CONNECT_SSL_START,
  TIME_CONNECT_SSL_END,
  TIME_REQ_START,
  TIME_REQ_END,
  TIME_RES_START,
  TIME_RES_END
] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

export const [
  MSG_REQ_HEAD,
  MSG_REQ_BODY,
  MSG_REQ_BODY_END,
  MSG_RES_HEAD,
  MSG_RES_BODY,
  MSG_RES_BODY_END,
  MSG_WEB_SOCKET,
  MSG_WEB_SOCKET_FRAGMENT,
  MSG_DNS,
  MSG_STATUS,
  MSG_TIME,
  MSG_CIPHER,
  MSG_CERT,
  MSG_RULE_BREAK_REQ,
  MSG_RULE_BREAK_RES,
  MSG_RULE_SCRIPT_REQ,
  MSG_RULE_SCRIPT_RES,
] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]

export const [STATUS_FAIL_CONNECT, STATUS_FAIL_SSL_CONNECT] = [1, 2]

export const [GATEWAY_REFUSE_REQ, GATEWAY_REFUSE_RES, GATEWAY_HANG_REQ, GATEWAY_HANG_RES] = [1, 2, 3, 4]

export const GATEWAY_METHODS = [
  {
    value: GATEWAY_REFUSE_REQ,
    desc: '屏蔽请求'
  },
  {
    value: GATEWAY_REFUSE_RES,
    desc: '屏蔽响应'
  },
  {
    value: GATEWAY_HANG_REQ,
    desc: '挂起请求'
  },
  {
    value: GATEWAY_HANG_RES,
    desc: '挂起响应'
  }
]

export const HTTP_METHODS = ['GET', 'POST', 'HEAD', 'PUT', 'DELETE', 'CONNECT', 'OPTIONS', 'TRACE', 'PATCH']

export const HTTP_STATUS = [
  {
    code: '100',
    desc: 'Continue'
  },
  {
    code: '101',
    desc: 'Switching Protocols'
  },
  {
    code: '102',
    desc: 'Processing'
  },
  {
    code: '103',
    desc: 'Early Hints'
  },
  {
    code: '200',
    desc: 'OK'
  },
  {
    code: '201',
    desc: 'Created'
  },
  {
    code: '202',
    desc: 'Accepted'
  },
  {
    code: '203',
    desc: 'Non-Authoritative Information'
  },
  {
    code: '204',
    desc: 'No Content'
  },
  {
    code: '205',
    desc: 'Reset Content'
  },
  {
    code: '206',
    desc: 'Partial Content'
  },
  {
    code: '207',
    desc: 'Multi-Status'
  },
  {
    code: '208',
    desc: 'Already Reported'
  },
  {
    code: '226',
    desc: 'IM Used'
  },
  {
    code: '300',
    desc: 'Multiple Choice'
  },
  {
    code: '301',
    desc: 'Moved Permanently'
  },
  {
    code: '302',
    desc: 'Found'
  },
  {
    code: '303',
    desc: 'See Other'
  },
  {
    code: '304',
    desc: 'Not Modified'
  },
  {
    code: '305',
    desc: 'Use Proxy'
  },
  {
    code: '306',
    desc: 'unused'
  },
  {
    code: '307',
    desc: 'Temporary Redirect'
  },
  {
    code: '308',
    desc: 'Permanent Redirect'
  },
  {
    code: '400',
    desc: 'Bad Request'
  },
  {
    code: '401',
    desc: 'Unauthorized'
  },
  {
    code: '402',
    desc: 'Payment Required'
  },
  {
    code: '403',
    desc: 'Forbidden'
  },
  {
    code: '404',
    desc: 'Not Found'
  },
  {
    code: '405',
    desc: 'Method Not Allowed'
  },
  {
    code: '406',
    desc: 'Not Acceptable'
  },
  {
    code: '407',
    desc: 'Proxy Authentication Required'
  },
  {
    code: '408',
    desc: 'Request Timeout'
  },
  {
    code: '409',
    desc: 'Conflict'
  },
  {
    code: '410',
    desc: 'Gone'
  },
  {
    code: '411',
    desc: 'Length Required'
  },
  {
    code: '412',
    desc: 'Precondition Failed'
  },
  {
    code: '413',
    desc: 'Payload Too Large'
  },
  {
    code: '414',
    desc: 'URI Too Long'
  },
  {
    code: '415',
    desc: 'Unsupported Media Type'
  },
  {
    code: '416',
    desc: 'Range Not Satisfiable'
  },
  {
    code: '417',
    desc: 'Expectation Failed'
  },
  {
    code: '418',
    desc: `I'm a teapot`
  },
  {
    code: '421',
    desc: 'Misdirected Request'
  },
  {
    code: '422',
    desc: 'Unprocessable Entity'
  },
  {
    code: '423',
    desc: 'Locked'
  },
  {
    code: '424',
    desc: 'Failed Dependency'
  },
  {
    code: '425',
    desc: 'Too Early'
  },
  {
    code: '426',
    desc: 'Upgrade Required'
  },
  {
    code: '428',
    desc: 'Precondition Required'
  },
  {
    code: '429',
    desc: 'Too Many Requests'
  },
  {
    code: '431',
    desc: 'Request Header Fields Too Large'
  },
  {
    code: '451',
    desc: 'Unavailable For Legal Reasons'
  },
  {
    code: '500',
    desc: 'Internal Server Error'
  },
  {
    code: '501',
    desc: 'Not Implemented'
  },
  {
    code: '502',
    desc: 'Bad Gateway'
  },
  {
    code: '503',
    desc: 'Service Unavailable'
  },
  {
    code: '504',
    desc: 'Gateway Timeout'
  },
  {
    code: '505',
    desc: 'HTTP Version Not Supported'
  },
  {
    code: '506',
    desc: 'Variant Also Negotiates'
  },
  {
    code: '507',
    desc: 'Insufficient Storage'
  },
  {
    code: '508',
    desc: 'Loop Detected'
  },
  {
    code: '510',
    desc: 'Not Extended'
  },
  {
    code: '511',
    desc: 'Network Authentication Required'
  }
]

// 拥有图标的文件扩展名
export const extList = [
  '3g2', '3gp', '7z',
  'aac', 'adt', 'ai', 'aiff', 'aly', 'amiga', 'amr', 'ape', 'apk', 'arj', 'asf', 'asm', 'asx', 'au', 'avc', 'avi', 'avs',
  'bak', 'bas', 'bat', 'bmp', 'bom',
  'c', 'cda', 'cdr', 'chm', 'cmd', 'com', 'cpp', 'css', 'csv',
  'dat', 'ddb', 'dif', 'divx', 'dll', 'doc', 'docm', 'docx', 'dot', 'dotm', 'dotx', 'dsl', 'dv', 'dvd', 'dvdaudio', 'dwg', 'dxf',
  'emf', 'env', 'eot', 'eps', 'exe', 'exif',
  'f4v', 'flc', 'fli', 'flv', 'fon', 'font', 'for', 'fpx',
  'gif', 'gz',
  'hdri', 'hlp', 'htm', 'html',
  'int', 'iso',
  'jpeg', 'jpg', 'js', 'json',
  'ksp',
  'lib', 'lic', 'lst', 'lua',
  'm4v', 'mac', 'map', 'md', 'mdf', 'mht', 'mhtml', 'mid', 'midi', 'mkv', 'mmf', 'mod', 'mov', 'mp3', 'mp3pro', 'mp4', 'mpa', 'mpe', 'mpeg', 'mpeg-1', 'mpeg-2', 'mpeg-4', 'mpeg1', 'mpeg2', 'mpeg4', 'mpg', 'msg', 'mts', 'mux',
  'navi',
  'obj', 'ogg', 'otf',
  'pas', 'pcd', 'pcx', 'pdf', 'pic', 'png', 'ppt', 'pptx', 'proe', 'prt', 'psd', 'py',
  'qsv', 'quicktime',
  'ra', 'ram', 'rar', 'raw', 'realaudio', 'rm', 'rmvb', 'rp', 'rtf',
  's48', 'sacd', 'sch', 'sh', 'stp', 'svcd', 'svg', 'swf', 'sys',
  'tga', 'tiff', 'tmp', 'ttc', 'ttf', 'txt',
  'ufo',
  'vcd', 'vob', 'voc', 'vqf',
  'wav', 'wdl', 'webm', 'wki', 'wma', 'wmf', 'wmv', 'wmvhd', 'woff', 'woff2', 'wps', 'wpt',
  'x_t', 'xls', 'xlsm', 'xlsx', 'xlt', 'xltm', 'xltx', 'xmind', 'xml', 'xv', 'xvid',
  'z', 'zip'
]