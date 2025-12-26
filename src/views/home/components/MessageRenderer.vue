<script lang="ts" setup>
import { computed, watch, ref, nextTick } from 'vue' 
import { useTypingEffect } from '@/hooks/useTypingEffect'
import type { ChatMessage } from '@/types'
import Loading from '@/components/Loding.vue'
import { markedRender } from '@/libs/highlight'

interface Props {
  message: ChatMessage
  isLast: boolean
  isTalking: boolean
  stopTyping: boolean
}
const props = defineProps<Props>()
const emit = defineEmits(['scrollToBottom'])

// 【【【核心状态机】】】
// 创建一个明确的渲染模式状态
type RenderMode = 'loading' | 'typing' | 'done'
const renderMode = ref<RenderMode>('done')


// 1. 数据源和打字机 Hook 
const sourceContent = computed(() => props.message.content)
const typeEnble = computed(() => props.stopTyping)
const { typeRef } = useTypingEffect(sourceContent, { speed: 30 },typeEnble)


// 2. 最终要渲染的 HTML 
// 打字机效果:当我的typeRef变化时，finalHtml会重新执行这个计算函数,然后重新渲染
const finalHtml = computed(() => {
  let contentToRender = ''
  
  // 根据渲染模式决定使用哪个数据源
  if (renderMode.value === 'typing') {
    contentToRender = typeRef.value
  } else if (renderMode.value === 'done') {
    contentToRender = props.message.content
  }

  if (!contentToRender) return ''

  // 在完成模式下，渲染完整的 Markdown
  return markedRender(contentToRender)
})


// 无法在这个子组件定义一个scrollToBottom，是因为，滚动条在ChatContent那里才存在，当前组件是没有的
watch(finalHtml, () => {
  // 只有在打字模式下，内容变化才需要自动滚动
  if (renderMode.value === 'typing') {
    nextTick(() => {
      emit('scrollToBottom')
    })
  }
})

// 3.
// 使用 watch 来控制 renderMode
watch(
  // 监听所有相关的状态（包含 typeRef.length，用于判断“打字是否追平”）
  [() => props.isLast, () => props.isTalking, () => props.message.role,() => props.stopTyping, () => props.message.content, () => typeRef.value.length],
  ([isLast, isTalking, role, stopTyping, content, typedLen]) => {
    // 只有“最后一条助手消息”才需要 loading/typing 状态，其他一律 done
    if (!isLast || role !== 'assistant') {
      renderMode.value = 'done'
      return
    }

    // 场景一：最后一条助手消息，AI准备说话但还没内容 -> loading
    if (isTalking && !content) {
      renderMode.value = 'loading'
      return
    }

    if( stopTyping ){
      renderMode.value = 'done'
      return
    }

    // 场景二：有内容时进入 typing；请求结束后也要等打字追平再 done
    if (content) {
      const isCaughtUp = typedLen >= content.length
      if (isTalking || !isCaughtUp) {
        renderMode.value = 'typing'
        return
      }
      renderMode.value = 'done'
      return
    }

    renderMode.value = 'done'
  }, {
    immediate: true // 确保组件加载时立即执行一次，设置初始状态
  }
)
// onMounted(()=>{
//   console.log('mount',props.message)
// })

// onUnmounted(()=>{
//   console.log('unmount',props.message)
// })
</script>

<template>
  <!-- 模板的渲染完全由 renderMode 控制，绝对不会出现状态冲突 -->
  <Loading v-if="renderMode === 'loading'" />
  <div v-else class="break-words text-base" v-html="finalHtml"></div>
</template>