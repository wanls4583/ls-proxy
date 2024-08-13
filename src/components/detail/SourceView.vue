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
import { getCharWidth } from '@/common/utils'
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
      this.needRender = true
      this.render()
    })
  },
  mounted() {
    this.editor = this.initEditor()
  },
  beforeDestroy() {
    this.editor?.dispose()
    this.eventBus.$off('refresh-detail-data')
  },
  methods: {
    initEditor() {
      let languageId = 'sourceLanguage'
      if (!window.hasRegisterLanguage) {
        monaco.languages.register({ id: languageId });
        monaco.languages.setMonarchTokensProvider(languageId, {
          tokenizer: {
            root: [
              [/^(GET|POST|OPTIONS|CONNECT|PUT|PUSH|DELETE)\s/, "method-token"],
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
        stickyScroll: {
          enabled: false
        },
        guides: {
          bracketPairs: false,
          bracketPairsHorizontal: false,
          highlightActiveBracketPair: false,
          highlightActiveIndentation: false,
          indentation: false
        },
        scrollBeyondLastColumn: 0,
        scrollBeyondLastLine: false,
        contextmenu: false,
        matchBrackets: 'never',
        useShadowDOM: false,
        wordWrap: "on",
        wrappingStrategy: 'advanced',
        wrappingIndent: "none",
        language: languageId,
      });

      return editor
    },
    render() {
      if (!this.needRender) {
        return
      }
      this.editor.layout()
      requestAnimationFrame(() => {
        this.charObj = getCharWidth(this.$refs.detail.querySelector('.view-lines'), '<div class="view-line">[dom]</div>')
        if (this.charObj.charWidth) {
          this.editor.setValue(getStringFromU8Array(new Uint8Array(this.data)))
          document.activeElement?.blur()
          this.needRender = false
        }
      })
    }
  }
}
</script>