<script setup lang="ts">
import { DeleteFilled } from '@element-plus/icons-vue'
import { ElButton, ElInput } from 'element-plus'
import { ref } from 'vue'
import { 
  Promotion
} from '@element-plus/icons-vue'
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
  <div class="flex flex-nowrap fixed bottom-0 z-39 bg-gray-50 h-20 rounded-full border-1" :class="{ 'px-6': !isMobile, 'px-3 h-14': isMobile,'left-0 w-full':!showSidebar || isMobile,'left-72 right-0':showSidebar && !isMobile }">
    <div class="flex items-center w-full h-full" :class="{ 'max-w-3xl mx-auto': isMobile }">
      <el-input class="input flex-1 text-md " :rows="1" type="textarea" ref="myInput" v-model="messageContent" :size="isMobile ? 'default' : 'large'" :disabled="isTalking" @keydown.enter="handleSend"  />
      <el-button @click="handleSend" :size="isMobile ? 'default' : 'large'" type="info" class="elBtnStyle ml-5" :class="{ 'text-5xl': !isMobile, 'text-3xl': isMobile }" :disabled="isTalking"> Send </el-button>
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