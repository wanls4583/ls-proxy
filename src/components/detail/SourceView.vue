<template>
  <div class="detail-source-view" ref="detail">
    <div class="title-wrap" v-if="!hideTitle">
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
    hideTitle: {
      type: Boolean,
      default: false
    },
    languageId: {
      type: String,
      default: ''
    },
    readOnly: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      hexWidth: 8,
      clientWidth: 0,
      clientHeight: 0,
    }
  },
  created() {
  },
  mounted() {
    this.editor = this.initEditor()
    this.initResizeEvent()
  },
  beforeDestroy() {
    this.editor?.dispose()
    this.resizeObserver?.unobserve(this.$refs.detail)
    this.needRenderData = null
    this.renderedData = null
  },
  methods: {
    initResizeEvent() {
      this.resizeObserver = new ResizeObserver(entries => {
        if (this.resizeTimer) {
          return
        }
        this.resizeTimer = setTimeout(() => {
          if (this.$refs.detail) {
            let clientWidth = this.$refs.detail?.clientWidth
            let clientHeight = this.$refs.detail?.clientHeight
            if (clientHeight && (this.clientWidth !== clientWidth || this.clientHeight !== clientHeight || this.needRenderData)) {
              this.render(this.needRenderData || this.renderedData)
            }
            this.clientWidth = clientWidth
            this.clientHeight = clientHeight
          }
          this.resizeTimer = null
        }, 50)
      })
      this.resizeObserver.observe(this.$refs.detail)
    },
    initEditor() {
      let languageId = this.languageId
      if (!languageId) {
        languageId = 'sourceLanguage'
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
      }

      let el = this.$refs.editor;
      let editor = monaco.editor.create(el, {
        readOnly: this.readOnly,
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
    render(data) {
      data = data || this.needRenderData
      this.needRenderData = data
      this.editor.layout()
      if (!data || !this.$refs.detail.clientHeight) {
        return
      }
      requestAnimationFrame(() => {
        this.charObj = getCharWidth(this.$refs.detail.querySelector('.view-lines'), '<div class="view-line">[dom]</div>')
        if (this.charObj.charWidth) {
          this.editor.setValue(getStringFromU8Array(new Uint8Array(data)))
          document.activeElement?.blur()
          this.needRenderData = null
          this.renderedData = data
        }
      })
    },
    getValue() {
      if (this.needRenderData) {
        return getStringFromU8Array(new Uint8Array(this.needRenderData))
      } else {
        return this.editor.getValue()
      }
    }
  }
}
</script>