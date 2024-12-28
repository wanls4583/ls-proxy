<template>
  <div class="detial-websocket-view">
    <div class="message-wrap">
      <div class="message-content">
        <div
          v-for="item in messages"
          class="message-item"
          :key="item.fragId"
          :class="{left: item.type === RULE_TYPE.RES, right: item.type === RULE_TYPE.REQ}"
        >
          <div class="name">{{item.type === RULE_TYPE.RES ? 'S' : 'C'}}</div>
          <div class="contnet">{{item.content}}</div>
        </div>
      </div>
    </div>
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
    for (let i = 0; i < 100; i++) {
      this.messages.push({
        fragId: i,
        content: '这是消息' + i,
        type: i % 2 === 0 ? RULE_TYPE.RES : RULE_TYPE.REQ
      });
    }
  },
  methods: {
  }
};
</script>

<style lang="scss">
.detial-websocket-view {
  width: 100%;
  height: 100%;
  .message-wrap {
    position: relative;
    width: 100%;
    height: 100%;
    .message-content {
      position: absolute;
      width: 100%;
      height: 200%;
      overflow: hidden;
    }
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
        padding: 8px;
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
}
</style>