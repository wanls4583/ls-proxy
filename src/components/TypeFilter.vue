<template>
  <div class="type-filter-wrap">
    <div class="type-group" v-for="(group, index) in typeList" :key="index">
      <div
        class="item-wrap"
        v-for="item in group"
        :key="item.type"
        :class="{ active: item.active }"
        @click="onSelectType(item)"
      >
        <div class="item">{{ item.label }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapMutations } from 'vuex'
export default {
  name: 'TypeFilter',
  data() {
    return {
      typeList: [
        [{ type: 'all', label: 'All', active: false }],
        [
          { type: 'http', label: 'Http', active: false },
          { type: 'https', label: 'Https', active: false },
          { type: 'ws', label: 'WS', active: false },
          { type: 'wss', label: 'WSS', active: false },
        ],
        [
          { type: 'html', label: 'HTML', active: false },
          { type: 'css', label: 'CSS', active: false },
          { type: 'js', label: 'JS', active: false },
          { type: 'json', label: 'JSON', active: false },
          { type: 'xml', label: 'XML', active: false },
          { type: 'txt', label: '文本', active: false },
          { type: 'image', label: '图片', active: false },
          { type: 'media', label: '媒体', active: false },
          // { type: 'bin', label: '二进制', active: false }
        ]
      ],
    }
  },
  computed: {
    ...mapState(['resType'])
  },
  created() {
    this.changeResType(this.typeList[0][0].type)
  },
  methods: {
    ...mapMutations(['changeResType']),
    onSelectType(item) {
      if (!item.active) {
        this.changeResType(item.type)
      }
      this.typeList.forEach(group => {
        group.forEach(item => {
          item.active = false
        })
      })
      item.active = !item.active
    }
  }
}
</script>

<style>
</style>
