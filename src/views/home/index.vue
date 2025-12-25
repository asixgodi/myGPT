<!-- 
 1. 用户交互 & 初始状态管理
输入完成之后触发 send 事件，然后在 sendMessageToAssistant 中处理。
【补充】: 在处理任何逻辑之前，第一步就是立即将 isTalking.value = true。这个状态的改变是同步的，会立刻通过 Vue 的响应式系统传递给所有依赖它的子组件。这有两个立竿见影的效果：一是禁用输入框，防止用户在 AI 响应期间重复提交；二是让 MessageRenderer 组件预先进入“准备”状态，为后续的 Loading 或 Typing 动画做好准备。
2. 乐观 UI 更新
进行乐观更新，将用户发送的内容和一则内容为空、角色为 'assistant' 的消息同步加入到由 Pinia 管理的当前会话消息列表（currentSession.messages）中。这则空消息扮演着一个至关重要的**“UI占位符”**的角色，它确保了界面上已经为即将到来的 AI 回复预留了位置，极大地提升了用户的感知响应速度。
3. API 请求 & 数据流处理
然后向 API 发送请求，并明确要求返回一个可读的流式对象 (ReadableStream)。这种模式相比传统的等待完整响应，能显著降低首字节响应时间（TTFB），让用户能更快地看到内容的生成。接着，我们通过 response.data.getReader() 获取流的读取器（“水龙头”的比喻非常形象！），并通过一个异步递归函数或 while 循环，持续调用 reader.read() 来一块一块地消费服务器推送的二进制数据 (Uint8Array)。
4. 解码与状态更新
将每一块二进制数据通过 TextDecoder 解码为字符串。
【补充】: 对解码后的字符串进行解析（例如用健壮的正则表达式匹配 data: {...} 协议），从中提取出真正的内容增量 (delta.content)。然后，我们执行整个流程中最核心的一步：将这个内容增量追加到 Pinia store 中当前会话的最后一条消息 (即我们第二步创建的那个占位符消息) 的 content 字段上。
由于 Pinia 的状态是深度响应式的，这个简单的字符串追加操作会被 Vue 的响应式系统立即捕获。这个变化会触发父组件 ChatContent 的重新渲染，它在 v-for 循环中，会将这个正在动态增长的 content 连同 isLast、isTalking 等状态，作为新的 props 实时地传递给负责渲染该消息的 MessageRenderer 子组件。这就构成了一条从数据源到视图的、自动化的、高效的更新链路。
5. MessageRenderer 的精细化渲染 (状态机驱动)
MessageRenderer 内部通过 watch 侦听 props 的变化，其渲染逻辑由一个内部的、明确的状态机 (renderMode) 来驱动，确保在任何时刻都只处于一种确定的渲染状态。
【补充】(抖动控制): 当它侦测到自己是最后一条消息（isLast）、AI正在回复（isTalking）但内容（content）仍为空时，它会将状态切换到 'loading'。此时会显示一个加载动画。这个状态的存在至关重要，它优雅地覆盖了从发送请求到接收到第一个数据字节之间的网络延迟和服务器处理时间，有效防止了界面的空窗或抖动。
【补充】(打字机启动): 当第一滴“墨水” (即第一个 content 增量) 通过 props 到达时，组件侦测到 content 不再为空，便立即将状态切换到 'typing'。此时，useTypingEffect hook 开始工作。
useTypingEffect 监听着 content 的持续变化，并将所有增量内容先放入其内部的缓冲区 (buffer) 中。然后，它通过一个 setTimeout 模拟的异步循环，以平滑的速率，逐字地从 buffer 中取出字符并更新到最终用于显示的 typeRef 上。
MessageRenderer 的 finalHtml 计算属性在 typing 状态下，会选择将 typeRef 的纯文本内容进行渲染。这样做是一个关键的保护措施，可以有效防止因 Markdown 或 HTML 标签不完整（例如一个 <div 还没接收到闭合的 >) 而导致的页面布局错乱或解析错误。
6. 自动滚动 (协同工作)
【补充】: 为了实现内容与视图的同步滚动，MessageRenderer 的 finalHtml 每发生一次变化（即每打出一个字），都会通过 emit('content-updated') 向上游的父组件 ChatContent 发送一个事件通知。ChatContent 作为滚动条容器的持有者，它会监听这个事件。一旦监听到，就立即调用自己的 scrollToBottom() 方法，将滚动条实时地拉到最底部。这种子组件上报状态、父组件执行操作的模式，清晰地划分了组件职责，实现了高效的协同工作。
7. 流程结束
当数据流结束 (reader.read() 返回 done: true)，sendMessageToAssistant 函数会执行到 finally 代码块。
【补充】: 在这里，isTalking.value = false 被设置。这个状态变化会再次沿着 props 链路传递到 MessageRenderer，使其 watch 函数侦测到会话结束，从而将内部状态切换到 'done' 模式。进入此模式后，它会执行一次最终的、完整的渲染：使用 props 中完整的 content 字符串，调用 Markdown 解析器（如 marked）并结合代码高亮库（如 highlight.js）生成最终的、格式完美的 HTML。这确保了无论打字过程中如何简化，最终呈现给用户的都是具有完整样式和正确格式的最终结果。 -->

<script setup lang='ts'>
import basicModelList from '@/data/data.json'
import { initCopy, operationKey } from '@/hooks'
import { chat } from '@/libs/gpt'
import { DECODER, sortModelsById } from '@/libs/utils'
import type { ChatMessage } from '@/types'
import { useSessionStore } from '@/stores/useSessionStore'
import {  isMobile } from '@/types'
import { ElMessage } from 'element-plus'
import { debounce } from 'lodash'
import ChatContent from './components/ChatContent.vue'
import ChatInput from './components/ChatInput.vue'
import Header from './components/Header.vue'
import SettingsDialog from './components/SettingsDialog.vue'
import SessionSidebar from '@/components/SessionSidebar.vue'

// Constants
const GPT_VERSION = sortModelsById(basicModelList.data)
const roleAlias = { user: 'ME', assistant: 'AI Studio', system: 'System' }

// State Management
const sessionStore = useSessionStore()
const { getKey, setKey } = operationKey()
const GPT_V = ref('llama-3.3-70b-versatile')
const isTalking = ref(false)
const centerDialogVisible = ref(false)

// Component References
const chatContentRef = ref()
const chatInputRef = ref()
const sidebarRef = ref()

// Sidebar State
const showSidebar = ref(isMobile.value)

// MathJax Handling
const handleMathjaxTypeset = debounce(() => {
  // debounce的计时器结束之后，watchEffect会立即执行一次，并且订阅了messageList的变化，当messageList变化时会再次执行
  watchEffect(() => {
    sessionStore.currentSession?.messages.forEach((message) => {
      if (message.content && message.content.includes('$')) {
        nextTick(() => {
        // 用于异步地查找并渲染页面上所有尚未被处理的数学公式
          window.MathJax.typesetPromise()
        })
      }
    })
  })
}, 200)

// 用于监视整个页面的内容变化，并在变化发生时触发数学公式的渲染。
const checkMathJax = () => {
  // MutationObserver 是一个内置的 JavaScript 对象，用于监视 DOM 树中的变化。
  // 当被观察的DOM节点发生变化时，会执行MutationObserver中的回调函数
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      // 只处理子节点变化的情况并且确保 MathJax 已加载
      if (mutation.type === 'childList' && window.MathJax) {
        handleMathjaxTypeset()
      }
    })
  })

  observer.observe(document.body, {
    childList: true, // 监视子节点的添加或删除
    subtree: true // 监视整个子树的变化
  })
}



const readStreamAndUpdateMessage = async (reader: ReadableStreamDefaultReader<Uint8Array>) => {
  const { done, value } = await reader.read()
  if (done) {
    reader.releaseLock()
    return
  }

  const dataList = DECODER.decode(value).match(/data: \s*({.*?}]})/g)
  if (dataList) {
    dataList.forEach((v: any) => {
      const jsonStr = v.replace('data: ', '')
      const json = JSON.parse(jsonStr)
      const content = json.choices[0].delta.content ?? ''
      
      // 直接更新 store 中的最后一条消息
      if (sessionStore.currentSession) {
        const lastMessage = sessionStore.currentSession.messages[sessionStore.currentSession.messages.length - 1]
        lastMessage.content += content
      }
    })
  }
  await readStreamAndUpdateMessage(reader)
}


// Chat Operations
const sendMessageToAssistant = async (content: string) => {
  if (!content) {
    ElMessage({ message: 'Please enter content', type: 'info' })
    return
  }
  // 增加一个 isTalking 的检查，防止重复发送
  if (isTalking.value) return

  isTalking.value = true

  // 2. 准备要发送给 API 的消息列表 
  let messagesToSend = [...sessionStore.currentMessages]

  const userMessage: ChatMessage = { role: 'user', content }
  messagesToSend.push(userMessage)

  // 3. 乐观更新 UI，这里立即更新用户的消息和一个空的回答 
  sessionStore.currentSession!.messages.push(userMessage)
  sessionStore.currentSession!.messages.push({ role: 'assistant', content: '' })

  try {
    // 使用处理过的 `messagesToSend` 发送请求
    const response = await chat(messagesToSend, getKey(), GPT_V.value)

    if (response.status === 'success' && response.data) {
      // 成功：开始读取流式数据
      await readStreamAndUpdateMessage(response.data.getReader())
    } else {
      const errorMessage = response.error?.message || 'Unknown error occurred'
      // 将错误信息追加到最后一条助手消息中
      const lastMessage = sessionStore.currentSession!.messages[sessionStore.currentSession!.messages.length - 1]
      if (lastMessage.role === 'assistant') {
        lastMessage.content += errorMessage
      }
      ElMessage({ message: errorMessage, type: 'error' })
    }
  } catch (error: any) {
    // 请求本身发生了网络错误等异常
    const errorMessage = error.error?.message || error.message || 'Request failed, please try again'
    
    //将错误信息追加到最后一条助手消息中
    const lastMessage = sessionStore.currentSession!.messages[sessionStore.currentSession!.messages.length - 1]
    if (lastMessage.role === 'assistant') {
      lastMessage.content += errorMessage
    }
    ElMessage({ message: errorMessage, type: 'error' })
  } finally {
    isTalking.value = false
    // 持久化数据：调用 store 的 action 来保存最终的消息列表
    if (sessionStore.currentSession) {
      // 注意：这里不再需要手动序列化，store 的 action 内部会处理
      await sessionStore.updateCurrentMessages(sessionStore.currentSession.messages)
    }
    chatInputRef.value?.getFocus()
  }
}

// UI Event Handlers
const handleConfigClick = () => {
  centerDialogVisible.value = true
}



const handleSaveSettings = (key: string, version: string) => {
  if (!key) {
    ElMessage({ message: 'Please enter API Key', type: 'warning' })
    return
  }
  setKey(key)
  GPT_V.value = version
  ElMessage({ message: 'Saved successfully', type: 'success' })
  centerDialogVisible.value = false
}



const toggleSidebar = () => {
  showSidebar.value = !showSidebar.value
}


// Lifecycle Hooks and Watchers
onMounted(() => {
  if (getKey() === '') {
    centerDialogVisible.value = true
  }
  chatInputRef.value?.getFocus()
  // 挂载的时候初始化store，加载数据
  sessionStore.initializeStore()
  checkMathJax()
  initCopy()
})

// 在MessageRenderer中,在 finalHtml 中生成了一个包含了 <button> 标签的 HTML 字符串。
// 这个按钮还只是一个“死”的 DOM 元素，点击它没有任何反应。
// 当 MessageRenderer 的 finalHtml 更新后，Vue 会将新的 HTML 渲染到真实 DOM 中。
// 这个 DOM 的变化会触发父组件的 onUpdated 钩子。
// 您在这里调用 initCopy()。这个函数会扫描整个文档，找到所有 class 为 .copyNode 的新按钮，然后为它们动态地添加 click 事件监听器。
// onUpdated(() => {
//   nextTick(() => {
//     initCopy()
//   })
// })


</script>


<template>
  <div class="app-layout">
    <Header 
      :show-sidebar="showSidebar" 
      @config="handleConfigClick" 
      @toggle-sidebar="toggleSidebar" 
      class="fixed top-0 left-0 w-full z-50"
    />
    
    <!-- 侧边栏 -->
    <SessionSidebar 
      ref="sidebarRef"
      :show-sidebar="showSidebar"
      @close-sidebar="showSidebar = false"
      class="transition-transform duration-300 ease-in-out"
    />
    
    <!-- 主内容区 -->
    <div class="main-content transition-all duration-300" :class="{ 'ml-0': !showSidebar || isMobile, 'ml-72': showSidebar && !isMobile }">
      <div class="chat-container pt-16 h-screen flex flex-col">
        <div class="flex-1 overflow-hidden" :class="{ 'mb-24': !isMobile, 'mb-10': isMobile }">
          <ChatContent ref="chatContentRef" :messages="sessionStore.currentMessages" :role-alias="roleAlias" :is-mobile="isMobile" :is-talking="isTalking" />
        </div>
        <ChatInput ref="chatInputRef" :is-talking="isTalking" :is-mobile="isMobile" @send="sendMessageToAssistant"  :showSidebar="showSidebar" />
      </div>
    </div>
  </div>
  <SettingsDialog v-model="centerDialogVisible" :api-key="getKey()" :gpt-version="GPT_V" :gpt-version-list="GPT_VERSION" @save="handleSaveSettings" />
</template>

<style scoped>
</style>
