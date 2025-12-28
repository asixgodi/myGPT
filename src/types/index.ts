import { computed, ref } from 'vue'

const windowWidth = ref(window.innerWidth)

// // 监听窗口大小变化，添加在window这个全局对象上的，页面关闭的时候会自动销毁
// window.addEventListener('resize', () => {
//   windowWidth.value = window.innerWidth
// })

// 监听窗口大小变化（使用 requestAnimationFrame 进行节流：最多每帧更新一次）
// 会把requestAnimationFrame的回调放入绘制任务队列里
let resizeRafId = 0
const onResize = () => {
  if (resizeRafId) return
  resizeRafId = requestAnimationFrame(() => {
    windowWidth.value = window.innerWidth
    resizeRafId = 0
  })
}
// 添加在 window 这个全局对象上的监听，页面关闭时浏览器会自动销毁
// 使用 passive 提示浏览器该监听不会调用 preventDefault，提高滚动/渲染性能
window.addEventListener('resize', onResize, { passive: true })

// 判断是否是移动设备
export const isMobile = computed(() => windowWidth.value <= 768)

// export const initMsg: ChatMessage[] = [
//   {
//     role: 'system',
//     content: 'I want you to act as a professional programmer, providing rigorous and comprehensible answers to my questions. When I present you with a programming query or scenario, respond with the precision and clarity expected of an experienced developer. Ensure your explanations are thorough yet easy to understand, employing technical terminology accurately. Your responses should reflect the expertise and insight of a seasoned programmer, aiding in not just solving the presented issue, but also offering a deeper understanding of the underlying concepts involved.'
//   },
//   {
//     role: 'assistant',
//     content: 'Hello, I am the Magic Conch Shell. Feel free to ask me any questions.'
//   }
// ]

export type Role = 'user' | 'assistant' | 'system'

export interface ChatMessage {
  role: Role
  content: string
}

class DatabaseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DatabaseError'
  }
}

// 会话相关的类型定义
export interface SessionInfo {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  messageCount: number
  lastMessage?: string
}

// 每创建一个会话，就会有一个对应的SessionData对象
export interface SessionData {
  info: SessionInfo
  messages: ChatMessage[]
}

// 
export class ChatStorageManager {
  private static instance: ChatStorageManager | null = null
  private sessions: Map<string, SessionData> = new Map()
  private currentSessionId: string | null = null

  public initializationPromise: Promise<void>;

  // 数据库的名称
  private readonly dbName = 'ChatAppDB'
  private readonly dbVersion = 2
  // 数据表的名称
  private readonly objectStoreName = 'chatRecords'
  // 数据表中的键名
  private readonly sessionsKey = 'sessionsData'
  // 数据表中的键名
  private readonly currentSessionKey = 'currentSessionId'
  private readonly isIndexedDBSupported = 'indexedDB' in window

  // 创建实例的时候就初始化整个数据库，如果一开始没有数据，就创建一个新的会话
  private constructor() {
    this.initializationPromise = this.initializeSessions();
  }


  // 单例模式，创建唯一的实例
  public static getInstance(): ChatStorageManager {
    if (!ChatStorageManager.instance) {
      ChatStorageManager.instance = new ChatStorageManager()
    }
    return ChatStorageManager.instance
  }

  private async initializeSessions(): Promise<void> {
    try {
      await this.loadSessions()
    } catch (error) {
      console.error('Failed to initialize sessions:', error)
    }
  }
  //  IndexedDB 是一个较早期的浏览器 API。它的设计是事件驱动 (Event-driven) 的，而不是基于 Promise 的。
  //  当执行indexedDB.open() 或 objectStore.get()，它不会立即返回一个 Promise。相反，
  //  它会返回一个 request 对象。您必须为这个 request 对象挂载事件监听器，比如 onsuccess 和 onerror，来处理操作成功或失败后的结果。
  // 连接与初始化数据库，为什么用Promise包裹，因为IndexedDB的API是事件驱动（异步的），它不直接支持async/await
  private async initDB(): Promise<IDBDatabase> {
    if (!this.isIndexedDBSupported) {
      throw new DatabaseError('IndexedDB not supported')
    }

    return new Promise((resolve, reject) => {
      // 发起连接请求
      const request = indexedDB.open(this.dbName, this.dbVersion)

      // 监听三个关键事件，失败，成功
      request.onerror = () => reject(new DatabaseError('Failed to open IndexedDB'))
      request.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result)
      // 这个事件只在两种情况下触发，一是数据库第一次创建，二是版本号升级
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(this.objectStoreName)) {
          db.createObjectStore(this.objectStoreName)
        }
      }
    })
  }

  // 将数据从indexDB加载到内存中,如果不存在数据的话，就立即新建一个对话
  private async loadSessions(): Promise<void> {
    try {
      if (this.isIndexedDBSupported) {
        try {
          const db = await this.initDB()
          // 创建一个事务，IndexedDB 中的所有读写操作都必须在事务中进行，默认模式是只读
          const transaction = db.transaction([this.objectStoreName])
          // 从事务中获取对象仓库（表）
          const objectStore = transaction.objectStore(this.objectStoreName)
          // [string, SessionData] 的意思是“一个长度为 2 的数组，其中第一个元素必须是 string 类型，存放的该会话的id，第二个元素必须是 SessionData 类型，存的是该会话的所有信息和数据”。
          // Type[] 的意思是“一个由 Type 类型的元素组成的数组”。返回一个数组
          const sessionsData = await new Promise<[string, SessionData][]>((resolve) => {
            const request = objectStore.get(this.sessionsKey)
            request.onsuccess = () => resolve(request.result || [])
            request.onerror = () => resolve([])
          })
          // 
          const currentId = await new Promise<string | null>((resolve) => {
            const request = objectStore.get(this.currentSessionKey)
            request.onsuccess = () => resolve(request.result || null)
            request.onerror = () => resolve(null)
          })

          // 代码中使用的是map结构，indexDB中是数组的形式存在的，所以这里要将数组转换回来map，map结构更方便操作
          this.sessions = new Map(sessionsData)
          this.currentSessionId = currentId
        } catch {
          // 降级到 localStorage
          this.loadFromLocalStorage()
        }
      } else {
        this.loadFromLocalStorage()
      }
      // 如果一开始数据库是空的，就创建一个新的会话
      if (this.sessions.size === 0) {
        await this.createSession()
      }
    } catch (error) {
      console.error('Failed to load sessions:', error)
      await this.createSession()
    }
  }

  private loadFromLocalStorage(): void {
    try {
      const record = localStorage.getItem('chat_sessions')
      if (record) {
        const data = JSON.parse(record)
        this.sessions = new Map(data.sessions || [])
        this.currentSessionId = data.currentSessionId || null
      }
    } catch (err) {
      console.error('Failed to load from localStorage:', err)
    }
  }

  // 将数据写入indexDB
  private async saveSessions(): Promise<void> {
    try {
      if (this.isIndexedDBSupported) {
        try {
          const db = await this.initDB()
          // 创建一个读写事务
          const transaction = db.transaction([this.objectStoreName], 'readwrite')
          const objectStore = transaction.objectStore(this.objectStoreName)
          // objectStore.put(value, key): put 方法非常智能，它是一个“更新或插入”(upsert)操作。
          // 我的sessions是一个Map结构，不能直接存储，所以要转换成数组
          objectStore.put(Array.from(this.sessions.entries()), this.sessionsKey) // 往该表重新将所有对话存储进去
          objectStore.put(this.currentSessionId, this.currentSessionKey)
        } catch {
          this.saveToLocalStorage()
        }
      } else {
        this.saveToLocalStorage()
      }
    } catch (error) {
      console.error('Failed to save sessions:', error)
    }
  }

  private saveToLocalStorage(): void {
    try {
      const data = {
        sessions: Array.from(this.sessions.entries()),
        currentSessionId: this.currentSessionId
      }
      localStorage.setItem('chat_sessions', JSON.stringify(data))
    } catch (err) {
      console.error('Failed to save to localStorage:', err)
    }
  }

  // 保存聊天记录
  public async saveChatRecord(data: ChatMessage[]): Promise<void> {
    if (this.currentSessionId) {
      await this.updateCurrentSession(data)
    }
  }

  // 获取聊天记录
  public async getChatRecord(): Promise<ChatMessage[] | null> {
    const currentSession = this.getCurrentSession()
    return currentSession ? currentSession.messages : null
  }

  // 删除聊天记录
  public async deleteChatRecord(): Promise<void> {
    if (this.currentSessionId) {
      await this.deleteSession(this.currentSessionId)
    }
  }

  // 创建新会话
  public async createSession(title?: string): Promise<string> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = Date.now()

    const sessionInfo: SessionInfo = {
      id: sessionId,
      title: title || `新对话 ${new Date().toLocaleDateString()}`,
      createdAt: now,
      updatedAt: now,
      messageCount: 0
    }

    const sessionData: SessionData = {
      info: sessionInfo,
      messages: [{ role: 'assistant', content: '您好！我是您的AI助手，有什么可以帮助您的吗？' }]
    }

    // 在map中保存时，键是该会话的id，值是该会话的所有信息和数据。然后存储到indexDB中时会将map转换为数组
    this.sessions.set(sessionId, sessionData)
    this.currentSessionId = sessionId
    await this.saveSessions()

    return sessionId
  }

  // 获取所有会话信息
  public getAllSessions(): SessionInfo[] {
    return Array.from(this.sessions.values())
      .map(session => session.info)
      .sort((a, b) => b.updatedAt - a.updatedAt)
  }

  // 切换到指定会话
  public switchToSession(sessionId: string): SessionData | null {
    const session = this.sessions.get(sessionId)
    if (session) {
      this.currentSessionId = sessionId
      this.saveSessions()
      return session
    }
    return null
  }

  // 获取当前会话
  public getCurrentSession(): SessionData | null {
    if (!this.currentSessionId) return null
    return this.sessions.get(this.currentSessionId) || null
  }

  // 更新当前会话的消息
  public async updateCurrentSession(messages: ChatMessage[]): Promise<void> {
    if (!this.currentSessionId) {
      await this.createSession()
    }
    // 得到当前会话
    const session = this.sessions.get(this.currentSessionId!)
    if (session) {
      session.messages = JSON.parse(JSON.stringify(messages))
      session.info.updatedAt = Date.now()
      session.info.messageCount = messages.length

      // 自动生成标题
      const firstUserMessage = messages.find(msg => msg.role === 'user')
      if (firstUserMessage && session.info.title.startsWith('新对话')) {
        session.info.title = firstUserMessage.content.trim().slice(0, 20) +
          (firstUserMessage.content.length > 20 ? '...' : '')
      }

      // 更新最后一条消息预览
      const lastMessage = messages[messages.length - 1]
      if (lastMessage) {
        session.info.lastMessage = lastMessage.content.slice(0, 50) +
          (lastMessage.content.length > 50 ? '...' : '')
      }

      await this.saveSessions()
    }
  }

  // 删除指定会话
  public async deleteSession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId)

    if (this.currentSessionId === sessionId) {
      const latestSession = this.getAllSessions()[0]
      this.currentSessionId = latestSession?.id || null

      if (!this.currentSessionId) {
        await this.createSession()
      }
    }

    await this.saveSessions()
  }

  // 重命名会话
  public async renameSession(sessionId: string, newTitle: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.info.title = newTitle
      session.info.updatedAt = Date.now()
      await this.saveSessions()
    }
  }

  // 清空所有会话
  public async clearAllSessions(): Promise<void> {
    this.sessions.clear()
    this.currentSessionId = null
    await this.createSession()
  }
}