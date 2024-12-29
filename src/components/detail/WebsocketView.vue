<template>
  <div class="detial-websocket-view">
    <ls-table
      :data="messages"
      :hidden-title="true"
      :cellHeight="58"
      :enableHover="false"
      :enableStriped="false"
      :enableActive="false"
    >
      <ls-table-column width="100%">
        <template v-slot="{ row }">
          <div
            class="message-item aequilate-font"
            :key="row.fragId"
            :class="{left: row.side === RULE_TYPE.RES, right: row.side === RULE_TYPE.REQ}"
          >
            <div class="name">{{row.side === RULE_TYPE.RES ? 'S' : 'C'}}</div>
            <div class="contnet">
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
  </div>
</template>

<script>
import { RULE_TYPE } from '../../common/const';
export default {
  data() {
    return {
      RULE_TYPE,
      messages: []
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
      this.messages = messages || []
    },
    onWsMessage(dataObj) {
      this.messages.push(dataObj)
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