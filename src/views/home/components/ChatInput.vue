<script setup lang="ts">
import { DeleteFilled, Promotion } from '@element-plus/icons-vue'
import { ElButton, ElInput, ElIcon } from 'element-plus'
import { ref } from 'vue'

interface Props {
  isTalking: boolean
  isMobile: boolean
  showSidebar: boolean
}

defineProps<Props>()

const emit = defineEmits(['send', 'delete', 'scroll-bottom','stop-generate'])

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
  <div class="flex flex-nowrap fixed bottom-0 z-39 bg-gray-50 h-20 rounded-full border-1" :class="{ 'px-6': !isMobile, 'px-3 h-14': isMobile,'left-0 w-full':!showSidebar || isMobile,'left-72 right-0':showSidebar && !isMobile }">
    <div class="flex items-center w-full h-full" :class="{ 'max-w-3xl mx-auto': isMobile }">
      <el-input class="input flex-1 text-md " :rows="1" type="textarea" ref="myInput" v-model="messageContent" :size="isMobile ? 'default' : 'large'" :disabled="isTalking" @keydown.enter="handleSend"  />
      <div class="ml-4 flex items-center space-x-2 text-gray-900" :class="{ 'space-x-1': isMobile }">
        <el-button type="info"  :size="isMobile ? 'default' : 'large'" @click="$emit('stop-generate')" v-if="isTalking">
          <el-icon><DeleteFilled /></el-icon>
        </el-button>
        <el-button type="info" :size="isMobile ? 'default' : 'large'" @click="handleSend" v-else>
          <el-icon><Promotion /></el-icon>
        </el-button>
    </div>
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

/* 强制覆盖 Element Plus 输入框内部样式 */
:deep(.el-textarea__inner) {
  color: #1f2937 !important; /* 使用深灰色 (Tailwind gray-800) */
}
/* 强制覆盖 Element Plus 按钮样式 (针对 type="info") */
:deep(.el-button--info) {
  color: #1f2937 !important; /* 深灰色文字 */
  border-color: #e5e7eb !important;
}
</style>