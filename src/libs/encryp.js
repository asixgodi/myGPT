// 加密存储在localStorage中的API密钥，使用CryptoJS库实现AES对称加密
import CryptoJS from 'crypto-js'

// 秘钥
const KEY = 'XuanXuwei'
// 向量 这里没用到
//const IV = CryptoJS.enc.Utf8.parse('ThisIsAnIV123456')

// 加密函数
export function encryptString(plaintext) {
  const encrypted = CryptoJS.AES.encrypt(plaintext, KEY)
  return encrypted.toString()
}

// 解密函数
export function decryptString(ciphertext) {
  if (ciphertext === null || ciphertext === undefined) {
    return ''
  } else {
    const decrypted = CryptoJS.AES.decrypt(ciphertext, KEY)
    return decrypted.toString(CryptoJS.enc.Utf8)
  }
}

