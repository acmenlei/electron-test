<template>
  <h4 class="title">编辑区域</h4>
  <div spellcheck="false" class="edit" contenteditable="true" @paste="handlePaste" ref="editable">
  </div>
</template>

<script lang="ts" setup>
interface DataTransfer {
    dropEffect: string;
    effectAllowed: string;
    files: FileList;
    items: DataTransferItemList;
    types: string[];
    clearData(format?: string): void;
    getData(format: string): string;
    setData(format: string, data: string): void;
    setDragImage(image: Element, x: number, y: number): void;
}
function handlePaste(event: ClipboardEvent) {
  console.log('paste', event)
  const clipboardData = event.clipboardData as DataTransfer;
  const pastedHtml = clipboardData.getData('text/html');
  // 处理粘贴的HTML结构
  insertHtmlIntoEditable(pastedHtml);
  // 阻止默认粘贴行为
  event.preventDefault();
}

function insertHtmlIntoEditable(html: string) {
  const range = window?.getSelection()?.getRangeAt(0);
  const div = document.createElement('div');
  div.innerHTML = html;
  range?.deleteContents();
  range?.insertNode(div);
}
</script>


<style>
.title {
  margin: 50px;
  margin-bottom: 10px;
}

.edit {
  background: #f8f8f8;
  margin: 50px;
  margin-top: 10px;
  padding: 10px;

}
</style>
