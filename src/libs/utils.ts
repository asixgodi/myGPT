import { decryptString, encryptString } from '@/libs/encryp'

// 将二进制数据 Unit8Array 转为字符串
export const DECODER = new TextDecoder('utf-8')
// 封装 localStorage，加密存储和解密读取，这里是在真实操作localStorage
export const Storage = {
  get(key: string): string | null {
    return decryptString(window.localStorage.getItem(key))
  },
  set(key: string, value: string): void {
    window.localStorage.setItem(key, encryptString(value))
  },
  remove(key: string): void {
    window.localStorage.removeItem(key)
  }
}



interface Model {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

export function sortModelsById(models: Model[]): Model[] {
  const collator = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: 'base'
  })

  return models.sort((a, b) => collator.compare(a.id, b.id))
}
