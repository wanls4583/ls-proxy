<template>
  <div class="multipart-wrap">
    <div class="multipart-table">
      <div class="multipart-table-row" v-for="(item, index) in list" :key="index">
        <div class="multipart-table-cell">
          <span style="color:#999">Part {{index}}</span>
        </div>
        <div class="multipart-table-cell">
          <span class="edit-btn" @click="onClickEdit(item)">点击编辑</span>
        </div>
        <div class="multipart-table-cell op">
          <i class="el-icon-remove-outline" @click="onDelete(index)"></i>
        </div>
      </div>
    </div>
    <DialogEditMultpart :visible.sync="editVisible" :part="nowPart" @confirm="onSavePart" />
  </div>
</template>
<script>
import { getU8ArrayFromString } from '../../common/utils'
import DialogEditMultpart from './DialogEditMultpart.vue'
export default {
  components: {
    DialogEditMultpart,
  },
  props: {
    list: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      editVisible: false,
      nowPart: {
        header: {},
        body: null
      }
    }
  },
  created() {
  },
  methods: {
    getHeader(obj) {
      let header = ''
      for (let key in obj) {
        header += `${key}: ${obj[key] || ''}\r\n`
      }
      return header
    },
    getValue(boundary) {
      let list = this.list.filter(item => !item.add)
      let arr = []
      list.forEach(item => {
        let header = this.getHeader(item.header) + '\r\n'
        arr.push(...Array.from(getU8ArrayFromString('--' + boundary + '\r\n')))
        arr = arr.concat(Array.from(getU8ArrayFromString(header)))
        arr = arr.concat(Array.from(item.body))
        arr.push(13, 10)
      })
      if (list.length) {
        arr.push(...Array.from(getU8ArrayFromString('--' + boundary + '--\r\n')))
      }
      return new Uint8Array(arr)
    },
    onClickEdit(item) {
      this.nowPart = item
      this.editVisible = true
    },
    onSavePart({ header, body }) {
      if (Object.keys(header).length) {
        this.nowPart.header = header
        this.nowPart.body = body
        this.nowPart.add = false
      }
    },
    onDelete(index) {
      this.list.splice(index, 1)
    }
  }
}
</script>
<style lang="scss">
.multipart-wrap {
  height: 100%;
  padding: 0 10px 10px 10px;
  .multipart-table {
    width: 100%;
    height: 100%;
    border: 1px solid #464646;
    overflow: auto;

    &-row {
      width: 100%;
      height: 40px;
      display: flex;
      align-items: center;
      border-bottom: 1px solid #464646;
    }

    &-cell {
      width: 50%;
      height: 100%;
      line-height: 38px;
      padding: 0 10px;
      border-right: 1px solid #464646;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;

      &:last-child {
        border-right: 1px solid #464646;
      }

      &.op {
        width: 40px;
        display: flex;
        justify-content: center;
        align-items: center;

        i {
          cursor: pointer;

          &:hover {
            color: #efae22;
          }
        }
      }
    }
  }
  .edit-btn {
    display: flex;
    flex-grow: 1;
    align-items: center;
    padding: 0 15px;
    color: #999;
    user-select: none;
    cursor: pointer;
  }
}
</style>
