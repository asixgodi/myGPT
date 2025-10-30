import { ref, watch, type Ref } from 'vue'

export function useTypingEffect(sourceRef: Ref<string>, options = { speed: 10 }) {
    // 处理后的文本,每次追加一个字符时，每次修改 typeRef.value都会触发响应式更新,在MessageRenderer.vue中使用到typeRef时会触发响应式的更新
    const typeRef = ref('')
    let buffer = ''
    let isTyping = false

    const startType = () => {
        if (isTyping) return
        isTyping = true
        const type = () => {
            if (buffer.length > 0) {
                // 从buffer取出一个字符，添加到typeRef
                typeRef.value += buffer.charAt(0)
                // 将已取出的字符从buffer中移除
                buffer = buffer.substring(1)
                // 递归进行打字效果，异步非阻塞的循环
                setTimeout(type, options.speed)
            } else {
                isTyping = false
            }
        }
        type()
    }

    watch(sourceRef, (newVal, oldVal) => {
        // 新问一个问题时，清空打字状态，不然会接着上一个问题打字
        // 就是每当我发送一条新的问题的时候，都会触发这个逻辑，因为我前面的乐观更新当中传的是空字符串
        if (newVal === '' && (oldVal && oldVal.length > 0)) {
            typeRef.value = ''
            buffer = newVal
            return
        }

        // 只截取新增的部分添加到缓冲区,从 typeRef.value.length的位置开始截取，直到字符串末尾​​
        const newContent = newVal.substring(typeRef.value.length)
        if (newContent) {
            buffer += newContent
            if (!isTyping) {
                startType()
            }
        }
    }, { immediate: true })

    return { typeRef }
} 