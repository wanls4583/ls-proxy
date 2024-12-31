<template>
  <div class="detial-websocket-view">
    <ls-table
      :data="renderList"
      :hidden-title="true"
      :cellHeight="58"
      :enableHover="false"
      :enableStriped="false"
      :enableActive="false"
    >
      <ls-table-column width="100%">
        <template v-slot="{ row }">
          <div class="message-item aequilate-font" v-if="row.type==='time'">
            <div class="time">{{row.timeDisplay}}</div>
          </div>
          <div
            v-else
            class="message-item aequilate-font"
            :key="row.fragId"
            :class="{left: row.side === RULE_TYPE.RES, right: row.side === RULE_TYPE.REQ}"
          >
            <div class="name">{{row.side === RULE_TYPE.RES ? 'S' : 'C'}}</div>
            <div class="contnet" @click="onShowDetail(row)">
              <span v-if="row.opCode==0x01">{{row.wsMessage}}</span>
              <span v-else-if="row.opCode==0x02">二进制数据 {{row.size}}</span>
              <span v-else-if="row.opCode==0x08">close</span>
              <span v-else-if="row.opCode==0x09">ping</span>
              <span v-else-if="row.opCode==0x0A">pong</span>
            </div>
          </div>
        </template>
      </ls-table-column>
    </ls-table>
    <DialogFragment
      v-if="detailDialogVisible"
      :visible.sync="detailDialogVisible"
      :data="detailRow"
    />
  </div>
</template>

<script>
import { RULE_TYPE } from '../../common/const';
import { formatTime } from '../../common/utils';
import DialogFragment from './DialogFragment.vue'
export default {
  components: {
    DialogFragment
  },
  data() {
    return {
      RULE_TYPE,
      preTime: 0,
      gap: 10 * 1000 * 1000, // 10s
      renderList: [],
      detailRow: {},
      detailDialogVisible: false
    };
  },
  created() {
    this.initData()
    this.eventBus.$on('show-websocket', this.onWsMessage)
  },
  beforeDestroy() {
    this.eventBus.$off('show-websocket', this.onWsMessage)
  },
  methods: {
    initData(messages) {
      this.renderList = []
      this.preTime = 0

      messages?.forEach((item, index) => {
        item.timeDisplay = formatTime(item.time - 0, '-', true).result
        if (item.time - this.preTime > this.gap) {
          this.preTime = item.time
          this.renderList.push({
            type: 'time',
            time: item.time,
            timeDisplay: item.timeDisplay
          })
        }
        this.renderList.push(item)
      })
    },
    onWsMessage(item) {
      item.timeDisplay = formatTime(item.time - 0, '-', true).result
      if (item.time - this.preTime > this.gap) {
        this.preTime = item.time
        this.renderList.push({
          type: 'time',
          time: item.time,
          timeDisplay: item.timeDisplay
        })
      }
      this.renderList.push(item)
    },
    onShowDetail(row) {
      this.detailRow = row
      this.detailDialogVisible = true
    }
  }
};
</script>

<style lang="scss">
.detial-websocket-view {
  width: 100%;
  height: 100%;
  .message-item {
    display: flex;
    padding: 10px;
    height: 58px;
    user-select: none;
    .name {
      width: 38px;
      height: 38px;
      flex-shrink: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      border-radius: 50%;
      overflow: hidden;
      background-color: #efae22;
      font-size: 20px;
      font-weight: bold;
      color: #dfdfdf;
    }
    .contnet {
      padding: 8px 12px;
      background-color: #363636;
      border: 1px solid #464646;
      border-radius: 4px;
      font-size: 14px;
      line-height: 20px;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      cursor: pointer;
    }
    .time {
      display: flex;
      width: 100%;
      height: 100%;
      align-items: center;
      justify-content: center;
      color: #999;
    }
    &.left {
      padding-right: 58px;
      .name {
        margin-right: 10px;
      }
    }
    &.right {
      flex-direction: row-reverse;
      padding-left: 58px;
      .name {
        margin-left: 10px;
      }
      .contnet {
        background-color: #369b36;
        border-color: #369b36;
      }
    }
  }
}
</style>