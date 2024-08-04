<template>
  <div class="detail-hex-view">
    <div class="title-wrap">
      <span class="title">Hex</span>
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
import hexy from 'hexy'
import * as monaco from 'monaco-editor';
import { getCharWidth } from '@/common/utils'
export default {
  props: {
    data: {
      type: Array,
      default: () => { return {} }
    }
  },
  data() {
    return {

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
      monaco.editor.defineTheme("myTheme", {
        base: "vs",
        inherit: true,
        rules: [],
        colors: {
          "editor.foreground": "#DFDFDF",
          "editor.background": "#2B2B2B",
          "editorCursor.foreground": "#EFAE22",
          "editor.lineHighlightBorder": "#00000000",
          "editor.lineHighlightBackground": "#00000000",
          "editorLineNumber.foreground": "#DFDFDF",
          "editorLineNumber.activeForeground": "#DFDFDF",
          "editor.selectionBackground": "#EFAE22BB",
          "editor.inactiveSelectionBackground": "#EFAE2299BB",
          "scrollbarSlider.background": "#606060",
          "scrollbarSlider.hoverBackground": "#AEAEAE",
          "scrollbarSlider.activeBackground": "#C3C3C3",
        },
      });
      monaco.editor.setTheme("myTheme");

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
        language: 'text/plain',
      });

      return editor
    },
    render() {
      if (this.editor) {
        this.editor.layout()
        this.charObj = getCharWidth(document.querySelector('.view-lines'), '<div class="view-line">[dom]</div>')
        if (this.charObj.charWidth) {
          let wrapWidth = document.querySelector('.monaco-scrollable-element').clientWidth
          let width = Math.floor((wrapWidth - 3 * this.charObj.charWidth - 10) / (4 * this.charObj.charWidth))
          width = width < 1 ? 1 : width 

          let value = hexy.hexy(this.data, { littleEndian: true, numbering: 'none', format: 'twos', radix: 16, width: width })
          this.editor.setValue(value)
        }
      }
    }
  }
}
</script>