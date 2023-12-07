<template>
  <h4 class="title">剪切板内容</h4>
  <div class="list">
    <div electron-application-slef @copy="copy" class="item" v-for="copied in copiedBoard" :key="copied.text" v-html="copied.html"></div>
  </div>
  
</template>

<script lang="ts" setup>

import { ipcRenderer } from "electron"
import { ref } from "vue"


interface BoardFormat {
  text: string
  html: string
}
const copiedBoard = ref<BoardFormat[]>([])

function copy() {
  // 复制选中的内容
}

ipcRenderer.on("clipboard-changed", (event, text, html) => {
  const trim_text = text.trim()
  if(copiedBoard.value.findIndex(item => item.text === trim_text) === -1) {
    if(!trim_text) return
    copiedBoard.value.unshift({ text: trim_text, html })
  } else {
    console.log('交换位置到第一位')
  }
})
</script>


<style>
.title {
  margin: 50px;
  margin-bottom: 10px;
}

.list {
  background: #f8f8f8;
  margin: 50px;
  margin-top: 10px;
  padding: 20px;
  border-radius: 5px;


}
.item {
  margin: 10px;
  max-width: 100%;
  overflow: scroll;
  max-height: 200px;
  border-radius: 5px;
  padding: 10px;
  background: white;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
}
</style>
