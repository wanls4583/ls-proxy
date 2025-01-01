<template>
  <div class="detail-source-view" ref="detail">
    <div class="title-wrap" v-if="!hideTitle">
      <span class="title">{{title || languageIdTitle}}</span>
      <span class="op-wrap">
        <i class="icon icon-copy"></i>
      </span>
    </div>
    <div class="editor-wrap" :class="{error: error}">
      <div
        :class="{plain: ['sourceLanguage', 'plaintext'].includes(nowLanguageId)}"
        class="editor"
        ref="editor"
      ></div>
    </div>
  </div>
</template>
<script>
import * as monaco from 'monaco-editor';
import { getStringFromU8Array } from '@/common/utils'
import { getCharWidth } from '@/common/utils'

const dataMap = {}
export default {
  props: {
    title: {
      type: String,
      default: ''
    },
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
    },
    wordWrap: {
      type: Boolean,
      default: true
    },
    error: {
      type: Boolean,
      default: false
    }
  },
  watch: {
    languageId() {
      if (this.languageId) {
        this.editor.getModel().setLanguage(this.languageId)
        this.nowLanguageId = this.languageId
      }
    }
  },
  data() {
    return {
      hexWidth: 8,
      clientWidth: 0,
      clientHeight: 0,
      nowLanguageId: '',
      hexId: '',
    }
  },
  computed: {
    languageIdTitle() {
      if (this.nowLanguageId === 'sourceLanguage') {
        return '原始报文'
      }
      if (this.nowLanguageId === 'plaintext') {
        return '文本'
      }
      return this.nowLanguageId?.toUpperCase()
    },
    dataStore() {
      return dataMap[this.hexId]
    }
  },
  created() {
    this.hexId = Math.random().toString(36).slice(2)
    dataMap[this.hexId] = {}
  },
  mounted() {
    this.editor = this.initEditor()
    this.initResizeEvent()
  },
  beforeDestroy() {
    delete dataMap[this.hexId]
    this.editor?.dispose()
    this.resizeObserver?.unobserve(this.$refs.detail)
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
            if (clientHeight && (this.clientWidth !== clientWidth || this.clientHeight !== clientHeight || this.dataStore.needRenderData)) {
              this.render()
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
                [/^/, '', '@firstLine'],
              ],
              firstLine: [
                [/^(GET|POST|OPTIONS|CONNECT|PUT|PUSH|DELETE)(?=\s)/, "method-token"],
                [/HTTP\/[\d\.]+(?=\s)/, "protocol-token"],
                [/HTTP\/[\d\.]+(?=$)/, "protocol-token", '@otherLine'],
                [/\s\d+(?=\s|$)/, 'num-token', '@otherLine'],
              ],
              otherLine: [
                [/^[a-zA-Z][\w\-]*(?=\:)/, "header-token"],
                [/\s\d*\.\d+([eE][\-+]?\d+)?(?=\s|$)/, 'num-token'],
                [/\s0[xX][0-9a-fA-F]+(?=\s|$)/, 'num-token'],
                [/\s\d+(?=\s|$)/, 'num-token'],
              ]
            },
          })
          window.hasRegisterLanguage = true
        }
      }
      this.nowLanguageId = languageId

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
        wordWrap: this.wordWrap ? 'on' : 'off',
        wrappingStrategy: 'advanced',
        wrappingIndent: "none",
        language: languageId,
      });

      editor.getModel().onDidChangeContent((e) => {
        this.$emit('change')
      })

      return editor
    },
    render(data) {
      data = data || this.dataStore.needRenderData
      this.dataStore.needRenderData = data
      if (this.$refs.detail.clientHeight) {
        this.editor.layout()
      }
      if (!data || !this.$refs.detail.clientHeight) {
        return
      }
      cancelAnimationFrame(this.renderTimer)
      this.renderTimer = requestAnimationFrame(() => {
        this.charObj = getCharWidth(this.$refs.detail.querySelector('.view-lines'), '<div class="view-line">[dom]</div>')
        if (this.charObj.charWidth) {
          this.editor.setValue(getStringFromU8Array(new Uint8Array(data)))
          document.activeElement?.blur()
          this.dataStore.needRenderData = null
        }
      })
    },
    getValue() {
      if (this.dataStore.needRenderData) {
        return getStringFromU8Array(new Uint8Array(this.dataStore.needRenderData))
      } else {
        return this.editor.getValue()
      }
    }
  }
}
</script>