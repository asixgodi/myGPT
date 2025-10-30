<template>
  <div 
    class="w-72 h-[calc(100vh-4rem)] flex flex-col fixed left-0 z-40 top-16 bg-gray-50 border-r-2 border-gray-200 transition-transform duration-500 ease-in-out" 
    :class="{ 'hidden': !showSidebar,'top-16 z-40 h-[calc(100vh-4rem)]':isMobile }"
    v-show="showSidebar || !isMobile"
  >
    <!-- 头部 -->
    <div class="p-4 border-b border-gray-200 bg-white">
      <h2 class="mb-4 text-xl font-semibold text-gray-900">对话列表</h2>
      <button @click="sessionStore.createNewSession" class="new-session-btn" :disabled="isLoading">
        <span class="icon">+</span>
        新建对话
      </button>
    </div>

    <!-- 会话列表 -->
    <div class="flex-1 overflow-y-auto py-2 px-0 min-h-0">
      <div v-if="isLoading" class="loading">
        加载中...
      </div>
      
      <div v-else-if="sessionStore.sessionList.length === 0" class="empty-state">
        <p>暂无对话</p>
        <button @click="sessionStore.createNewSession" class="create-first-btn">
          创建第一个对话
        </button>
      </div>

      <div v-else class="px-2">
        <div
          v-for="session in sessionStore.sessionList"
          :key="session.id"
          :class="['session-item', { 'active': session.id === sessionStore.currentSessionId }]"
          @click="switchToSession(session.id)"
        >
          <div class="flex-1 min-w-0">
            <div class="session-title" :title="session.title">
              {{ session.title }}
            </div>
            <div class="session-preview" v-if="session.lastMessage">
              {{ session.lastMessage }}
            </div>
            <div class="session-meta">
              <span class="message-count">{{ session.messageCount }} 条消息</span>
              <span class="update-time">{{ formatTime(session.updatedAt) }}</span>
            </div>
          </div>
          
          <div class="flex ml-2 gap-1" @click.stop>
            <button @click="renameSession(session)" class="action-btn" title="重命名">
              ✏️
            </button>
            <button @click="sessionStore.deleteSession(session.id)" class="action-btn delete" title="删除">
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部操作 -->
     <!-- flex-shrink-0 0表示不可被压缩 -->
    <div class="flex-shrink-0 p-4 border-t border-gray-200 ">
      <button @click="sessionStore.clearAllSessions" class="w-full px-2 py-2 bg-red-600 text-white hover:bg-red-800 text-sm rounded transition-colors" v-if="sessionStore.sessionList.length > 0">
        清空所有对话
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {  type SessionInfo, isMobile } from '@/types'
import { useSessionStore} from '@/stores/useSessionStore'
// Props
interface Props {
  showSidebar?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showSidebar: false
})

// Emits
const emit = defineEmits<{
  closeSidebar: []
}>()

// 状态管理
const sessionStore = useSessionStore()
const isLoading = computed(() => sessionStore.isLoading)


const renameSession = (session: SessionInfo) => {
  const newTitle = prompt('请输入新的会话标题:', session.title)
  if (newTitle && newTitle.trim()) {
    sessionStore.renameSession(session.id, newTitle.trim())
  }
}

const switchToSession = (sessionId: string) => {
  sessionStore.switchToSession(sessionId)
  // 移动端时，用户切换完对话之后就会隐藏侧边栏
  if (isMobile.value) {
    emit('closeSidebar')
  }
}

// 格式化时间
const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  // 一分钟内
  if (diff < 60 * 1000) {
    return '刚刚'
  }
  
  // 一小时内
  if (diff < 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 1000))} 分钟前`
  }
  
  // 今天
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  
  // 昨天
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) {
    return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  
  // 其他日期
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}


</script>

<style scoped>

.new-session-btn {
  width: 100%;
  padding: 0.75rem 1rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: background-color 0.2s;
}

.new-session-btn:hover:not(:disabled) {
  background: #0056b3;
}

.new-session-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.new-session-btn .icon {
  font-size: 1.2rem;
  font-weight: bold;
}


.loading, .empty-state {
  padding: 2rem 1rem;
  text-align: center;
  color: #6c757d;
}

.create-first-btn {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
}



.session-item {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  margin: 0.25rem 0;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
  border: 1px solid transparent;
}

.session-item:hover {
  background: #f8f9fa;
  border-color: #dee2e6;
}

.session-item.active {
  background: #e7f1ff;
  border-color: #007bff;
}

.session-content {
  flex: 1;
  min-width: 0;
}

.session-title {
  font-weight: 500;
  color: #212529;
  margin-bottom: 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.session-preview {
  font-size: 0.75rem;
  color: #6c757d;
  margin-bottom: 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.session-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.625rem;
  color: #adb5bd;
}

.session-actions {
  display: flex;
  gap: 0.25rem;
  margin-left: 0.5rem;
}

.action-btn {
  width: 1.5rem;
  height: 1.5rem;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  transition: background-color 0.2s;
}

.action-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

.action-btn.delete:hover {
  background: rgba(220, 53, 69, 0.1);
}




/* 滚动条样式 */
.sessions-container::-webkit-scrollbar {
  width: 4px;
}

.sessions-container::-webkit-scrollbar-track {
  background: transparent;
}

.sessions-container::-webkit-scrollbar-thumb {
  background: #dee2e6;
  border-radius: 2px;
}

.sessions-container::-webkit-scrollbar-thumb:hover {
  background: #adb5bd;
}
</style>