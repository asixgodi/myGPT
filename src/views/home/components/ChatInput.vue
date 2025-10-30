<script setup lang="ts">
import { DeleteFilled } from '@element-plus/icons-vue'
import { ElButton, ElInput } from 'element-plus'
import { ref } from 'vue'

interface Props {
  isTalking: boolean
  isMobile: boolean
  showSidebar: boolean
}

defineProps<Props>()

const emit = defineEmits(['send', 'delete', 'scroll-bottom'])

const myInput = ref<HTMLInputElement | null>(null)
const messageContent = ref('')

const handleSend = (e?: Event) => {
  if (e) e.preventDefault()

  if (!messageContent.value.trim()) return

  emit('send', messageContent.value)
  messageContent.value = ''
}

const getFocus = () => {
  myInput.value?.focus()
}

const clearContent = () => {
  messageContent.value = ''
}

defineExpose({
  getFocus,
  clearContent,
  myInput
})
</script>
<template>
  <div class="flex flex-nowrap fixed w-full bottom-0 z-39 bg-gray-50 h-20 rounded-full border-1" :class="{ 'px-6': !isMobile, 'px-3 h-14': isMobile,'left-0 w-full':!showSidebar || isMobile,'left-72 w-[calc(100vw-18rem)]':showSidebar && !isMobile }">
    <div class="flex items-center w-full h-full" :class="{ 'max-w-3xl mx-auto': isMobile }">
      <el-input class="input flex-1" :rows="1" type="textarea" ref="myInput" v-model="messageContent" :size="isMobile ? 'default' : 'large'" :disabled="isTalking" @keydown.enter="handleSend" style="--el-input-text-color: #000000" />
      <el-button @click="handleSend" :size="isMobile ? 'default' : 'large'" type="info" class="elBtnStyle ml-5" :class="{ 'text-5xl': !isMobile, 'text-3xl': isMobile }"> Send </el-button>
    </div>
  </div>
</template>

<style scoped>
.triangle {
  display: flex;
  align-items: center;
}

.triangle img {
  width: 24px;
  height: 24px;
}
</style>