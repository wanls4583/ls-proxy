<template>
  <div class="body-editor-wrap">
    <div class="title-wrap">
      <div>
        <span class="label">数据类型</span>
        <el-select v-model="type" size="small" style="width:100px">
          <el-option
            v-for="item in filterTypeList"
            :label="item.label"
            :value="item.value"
            :key="item.value"
          ></el-option>
        </el-select>
      </div>
      <div v-if="type===2">
        <input type="file" ref="file" style="display:none" @change="onHexFileChange" />
        <i
          class="icon icon-import hover-icon"
          style="font-weight:bold;font-size:18px"
          @click="onImportHex"
        ></i>
      </div>
      <div v-if="type===3">
        <i
          class="icon icon-plus hover-icon"
          style="font-weight:bold;font-size:18px"
          @click="onAddPart"
        ></i>
      </div>
    </div>
    <div class="content-wrap">
      <SourceView ref="source" :hide-title="true" :read-only="false" v-show="type===1" />
      <HexView ref="hex" :hide-title="true" v-show="type===2" />
      <Multipart ref="part" v-show="type===3" :list="partList" />
    </div>
  </div>
</template>
<script>
import SourceView from '../detail/SourceView.vue'
import HexView from '../detail/HexView.vue'
import Multipart from './Multipart.vue'
import { getStringFromU8ArrayWithCheck, getU8ArrayFromString } from '../../common/utils'
import { getHttpHeader } from '../../common/data-utils'
export default {
  name: 'BodyEditor',
  components: {
    SourceView,
    HexView,
    Multipart,
  },
  props: {
    header: {
      type: Object,
      default: () => {
        return {}
      }
    },
    body: {
      type: Uint8Array,
      default: () => {
        return new Uint8Array([])
      }
    },
    hidePart: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      type: 1,
      typeList: [
        {
          label: 'Text',
          value: 1,
        },
        {
          label: 'Binary',
          value: 2,
        },
        {
          label: 'Multipart',
          value: 3,
        },
      ],
      hex: [],
      partList: [{}],
    }
  },
  computed: {
    filterTypeList() {
      return this.typeList.filter(item => !(this.hidePart && item.value === 3))
    }
  },
  watch: {
    header() {
      this.initType()
    },
  },
  created() {
    this.initType()
  },
  methods: {
    initType() {
      this.$nextTick(() => {
        let boundary = this.getBoundary()
        this.hex = Array.from(this.body || [])
        this.partList = []
        this.$refs.hex.render([])
        this.$refs.source.render([])
        if (boundary && !this.hidePart) {
          this.parsePart(boundary)
          this.type = 3
        } else {
          let text = this.body ? getStringFromU8ArrayWithCheck(this.body) : ''
          this.$refs.hex.render([])
          this.$refs.source.render([])
          if (text === false) {
            this.type = 2
            this.$refs.hex.render(this.hex.slice())
          } else {
            this.type = 1
            this.$refs.source.render(this.hex.slice())
          }
        }
      })
    },
    parsePart(boundary) {
      let boundaryArr = Array.from(getU8ArrayFromString('--' + boundary))
      let body = this.body || new Uint8Array([])
      let index = body.search([...boundaryArr, 13, 10])
      if (index == -1) {
        return
      }
      body = body.slice(index + boundaryArr.length + 2)
      while (body.length) {
        let part = {}
        index = body.search([13, 10, 13, 10])
        if (index == -1) {
          return
        }
        part.header = _parseHeader(body.slice(0, index + 2))
        body = body.slice(index + 4)
        index = body.search(boundaryArr)
        if (index == -1) {
          return
        }
        part.body = _parseBody(body.slice(0, index - 2))
        this.partList.push(part)
        if (body[index + boundaryArr.length] !== 13) {
          break
        }
        body = body.slice(index + boundaryArr.length + 2)
      }

      function _parseHeader(data) {
        let obj = {}
        getHttpHeader(obj, data)
        return obj
      }

      function _parseBody(data) {
        return data
      }
    },
    getBoundary() {
      for (let key in this.header) {
        if (key.toLocaleLowerCase() === 'content-type') {
          let r = /boundary\=([^\r\n]+)/.exec(this.header[key] || '')
          return r?.[1] || ''
        }
      }
      return ''
    },
    getBody(boundary) {
      if (this.type === 1) {
        return getU8ArrayFromString(this.$refs.source.getValue())
      } else if (this.type === 2) {
        return new Uint8Array(this.hex)
      } else {
        return this.$refs.part.getValue(boundary)
      }
    },
    checkMultipart() {
      let partList = this.partList.filter(item => !item.add)
      if (this.type === 3 && partList.length) {
        return true
      }
    },
    onImportHex() {
      this.$refs.file.value = ''
      this.$refs.file.click()
    },
    onHexFileChange(e) {
      let file = e.currentTarget.files[0]
      var reader = new FileReader()
      reader.readAsArrayBuffer(file)
      reader.onload = (e) => {
        let buffer = e.target.result
        this.hex = Array.from(new Uint8Array(buffer))
        this.$refs.hex.render(this.hex)
      }
    },
    onAddPart() {
      this.partList.push({
        header: {},
        body: null,
        add: true
      })
    }
  }
}
</script>
<style lang="scss">
.body-editor-wrap {
  display: flex;
  flex-direction: column;
  height: 100%;
  .title-wrap {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 35px;
    flex-shrink: 0;
    padding: 0 10px;
    .label {
      color: #999;
    }
    input {
      border: 0;
    }
  }
  .content-wrap {
    flex-grow: 1;
  }
}
</style>
