import { Storage } from '@/libs/utils'
import { ElMessage } from 'element-plus'

// localstorage key，对Storage中的操作又封装了一层
export function operationKey() {
  const getKey = (): string => {
    const key: string | null = Storage.get('apiKey')
    return key === null ? '' : key
  }

  const setKey = (apiKey: string) => {
    return Storage.set('apiKey', apiKey)
  }

  return {
    getKey,
    setKey,
  }
}

export const scrollToBottom = (val: any) => {
  if (!val) {
    return
  } else {
    scrollTo(0, val.scrollHeight)
  }
}

// const copy = (copyText: string) => {
//   navigator.clipboard.writeText(copyText).then(function () {
//     ElMessage({
//       message: '已复制', type: 'success',
//     })
//   }, function (err) {
//     console.error('无法复制文本: ', err)
//   })
// }

// 初始化拷贝
// export const initCopy = () => {
//   // 获取所有的copyNode元素,这个元素是个button
//   const copyText: any = document.getElementsByClassName('copyNode')
//   let arr = Array.from(copyText)
//   arr.forEach((v: any) => {
//     // 如果元素已经有一个 copyAction，那么首先移除它，这个copyAction是我们自己定义的属性
//     if (v.copyAction) {
//       v.removeEventListener('click', v.copyAction)
//     }

//     // 创建一个新的 copyAction，并存储在元素的属性中
//     v.copyAction = () => {
//       // button的下一个兄弟节点是code节点.
//       copy(v.nextSibling.textContent)
//     }

//     // 添加新的监听器
//     v.addEventListener('click', v.copyAction)
//   })
// }

// 只需要在挂载时调用一次即可,采用事件委托机制,在ChatContent的父容器上绑定一个唯一的click事件监听器,
// 利用事件冒泡机制来捕获所有动态添加子元素（如复制按钮）的点击，从而实现“一次绑定，永久生效”的高效事件处理。
export function initCopy() {
  const container = document.getElementById('chat-message-container')
  if (!container) return
  // 在父容器上绑定一个唯一的click事件监听器
  container.addEventListener('click', (event: MouseEvent) => {
    const copyButton = (event.target as HTMLElement).closest('.copyNode')
    if (!copyButton) return
    const pre = copyButton.closest('pre'); // 从被点击的按钮向上找到它的 <pre> 父元素
    if (pre) {
      const code = pre.querySelector('code'); // 在这个 <pre> 内部找到 <code> 元素
      if (code) {
        // 7. 执行复制
        navigator.clipboard.writeText(code.innerText).then(() => {
          // 8. 提供即时反馈
          copyButton.textContent = 'Copied!';
          ElMessage({
            message: '已复制', type: 'success',
          })
          setTimeout(() => {
            copyButton.textContent = 'Copy';
          }, 2000);
        }).catch(err => {
          console.error('Failed to copy text: ', err);
        });
      }
    }
  })
}