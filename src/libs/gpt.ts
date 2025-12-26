// 与AI聊天服务进行通信

import type { ChatMessage } from '@/types'

export async function chat(messageList: ChatMessage[], apiKey: string, GPT_VERSION: string,signal?:AbortSignal) {
  try {
    // 发送请求
    const result = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: GPT_VERSION,
        // 服务器在接收到stream: true这个参数后，决定以SSE的格式返回数据流
        stream: true,
        messages: messageList
      }),
      signal
    })

    if (!result.ok) {
      const errorData = await result.json()
      return { status: 'error', error: errorData.error }
    }
    // fetch默认返回一个Response对象，其body属性是一个ReadableStream对象
    return { status: 'success', data: result.body }
  } catch (error) {
    return { status: 'error', error: { message: error instanceof Error ? error.message : '未知错误' } }
  }
}
