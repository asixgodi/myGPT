<script setup lang="ts">

import type { ChatMessage } from '@/types'
import { Service, UserFilled } from '@element-plus/icons-vue'
import { ElIcon } from 'element-plus'
import { computed, ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import MessageRenderer from './MessageRenderer.vue'
interface Props {
  messages: ChatMessage[]
  roleAlias: Record<string, string>
  isMobile: boolean
  isTalking: boolean
}

const props = defineProps<Props>()

const chatListDom = ref<HTMLDivElement>()
const showScrollButton = ref(false)

const handleScroll = () => {
  if (!chatListDom.value) return
  // scrollTop是当前滚动条的位置，scrollHeight是整个内容的总高度 ，clientHeight可视区域的高度
  const { scrollTop, scrollHeight, clientHeight } = chatListDom.value
  // 当滚动条底部距离超过200px时，显示返回顶部按钮，scrollTop + clientHeight是我可见区域的底部
  showScrollButton.value = scrollHeight - (scrollTop + clientHeight) > 200
}

// Scroll to bottom
const scrollToBottom = (isSmooth: boolean = false) => {
  if (!chatListDom.value) return
  chatListDom.value.scrollTo({
    // 这里的top的含义：元素内容区域的顶部应该被滚动到距离其容器顶部多远的位置
    top: chatListDom.value.scrollHeight,
    behavior: isSmooth ? 'smooth' : 'auto'
  })
  showScrollButton.value = false
}

onMounted(() => {
  chatListDom.value?.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  chatListDom.value?.removeEventListener('scroll', handleScroll)
})

// Cache markedRender results
// const getRenderedContent = computed(() => (content: string) => {
//   // 返回的是一个可以接收参数的函数，并不是给计算属性本身传值
//   return markedRender(content)
// })

// Auto scroll to bottom when messages change
// watch(
//   () => props.messages,
//   () => {
//     nextTick(() => {
//       scrollToBottom()
//     })
//   },
//   { deep: true }
// )

defineExpose({
  chatListDom,
  scrollToBottom
})
</script>

<!-- 这里v-memo表示，只有当内容或角色变化时，才会重新渲染消息，如果都没变，会复用之前的DOM，避免不必要的渲染 -->
<!-- 结合v-for使用. v-memo可以直接作用于 v-for的循环项上，为​​每个循环项​​单独提供记忆化策略。这里对于遍历出来的每个item,vue会对比v-memo,如果变化了,就重新渲染该节点-->
<template>
  <div class="outer-container h-full" id="chat-message-container">
    <div class="chat-container h-full overflow-y-auto" :class="{ mobile: isMobile, desktop: !isMobile }" ref="chatListDom">
      <div v-for="item of messages.filter((v) => v.role !== 'system')" :key="item.content" v-memo="[item.content, item.role]">
        <!-- 实现消息左右两边排列 flex-row-reverse -->
        <div class="message-wrapper" :class="{ 'flex-row-reverse': item.role === 'user' }">
          <!-- 头像 -->
          <div class="avatar-wrapper" :class="{ 'mobile-avatar': isMobile }">
            <ElIcon :size="isMobile ? 16 : 20" color="#000000">
              <UserFilled v-if="item.role === 'user'" />
              <Service v-else />
            </ElIcon>
          </div>
          <!-- 消息内容 -->
          <div class="message-content px-6 py-4" :class="[item.role, { 'mobile-message px-2': isMobile }]">
            <!-- <div class="break-words text-base" v-show="item.content" v-html="getRenderedContent(item.content)"></div>
            <Loading v-show="!item.content" /> -->
            <MessageRenderer :message="item" :is-last="messages[messages.length - 1] === item" :is-talking="isTalking" @scroll-to-bottom = "scrollToBottom"/>
          </div>
        </div>
      </div>

      <!-- Scroll to bottom button -->
      <Transition name="fade">
        <div v-if="showScrollButton" class="fixed right-6 bottom-32 cursor-pointer bg-black rounded-full shadow-lg hover:bg-opacity-80 transition-all" :class="{ 'right-3 bottom-24 opacity-50': isMobile }" @click="scrollToBottom(true)">
          <div class="bg-black rounded-full p-2">
            <img src="../../../assets/3.svg" alt="ReturnToBottom" class="w-5 h-5" />
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.outer-container {
  width: 100%;
  height: 100%;
  padding: 0;
}

.chat-container {
  padding: 10px 16px;
}

.chat-container.mobile {
  padding-bottom: 20px;
}

.chat-container.desktop {
  padding-bottom: 20px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.message-wrapper {
  display: flex;
  margin-bottom: 16px;
  gap: 8px;
  align-items: flex-start;
}

.avatar-wrapper {
  padding: 6px;
  border-radius: 50%;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  min-width: 32px;
  height: 32px;
}

.mobile-avatar {
  min-width: 28px;
  height: 28px;
  padding: 4px;
}

.message-content {
  border-radius: 1.5rem;
  font-size: 14px;
  line-height: 1.4;
  word-break: break-word;
  max-width: 85%;
}

.message-content.user {
  background-color: #deedd7;
}

.message-content.assistant {
  background-color: #f9f9f9;
}

.mobile-message {
  padding: 8px 12px;
  font-size: 13px;
  max-width: 80%;
}

:deep(pre) {
  margin: 8px 0;
  /* padding: 12px; */
  border-radius: 6px;
  overflow-x: auto;
}

.mobile-message :deep(pre) {
  padding: 8px;
  font-size: 12px;
}
</style>