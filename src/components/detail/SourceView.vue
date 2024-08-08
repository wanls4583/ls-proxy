<template>
  <div class="detail-source-view" ref="detail">
    <div class="title-wrap">
      <span class="title">原始报文</span>
      <span class="op-wrap">
        <i class="icon icon-copy"></i>
      </span>
    </div>
    <div class="editor-wrap">
      <div class="editor" ref="editor"></div>
    </div>
  </div>
</template>
<script>
import * as monaco from 'monaco-editor';
import { getStringFromU8Array } from '@/common/utils'
export default {
  props: {
    data: {
      type: Array,
      default: () => { return {} }
    },
    id: {
      type: String,
      default: ''
    },
  },
  data() {
    return {
      hexWidth: 8
    }
  },
  created() {
    this.eventBus.$on('refresh-detail-data', () => {
      this.init()
    })
  },
  beforeDestroy() {
    this.editor?.dispose()
    this.eventBus.$off('refresh-detail-data')
  },
  methods: {
    init() {
      this.$nextTick(() => {
        this.editor = this.editor || this.initEditor()
        this.render()
      })
    },
    initEditor() {
      let languageId = 'sourceLanguage'
      if (!window.hasRegisterLanguage) {
        monaco.languages.register({ id: languageId });
        monaco.languages.setMonarchTokensProvider(languageId, {
          tokenizer: {
            root: [
              [/^(GET|POST|OPTION|CONNECT|PUT|PUSH|DELETE)\s/, "method-token"],
              [/HTTP\/[\d\.]+/, "protocol-token"],
              [/\s\d+(\s|$)/, "num-token"],
              [/^[\w\-]+(?=\:)/, "header-token"],
            ],
          },
        })
        window.hasRegisterLanguage = true
      }

      let el = this.$refs.editor;
      let editor = monaco.editor.create(el, {
        readOnly: true,
        minimap: {
          enabled: false
        },
        overviewRulerLanes: 0,
        hideCursorInOverviewRuler: true,
        overviewRulerBorder: false,
        scrollbar: {
          ignoreHorizontalScrollbarInContentHeight: true,
          verticalScrollbarSize: 10,
          verticalSliderSize: 10,
          horizontalScrollbarSize: 10,
          horizontalSliderSize: 10,
          horizontal: 'hidden'
        },
        scrollBeyondLastColumn: 0,
        scrollBeyondLastLine: false,
        contextmenu: false,
        matchBrackets: 'never',
        useShadowDOM: false,
        wordWrap: "on",
        language: languageId,
      });

      return editor
    },
    render() {
      if (this.editor) {
        this.editor.layout()
        requestAnimationFrame(() => {
          this.editor.setValue(getStringFromU8Array(new Uint8Array(this.data)))
          document.activeElement?.blur()
        })
      }
    }
  }
}
</script>