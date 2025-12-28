import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import python from 'highlight.js/lib/languages/python'
import go from 'highlight.js/lib/languages/go'
import java from 'highlight.js/lib/languages/java'
import rust from 'highlight.js/lib/languages/rust'
import shell from 'highlight.js/lib/languages/shell'
import php from 'highlight.js/lib/languages/php'
import sql from 'highlight.js/lib/languages/sql'
import less from 'highlight.js/lib/languages/less'
import css from 'highlight.js/lib/languages/css'
import xml from 'highlight.js/lib/languages/xml' // HTML 使用 'xml' 模块
import json from 'highlight.js/lib/languages/json'
import c from 'highlight.js/lib/languages/c'
import cpp from 'highlight.js/lib/languages/cpp'
// 导入样式
import 'highlight.js/styles/github.css'
import DOMPurify from 'dompurify'
import { marked, Renderer } from 'marked'

const renderer = new Renderer()

const languages = {
  javascript, python, go, java, rust, shell, php, sql, less, css, xml, json, c, cpp
}

// 循环注册所有语言模块,注册高亮语言  Object.entries接收一个对象，返回一个包含该对象自身可枚举属性的键值对数组
// [name, module]这是数组的解构赋值
for (const [name, module] of Object.entries(languages)) {
  hljs.registerLanguage(name, module)
}

// 以 $ 开始和结束的内联公式，以及以 $$ 开始和结束的块级公式,添加class为math,后面使用MathJax来处理数学公式
renderer.text = function (text) {
  if (text.startsWith('$') && text.endsWith('$')) {
    return `<span class='math'>${text.slice(1, -1)}</span>`
  }
  return text
}

// 处理块级公式，带有class 'math'，方便后续使用MathJax渲染
renderer.paragraph = function (text) {
  if (text.startsWith('$$') && text.endsWith('$$')) {
    return `<div class='math'>${text.slice(2, -2)}</div>`
  }
  return '<p>' + text + '</p>\n'
}

// 代码块
renderer.code = (code, language) => {
  const validLanguage = !!(language && hljs.getLanguage(language))
  const highlighted = validLanguage ? hljs.highlight(code, { language }).value : hljs.highlightAuto(code).value
  return `<pre class='clearfix'><button class='copyNode'>Copy</button><code class='${language} hljs'>${highlighted}</code></pre>\n`
}

// 配置 marked
marked.setOptions({ renderer })

// 使用marked库将markdown语法转换为html标签, AI返回的内容是markdown格式的
// marked负责遍历整个markdown文本,识别出不同的结构块(段落,代码..)
// renderer是一个转换器,marked在遍历的过程中,每识别出一种结构,就调用renderer上相应的方法
export const markedRender = (val: any) => {
  const dirtyHtml = marked(val)
  const safeHtml = DOMPurify.sanitize(dirtyHtml, {
    USE_PROFILES: { html: true },

    // 你的项目需要“代码高亮 class / math class / Copy按钮 class”，class 一定要保留
    ALLOWED_ATTR: [
      'href',
      'src',
      'alt',
      'title',
      'class',
      'target',
      'rel',
      'aria-label',
      'role'
    ],

    // 你 renderer.code 里用到了 <button class='copyNode'>
    ADD_TAGS: ['button'],

    // 建议显式禁止一些高风险标签（按需）
    FORBID_TAGS: ['style', 'iframe', 'object', 'embed']
  })

  return safeHtml
}
