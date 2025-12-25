<script lang="ts" setup>
import { computed, watch, ref } from 'vue' 
import { useTypingEffect } from '@/hooks/useTypingEffect'
import type { ChatMessage } from '@/types'
import Loading from '@/components/Loding.vue'
import { markedRender } from '@/libs/highlight'

interface Props {
  message: ChatMessage
  isLast: boolean
  isTalking: boolean
}
const props = defineProps<Props>()
const emit = defineEmits(['scrollToBottom'])

// 【【【核心状态机】】】
// 创建一个明确的渲染模式状态
type RenderMode = 'loading' | 'typing' | 'done'
const renderMode = ref<RenderMode>('done')


// 1. 数据源和打字机 Hook 
const sourceContent = computed(() => props.message.content)
const { typeRef } = useTypingEffect(sourceContent, { speed: 30 })


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
  // 监听所有相关的 props
  [() => props.isLast, () => props.isTalking, () => props.message.content],
  ([isLast, isTalking, content], [prevIsLast, prevIsTalking, prevContent]) => {
    
    // 场景一：判断是否进入 Loading 状态
    // 条件：是最后一条助手消息，AI准备说话，但还没有任何内容
    if (isLast && props.message.role === 'assistant' && isTalking && !content) {
      renderMode.value = 'loading'
      return // 确定状态后，立即退出
    }

    // 场景二：判断是否进入 Typing 状态
    // 条件：是最后一条助手消息，AI正在说话，并且【已经有了内容】
    if (isLast && props.message.role === 'assistant' && isTalking && content) {
      renderMode.value = 'typing'
      return
    }
    
    // 场景三：其他所有情况都应为 Done 状态
    // (历史消息, 用户消息, AI说完话)
    renderMode.value = 'done'

  }, {
    immediate: true // 确保组件加载时立即执行一次，设置初始状态
  }
)

</script>

<template>
  <!-- 模板的渲染完全由 renderMode 控制，绝对不会出现状态冲突 -->
  <Loading v-if="renderMode === 'loading'" />
  <div v-else class="break-words text-base" v-html="finalHtml"></div>
</template>