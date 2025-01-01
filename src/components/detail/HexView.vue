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
      <div class="load-more" :class="{visible: loadMoreVisible && scrollToBottom}">
        <i class="icon icon-loadmore" @click="onAddValue"></i>
      </div>
    </div>
  </div>
</template>
<script>
import hexy from 'hexy'
import * as monaco from 'monaco-editor';
import { getCharWidth, writeClipboard } from '@/common/utils'

const dataMap = {}
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
      hexId: '',
      maxRnederByte: 512 * 1024,
      renderLenth: 0,
      loadMoreVisible: false,
      scrollToBottom: false
    }
  },
  computed: {
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
        lineNumbers: (line) => {
          if (this.loadMoreVisible && line >= editor.getModel()?.getLineCount() - 1) {
            return ''
          }
          return line
        },
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

      editor.addAction({
        id: 'selectAll',
        label: 'selectAll',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyA],
        run: () => {
          this.selectAll()
        }
      });

      editor.onDidScrollChange(e => {
        if (e.scrollHeight > 30 && e.scrollHeight - e.scrollTop - this.$refs.editor?.clientHeight < 18) {
          this.scrollToBottom = true
        } else {
          this.scrollToBottom = false
        }
      })

      editor.onMouseDown(e => {
        this.decorations && this.decorations.clear()
        this.startPos = null
        this.preStartPos = null
        this.mousedeDown = true
      })

      editor.onMouseUp(e => {
        this.mousedeDown = false
      })

      editor.onDidChangeCursorPosition(e => {
        const width = this.hexWidth
        let leftEndColumn = width * 3
        let rightStartColumn = leftEndColumn + 4
        let rightEndColumn = rightStartColumn + width
        let originLeftEndColumn = leftEndColumn
        let cols = 0, needUpdate = false
        let { lineNumber, column } = e.position

        if (lineNumber >= this.maxLineNumber) {
          lineNumber = this.maxLineNumber
          leftEndColumn = (this.renderLenth % width) * 3
          leftEndColumn = leftEndColumn === 0 ? originLeftEndColumn : leftEndColumn
          if (e.position.lineNumber > this.maxLineNumber) { // 预留的两行用来显示加载更多
            column = leftEndColumn
          }
        }

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

        if (needUpdate && column !== e.position.column) { // 修正光标位置，使其和16进制对齐
          editor.setPosition(this.nowPos)
          return
        }

        if (!this.mousedeDown) {
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
          ranges.push(new monaco.Range(startLineNumber, startColumn, startLineNumber, originLeftEndColumn))
          ranges.push(new monaco.Range(startLineNumber, startColumn / 3 + rightStartColumn, startLineNumber, rightEndColumn))
          for (let line = startLineNumber + 1; line < endLineNumber; line++) {
            ranges.push(new monaco.Range(line, 1, line, originLeftEndColumn))
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
    selectAll() {
      if (this.maxLineNumber > 10 * 10000) { // 数据太大时候，屏蔽全选，避免卡顿
        return
      }
      const width = this.hexWidth
      const leftEndColumn = width * 3
      this.startPos = { lineNumber: 1, column: 1 }
      this.preStartPos = this.startPos
      this.mousedeDown = true
      this.editor.setPosition({ lineNumber: this.maxLineNumber, column: leftEndColumn })
      this.mousedeDown = false
      this.startPos = null
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
      if (data) {
        this.rendered = false
        this.renderLenth = 0
        this.loadMoreVisible = false
      }
      data = data || this.dataStore.needRenderData
      this.dataStore.needRenderData = data
      if (this.$refs.detail.clientHeight) {
        this.editor.layout()
      }
      if (!data || !this.$refs.detail.clientHeight || this.rendered) {
        return
      }
      cancelAnimationFrame(this.renderTimer)
      this.renderTimer = requestAnimationFrame(() => {
        this.charObj = getCharWidth(this.$refs.detail.querySelector('.view-lines'), '<div class="view-line">[dom]</div>')
        if (this.charObj.charWidth) {
          let value = ''
          let wrapWidth = this.$refs.detail.querySelector('.monaco-scrollable-element').clientWidth
          let width = Math.floor((wrapWidth - 3 * this.charObj.charWidth - 10) / (4 * this.charObj.charWidth))
          this.hexWidth = width < 1 ? 1 : width

          this.maxRnederByte = Math.floor(this.maxRnederByte / this.hexWidth) * this.hexWidth
          data = data.subarray(0, this.maxRnederByte)
          this.renderLenth += data.length
          this.loadMoreVisible = this.dataStore.needRenderData.length > this.renderLenth
          this.rendered = true

          value = hexy.hexy(data, { littleEndian: true, numbering: 'none', format: 'twos', radix: 16, width: this.hexWidth })
          value = value[value.length - 1] == '\n' ? value.slice(0, -1) : value
          value = value[value.length - 1] == '\n' ? value.slice(0, -1) : value
          if (this.loadMoreVisible) {
            value += '\n\n'
          }
          this.value = value
          this.editor.setValue(value)
          this.maxLineNumber = this.editor.getModel()?.getLineCount()
          this.maxLineNumber = this.loadMoreVisible ? this.maxLineNumber - 2 : this.maxLineNumber
          this.decorations && this.decorations.clear()
          this.decorations = null
          this.startPos = null
          document.activeElement?.blur()
        }
      })
    },
    onAddValue() {
      if (this.renderLenth >= this.dataStore.needRenderData.length) {
        return
      }
      let line = this.editor.getModel()?.getLineCount() - 1
      let data = this.dataStore.needRenderData.subarray(this.renderLenth, this.renderLenth + this.maxRnederByte)
      this.renderLenth += data.length
      this.loadMoreVisible = this.dataStore.needRenderData.length > this.renderLenth

      let value = hexy.hexy(data, { littleEndian: true, numbering: 'none', format: 'twos', radix: 16, width: this.hexWidth })
      value = value[value.length - 1] == '\n' ? value.slice(0, -1) : value
      value = value[value.length - 1] == '\n' ? value.slice(0, -1) : value
      if (this.loadMoreVisible) {
        value += '\n\n'
      }

      this.editor.updateOptions({ readOnly: false })
      this.editor.executeEdits('', [{
        range: new monaco.Range(line, 1, line + 2, 1),
        text: value
      }])
      this.editor.updateOptions({ readOnly: true })
      this.maxLineNumber = this.editor.getModel()?.getLineCount()
      this.maxLineNumber = this.loadMoreVisible ? this.maxLineNumber - 2 : this.maxLineNumber
    }
  }
}
</script>