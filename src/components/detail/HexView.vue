<template>
  <div class="detail-hex-view" ref="detail">
    <div class="title-wrap" v-if="!hideTitle">
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
import { getCharWidth, writeClipboard } from '@/common/utils'

export default {
  props: {
    hideTitle: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      hexWidth: 8,
      clientWidth: 0,
      clientHeight: 0,
      value: '',
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
    this.startPos = null
    this.nowPos = null
    this.value = ''
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
        unicodeHighlight: {
          ambiguousCharacters: false,
          invisibleCharacters: false,
          includeStrings: false,
          includeComments: false,
          nonBasicASCII: false
        },
        renderControlCharacters: false,
        scrollBeyondLastColumn: 0,
        scrollBeyondLastLine: false,
        contextmenu: false,
        matchBrackets: 'never',
        useShadowDOM: false,
        language: 'text/plain',
      });

      let decOption = { isWholeLine: false, className: "detail-hex-selection" }
      this.decorations = null

      // addCommand 会污染其他实例
      // editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyC, () => {
      //   if (this.preStartPos && this.nowPos && this.value) {
      //     let text = this.getText(this.preStartPos, this.nowPos, this.value)
      //     writeClipboard(text || '')
      //   }
      // });

      editor.addAction({
        id: 'copy',
        label: 'copy',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyC],
        run: () => {
          if (this.preStartPos && this.nowPos && this.value) {
            let text = this.getText(this.preStartPos, this.nowPos, this.value)
            writeClipboard(text || '')
          }
        }
      });

      editor.onMouseDown(e => {
        this.decorations && this.decorations.clear()
        this.preStartPos = null
      })

      editor.onMouseUp(e => {
        this.startPos = null
      })

      editor.onDidChangeCursorPosition(e => {
        const width = this.hexWidth
        const leftEndColumn = width * 3
        const rightStartColumn = leftEndColumn + 4
        const rightEndColumn = rightStartColumn + width
        let cols = 0, needUpdate = false
        let { lineNumber, column } = e.position

        if (column < leftEndColumn) {
          cols = Math.floor((column - 1) / 3)
          if (column - 1 >= cols * 3 + 2) {
            cols++;
          }
          needUpdate = true
        } else if (column < rightStartColumn) {
          cols = width
          needUpdate = true
        } else {
          cols = column - rightStartColumn
        }

        column = cols * 3 + 1
        column = column > leftEndColumn ? leftEndColumn : column

        this.nowPos = { lineNumber, column }
        this.startPos = this.startPos || this.nowPos
        this.preStartPos = this.startPos

        if (needUpdate && column !== e.position.column) {
          editor.setPosition(this.nowPos)
          return
        }

        let ranges = []
        let [startLineNumber, startColumn, endLineNumber, endColumn] = [this.startPos.lineNumber, this.startPos.column, this.nowPos.lineNumber, this.nowPos.column]
        if (startLineNumber > endLineNumber || startLineNumber === endLineNumber && startColumn > endColumn) {
          startLineNumber = this.nowPos.lineNumber
          startColumn = this.nowPos.column
          endLineNumber = this.startPos.lineNumber
          endColumn = this.startPos.column
        }

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

        this.decorations && this.decorations.clear()
        this.decorations = editor.createDecorationsCollection(ranges.map(range => {
          return {
            range: range,
            options: decOption,
          }
        }));
      })

      return editor
    },
    getText(startPos, nowPos, value) {
      const leftEndColumn = this.hexWidth * 3
      let [startLineNumber, startColumn, endLineNumber, endColumn] = [startPos.lineNumber, startPos.column, nowPos.lineNumber, nowPos.column]
      if (startLineNumber > endLineNumber || startLineNumber === endLineNumber && startColumn > endColumn) {
        startLineNumber = nowPos.lineNumber
        startColumn = nowPos.column
        endLineNumber = startPos.lineNumber
        endColumn = startPos.column
      }

      let text = ''
      let values = value.split('\n')
      if (startLineNumber === endLineNumber) {
        text += values[startLineNumber - 1].slice(startColumn - 1, endColumn - 1)
      } else {
        text += values[startLineNumber - 1].slice(startColumn - 1, leftEndColumn - 1)
        for (let line = startLineNumber + 1; line < endLineNumber; line++) {
          text += '\n' + values[line - 1].slice(0, leftEndColumn - 1)
        }
        text += '\n' + values[endLineNumber - 1].slice(0, endColumn - 1)
      }
      text = text[text.length - 1] == ' ' ? text.slice(0, -1) : text

      return text
    },
    render(data) {
      data = data || this.needRenderData
      this.needRenderData = data
      if (this.$refs.detail.clientHeight) {
        this.editor.layout()
      }
      if (!data || !this.$refs.detail.clientHeight) {
        return
      }
      requestAnimationFrame(() => {
        this.charObj = getCharWidth(this.$refs.detail.querySelector('.view-lines'), '<div class="view-line">[dom]</div>')
        if (this.charObj.charWidth) {
          let value = ''
          let wrapWidth = this.$refs.detail.querySelector('.monaco-scrollable-element').clientWidth
          let width = Math.floor((wrapWidth - 3 * this.charObj.charWidth - 10) / (4 * this.charObj.charWidth))
          this.hexWidth = width < 1 ? 1 : width

          value = hexy.hexy(data, { littleEndian: true, numbering: 'none', format: 'twos', radix: 16, width: this.hexWidth })
          value = value[value.length - 1] == '\n' ? value.slice(0, -1) : value
          this.value = value
          this.editor.setValue(value)
          this.decorations && this.decorations.clear()
          document.activeElement?.blur()
          this.needRenderData = null
          this.startPos = null
          this.renderedData = data
        }
      })
    }
  }
}
</script>