import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ChatStorageManager, type SessionInfo, type SessionData, type ChatMessage } from '@/types'

// 获取 ChatStorageManager 单例
const storage = ChatStorageManager.getInstance()
export const useSessionStore = defineStore('session', () => {
    // 只包含基本信息，不包含对话
    const sessionList = ref<SessionInfo[]>([])
    // 当前激活的会话的完整数据
    const currentSession = ref<SessionData | null>(null)
    // 全局加载状态，用于在执行异步操作时显示 loading 提示
    const isLoading = ref(false)

    // 先通过storage.getCurrentSession()得到当前对话，根据对话得到当前id
    const currentSessionId = computed(() => currentSession.value?.info.id || null)
    const currentMessages = computed(() => currentSession.value?.messages || [])

    // 从 ChatStorageManager 同步最新数据到 Pinia State
    // 每次对话数据变更后（切换，创建，删除，重命名）都需要调用此方法
    async function syncStateWithStorage() {
        sessionList.value = storage.getAllSessions()
        currentSession.value = storage.getCurrentSession()
    }

    // 初始化 Store，加载所有初始数据。
    async function initializeStore() {
        isLoading.value = true
        await storage.initializationPromise;
        await syncStateWithStorage()
        isLoading.value = false
    }

    // 创建一个新会话
    async function createNewSession() {
        isLoading.value = true
        await storage.createSession()
        await syncStateWithStorage() // 操作完成后，同步状态
        isLoading.value = false
    }


    // 切换到指定的会话
    async function switchToSession(sessionId: string) {
        storage.switchToSession(sessionId)
        await syncStateWithStorage()
    }

    // 删除一个会话
    async function deleteSession(sessionId: string) {
        if (confirm('确定要删除这个对话吗？此操作不可恢复。')) {
            isLoading.value = true
            await storage.deleteSession(sessionId)
            await syncStateWithStorage()
            isLoading.value = false
        }
    }

    // 重命名当前会话
    async function renameSession(sessionId: string, newTitle: string) {
        if (newTitle && newTitle.trim()) {
            await storage.renameSession(sessionId, newTitle.trim())
            await syncStateWithStorage()
        }
    }
    // 更新当前会话消息列表
    async function updateCurrentMessages(messages: ChatMessage[]) {
        console.log('🏪 Store: 开始更新当前会话消息')
        console.log('🏪 Store: 消息数量:', messages.length)
        console.log('🏪 Store: 当前会话ID:', currentSessionId.value)

        await storage.updateCurrentSession(messages)
        // 只需要更新当前会话的数据即可，避免刷新整个列表
        currentSession.value = storage.getCurrentSession()
        // 同时也需要更新侧边栏的预览信息
        sessionList.value = storage.getAllSessions()

        console.log('🏪 Store: 更新完成')
    }

    /**
     * 清空所有会话
     */
    async function clearAllSessions() {
        if (confirm('确定要清空所有对话吗？此操作不可恢复。')) {
            isLoading.value = true
            await storage.clearAllSessions()
            await syncStateWithStorage()
            isLoading.value = false
        }
    }

    return {
        // State
        sessionList,
        currentSession,
        isLoading,
        // Getters
        currentSessionId,
        currentMessages,
        // Actions
        initializeStore,
        createNewSession,
        switchToSession,
        deleteSession,
        renameSession,
        updateCurrentMessages,
        clearAllSessions,
    }
})