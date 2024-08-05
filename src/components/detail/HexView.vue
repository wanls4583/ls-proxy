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
          "editor.selectionBackground": "#EFAE2200",
          "editor.inactiveSelectionBackground": "#EFAE2200",
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
        // selectionHighlight: false, // 无效
        contextmenu: false,
        matchBrackets: 'never',
        useShadowDOM: false,
        language: 'text/plain',
      });

      let decOption = { isWholeLine: false, className: "detail-hex-selection" }
      this.decorations = null
      editor.onDidChangeCursorPosition(e => {
        this.decorations && this.decorations.clear()
      })
      editor.onDidChangeCursorSelection(e => {
        const width = this.hexWidth
        const leftEndColumn = width * 3
        const rightStartColumn = leftEndColumn + 4
        const rightEndColumn = rightStartColumn + width
        const { selection } = e;
        let { startColumn, endColumn, startLineNumber, endLineNumber } = selection

        if (startLineNumber === endLineNumber && startColumn === endColumn) {
          if (startColumn >= leftEndColumn) {
            if (startColumn < rightStartColumn) {
              endColumn = leftEndColumn
              startColumn = endColumn - 2
            } else if (startColumn >= rightEndColumn) {
              endColumn = leftEndColumn
              startColumn = endColumn - 2
            } else {
              startColumn = (startColumn - rightStartColumn) * 3 + 1
              endColumn = startColumn + 2
            }
          } else {
            if ((startColumn - 2) % 3 === 0) {
              startColumn -= 1
            } else if ((startColumn - 3) % 3 === 0) {
              startColumn -= 2
            }
            endColumn = startColumn + 2
          }
        } else {
          if (startColumn >= leftEndColumn) {
            if (startColumn <= rightStartColumn) {
              startColumn = 1
            } else {
              startColumn = (startColumn - rightStartColumn) * 3 + 1
            }
          }
          if (endColumn >= leftEndColumn) {
            if (endColumn <= rightStartColumn) {
              endColumn = leftEndColumn
            } else {
              endColumn = (endColumn - rightStartColumn) * 3
            }
          }
          startColumn = Math.floor(startColumn / 3) * 3 + 1
          endColumn = Math.ceil((endColumn - 1) / 3) * 3
        }

        if (startLineNumber === endLineNumber && startColumn >= endColumn) { // 选中了空格
          startColumn = endColumn - 2
        }

        if (selection.selectionStartLineNumber === selection.startLineNumber && selection.selectionStartColumn === selection.startColumn) {
          editor.setSelections([{
            positionColumn: endColumn,
            positionLineNumber: endLineNumber,
            selectionStartColumn: startColumn,
            selectionStartLineNumber: startLineNumber,
          }])
        } else {
          editor.setSelections([{
            positionColumn: startColumn,
            positionLineNumber: startLineNumber,
            selectionStartColumn: endColumn,
            selectionStartLineNumber: endLineNumber,
          }])
        }

        let ranges = []
        this.decorations && this.decorations.clear()

        if (startLineNumber === endLineNumber) {
          let startColumn2 = startColumn / 3 + rightStartColumn
          let endColumn2 = startColumn2 + (endColumn + 1 - startColumn) / 3
          ranges.push(new monaco.Range(startLineNumber, startColumn, endLineNumber, endColumn))
          ranges.push(new monaco.Range(startLineNumber, startColumn2, endLineNumber, endColumn2))
        } else {
          ranges.push(new monaco.Range(startLineNumber, startColumn, startLineNumber, leftEndColumn))
          ranges.push(new monaco.Range(startLineNumber, startColumn / 3 + rightStartColumn, startLineNumber, rightEndColumn))
          for (let line = startLineNumber + 1; line < endLineNumber; line++) {
            ranges.push(new monaco.Range(line, 1, line, leftEndColumn))
            ranges.push(new monaco.Range(line, rightStartColumn, line, rightEndColumn))
          }
          ranges.push(new monaco.Range(endLineNumber, 1, endLineNumber, endColumn))
          ranges.push(new monaco.Range(endLineNumber, rightStartColumn, endLineNumber, endColumn / 3 + rightStartColumn))
        }

        this.decorations = editor.createDecorationsCollection(ranges.map(range => {
          return {
            range: range,
            options: decOption,
          }
        }));
      })

      return editor
    },
    render() {
      if (this.editor) {
        this.editor.layout()
        this.charObj = getCharWidth(document.querySelector('.view-lines'), '<div class="view-line">[dom]</div>')
        if (this.charObj.charWidth) {
          let wrapWidth = document.querySelector('.monaco-scrollable-element').clientWidth
          let width = Math.floor((wrapWidth - 3 * this.charObj.charWidth - 10) / (4 * this.charObj.charWidth))
          this.hexWidth = width < 1 ? 1 : width

          let value = hexy.hexy(this.data, { littleEndian: true, numbering: 'none', format: 'twos', radix: 16, width: this.hexWidth })
          value = value[value.length - 1] == '\n' ? value.slice(0, -1) : value
          this.editor.setValue(value)
          this.decorations && this.decorations.clear()
          document.activeElement?.blur()
        }
      }
    }
  }
}
</script>