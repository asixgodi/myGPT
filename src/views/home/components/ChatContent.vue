<script setup lang="ts">

import type { ChatMessage } from '@/types'
import { Service, UserFilled } from '@element-plus/icons-vue'
import { ElIcon } from 'element-plus'
import { computed, ref, watch, nextTick } from 'vue'
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller'
import MessageRenderer from './MessageRenderer.vue'
interface Props {
  messages: ChatMessage[]
  roleAlias: Record<string, string>
  isMobile: boolean
  isTalking: boolean,
  stopTyping: boolean
}

const props = defineProps<Props>()

const scrollerRef = ref()
const showScrollButton = ref(false)

//预处理消息 虚拟滚动需要传入一个数组、并且每个消息需要一个唯一的ID
const processedMessages = computed(() => {
  return props.messages.filter((v) => v.role !== 'system').map((item, index) => {
    // 保持 _vid 稳定，不包含 content.length
    return {
      ...item,
      _vid: `${index}-${item.role}`
    }
  })
})

const handleScroll = (event:Event,scrollListener:any) => {
  const target = event.target as HTMLElement
  if (!target) return
  // scrollTop是当前滚动条的位置，scrollHeight是整个内容的总高度 ，clientHeight可视区域的高度
  const { scrollTop, scrollHeight, clientHeight } = target
  // 当滚动条底部距离超过200px时，显示返回顶部按钮，scrollTop + clientHeight是我可见区域的底部
  showScrollButton.value = scrollHeight - (scrollTop + clientHeight) > 200
}

// Scroll to bottom
const scrollToBottom = () => {
  if (!scrollerRef.value) return
  scrollerRef.value.scrollToBottom()
  showScrollButton.value = false
}

// onMounted(() => {
//   chatListDom.value?.addEventListener('scroll', handleScroll)
// })

// onUnmounted(() => {
//   chatListDom.value?.removeEventListener('scroll', handleScroll)
// })

// 监听消息变化自动滚动
watch(
  () => props.messages.length,
  () => {
    // 只有当用户原本就在底部，或者正在对话时，才自动滚动
    // 这里简单处理：有新消息就滚到底部
    nextTick(() => {
      scrollToBottom()
    })
  }
)

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
  scrollerRef,
  scrollToBottom
})
</script>


<template>
  <div class="outer-container h-full" id="chat-message-container">
    <!-- 
      为什么这里有插槽呢，我当前组件（父组件），将数据传给我的子组件DynamicScroller，然后循环是在子组件里面做的，
      然后子组件通过slot将每一项的数据回传给当前组件，由当前组件来决定每一项的样式。 
     -->
    <DynamicScroller
      ref="scrollerRef"
      class="chat-container h-full overflow-y-auto"
      :class="{ mobile: isMobile, desktop: !isMobile }"
      :items="processedMessages"               
      :min-item-size="40"
      key-field="_vid"
      @scroll="handleScroll"
    >
      <!-- 默认插槽，解构出 item, index, active -->
      <template #default="{ item, index, active }">
        <!-- 
          DynamicScrollerItem 是必须的包裹层 
          :item="item" :active="active" :size-dependencies="[item.content]"
          size-dependencies: 当这数组里的内容变化时，通知 scroller 重新计算该项高度
        -->
        <DynamicScrollerItem
          :item="item"
          :active="active"
          :size-dependencies="[item.content]"
          :data-index="index"
        >
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
              <MessageRenderer 
                :message="item" 
                :is-last="index === processedMessages.length - 1" 
                :is-talking="isTalking" 
                @scroll-to-bottom="scrollToBottom"
                :stop-typing="stopTyping"
              />
            </div>
          </div>
        </DynamicScrollerItem>
      </template>
    </DynamicScroller>

      <!-- Scroll to bottom button -->
      <Transition name="fade">
        <div v-if="showScrollButton" class="fixed right-6 bottom-32 cursor-pointer bg-black rounded-full shadow-lg hover:bg-opacity-80 transition-all" :class="{ 'right-3 bottom-24 opacity-50': isMobile }" @click="scrollToBottom()">
          <div class="bg-black rounded-full p-2">
            <img src="../../../assets/3.svg" alt="ReturnToBottom" class="w-5 h-5" />
          </div>
        </div>
      </Transition>
    </div>
</template>

<style scoped>
.vue-virtual-scroller {
  height: 100%; 
  overflow-y: auto; 
}
.outer-container {
  width: 100%;
  height: 100%;
  padding: 0;
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
  padding: 10px 16px;
  display: flex;
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