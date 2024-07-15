<template>
  <div class="type-filter-wrap">
    <div class="type-group" v-for="(group, index) in typeList" :key="index">
      <div class="item-wrap" v-for="item in group" :key="item.type" :class="{ active: item.active }" @click="onSelectType(item)">
        <div class="item">{{ item.label }}</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TypeFilter',
  data() {
    return {
      typeList: [
        [{ type: 'all', label: 'All', active: false }],
        [
          { type: 'http', label: 'Http', active: false },
          { type: 'https', label: 'Https', active: false },
          { type: 'ws', label: 'Websoket', active: false }
        ],
        [
          { type: 'json', label: 'JSON', active: false },
          { type: 'xml', label: 'XML', active: false },
          { type: 'txt', label: '文本', active: false },
          { type: 'html', label: 'HTML', active: false },
          { type: 'js', label: 'JS', active: false },
          { type: 'image', label: '图片', active: false },
          { type: 'media', label: '媒体', active: false },
          { type: 'bin', label: '二进制', active: false }
        ]
      ],
      activeType: {}
    }
  },
  created() {
    this.activeType = this.typeList[0][0]
  },
  methods: {
    onSelectType(item) {
      if (!item.active) {
        this.activeType = item
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
