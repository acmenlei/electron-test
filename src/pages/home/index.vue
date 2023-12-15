<template>
  <!-- 应用程序信息展示 -->
  <div class="board">
    <div class="action">
      <input type="text">
      <ul class="tags">
        <li v-for="tag in tags" :key="tag">{{ tag }}</li>
      </ul>
      <sub style="margin-left: 10px; font-size: 15px; cursor: pointer;">+</sub>
    </div>
    <div class="list">
      <div draggable="true" @contextmenu="contextMenu($event, idx)" @click="select(idx)"
        :class="{ active: active === idx }" @dblclick="dbclick(copied.text)" class="item"
        v-for="(copied, idx) in copiedBoard" :key="copied.text || copied.url">
        <p class="title">活跃应用：{{ copied.active }}</p>
        <div class="content" v-if="copied.type === 'plain'" v-text="copied.text"></div>
        <img v-else :src="copied.url" />
      </div>
    </div>
  </div>
</template>


<script lang="ts" setup>
import { ipcRenderer } from "electron"
import { onMounted, onUnmounted, ref } from "vue"

const tags = ['链接', '自定义标签']

interface BoardFormat {
  type: string
  text?: string
  html?: string
  url?: string
  active: string
}
const copiedBoard = ref<BoardFormat[]>([])

// 键盘监听
function handleKeyDown(event: any) {
  console.log('触发键盘执行操作')
  // 检测是否按下了 Command 键 (Mac) 或 Ctrl 键 (Windows/Linux)
  const isCommandOrCtrlKey = event.metaKey || event.ctrlKey;
  // 检测是否按下了 'C' 键
  const isCKey = event.key === 'c' || event.keyCode === 67;
  // 如果同时按下了 Command/Ctrl 键和 'C' 键，则执行相应的操作
  if (isCommandOrCtrlKey && isCKey) {
    dbclick(copiedBoard.value[active.value].text)
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})

function dbclick(copied?: string) {
  // console.log('dbclick 通知操作')
  ipcRenderer.send('use-copy-content', copied || '我是图片');
}

function contextMenu(e: any, idx: number) {
  e.preventDefault();
  active.value = idx
  ipcRenderer.send('show-context-menu', { x: e.x, y: e.y });
}

const active = ref(0)

function select(idx: number) {
  active.value = idx
}

ipcRenderer.on("clipboard-changed", (event, origin) => {
  // 如果是图片
  if (origin.type === 'image') {
    copiedBoard.value.unshift({ type: origin.type, url: origin.url, ...origin })
    return
  }
  // 非图片类型
  const trim_text = origin.text.trim()
  const pos = copiedBoard.value.findIndex(item => item.text === trim_text)
  if (pos === -1) {
    if (!trim_text) return
    copiedBoard.value.unshift({ type: origin.type, url: origin.url, ...origin, text: trim_text })
  } else {
    console.log('交换位置到第一位')
    // const record = copiedBoard.value[pos]
    // copiedBoard.value.splice(pos, 1)
    // copiedBoard.value.unshift(record)
  }
})

ipcRenderer.on('use-hot-key', (event, i: number) => {
  console.log('接收到热键', i)
  if (copiedBoard.value.length > i - 1) {
    ipcRenderer.send('use-copy-content', copiedBoard.value[i - 1].text || '我是图片', true);
  }
})

</script>

<style>
* {
  padding: 0;
  margin: 0;
  box-sizing: border-box;
}

.board {
  padding: 10px;
  background: rgb(214, 235, 255);

}

input {
  outline-color: none;
  border: none;
  padding: 2px;
  padding-left: 5px;
  border-radius: 2px;
}

input:focus {
  outline-color: #00b3ff;
}

.action {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 23px;
}

.tags {
  display: flex;
  height: 100%;
  top: 0;
  align-items: center;
  list-style: none;
  font-size: 13px;
}

.tags li {
  cursor: pointer;
  margin-left: 10px;
  background: #fc8989;
  color: #fff;
  padding: 2px;
  border-radius: 5px;
  font-size: 12px;
  transition: transform .3s;
}

.tags li:hover {
  opacity: .8;
  transform: scale(1.05);
}

.list {
  display: flex;
  overflow-x: scroll;
  overflow-y: hidden;
  min-height: calc(300px - 45px);
}

.list::-webkit-scrollbar,
.board::-webkit-scrollbar {
  display: none;
}

.item {
  margin: 10px;
  position: relative;
  height: 200px;
  width: 260px;
  cursor: pointer;
  border-radius: 5px;
  padding-top: 40px;
  background: white;
  user-select: none;
  outline: 4px solid transparent;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
}

.title {
  background: skyblue;
  position: absolute;
  width: 100%;
  font-size: 13px;
  top: 0;
  left: 0;
  border-top-right-radius: 5px;
  border-top-left-radius: 5px;
  line-height: 40px;
  height: 40px;
  padding-left: 8px;
  color: white;
}

.item .content {
  width: 260px;
  padding: 5px;
  font-size: 12px;
  height: 100%;
  overflow: scroll;
}

.item .content::-webkit-scrollbar {
  display: none;
}

.item.active {
  outline-color: #00b3ff;
}

.item img {
  width: 100%;
  min-width: 260px;
  height: 100%;
  object-fit: contain;
}
</style>