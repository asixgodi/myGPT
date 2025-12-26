import { ref, watch, type Ref } from 'vue'

export function useTypingEffect(
  sourceRef: Ref<string>,
  options = { speed: 10 },
  stopRef?: Ref<boolean>
) {
  const typeRef = ref('')
  let buffer = ''
  let isTyping = false
  let timer: number | null = null

  const stopNow = () => {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
    buffer = ''
    isTyping = false
  }

  const startType = () => {
    if (isTyping) return
    isTyping = true

    const type = () => {
      if (stopRef?.value) {
        stopNow()
        return
      }

      if (buffer.length > 0) {
        typeRef.value += buffer.charAt(0)
        buffer = buffer.substring(1)
        timer = window.setTimeout(type, options.speed)
      } else {
        isTyping = false
        timer = null
      }
    }

    type()
  }

  // Stop：立刻停住（清空 buffer + 清掉定时器）
  if (stopRef) {
    watch(stopRef, (stopped) => {
      if (stopped) stopNow()
    })
  }

  watch(
    sourceRef,
    (newVal, oldVal) => {
      // 初始化挂载（刷新/加载历史消息）：直接同步全文，不触发打字
      if (oldVal === undefined) {
        typeRef.value = newVal ?? ''
        stopNow()
        return
      }

      // Stop 后不再接收新内容
      if (stopRef?.value) return

      // 新问题开始（assistant 从 '' 开始）：清空状态
      if (newVal === '' && oldVal && oldVal.length > 0) {
        typeRef.value = ''
        stopNow()
        return
      }

      const newContent = (newVal ?? '').substring(typeRef.value.length)
      if (newContent) {
        buffer += newContent
        if (!isTyping) startType()
      }
    },
    { immediate: true }
  )

  return { typeRef, stopNow }
}