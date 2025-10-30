/** @type {import('tailwindcss').Config} */   // Tailwind CSS配置类型注释，用于代码自动补全
module.exports = {
  mode: 'jit', // 启用JIT模式以获得更快的构建速度和更小的CSS文件
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
}
