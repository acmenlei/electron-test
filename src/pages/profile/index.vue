<script setup lang="ts">
import { useRouter } from 'vue-router';
const router = useRouter()

function back() {
  router.back()
}
</script>
<template>
  <div class="">
    我的内容

    <button @click="back">回退</button>
  </div>
</template>
