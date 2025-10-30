// 当项目运行的时候，vite启动，当遇到一个css文件的时候。vite会去找postcss.config.js这个配置文件
// 然后根据配置文件去处理css文件
// 1. 启动tailwind插件，处理tailwind的指令
// 2. 自动添加浏览器厂商前缀
export default {
  plugins: {
    tailwindcss: {},
    // 自动添加浏览器厂商前缀
    autoprefixer: {},
  },
}
