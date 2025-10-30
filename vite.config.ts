import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import autoImport from 'unplugin-auto-import/vite'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // 生成的自动导入到这个目录
    autoImport({
      dts: './shims/auto-imports.d.ts',
      imports: ['vue']
    })
  ],
  build: {
    outDir: 'docs',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            const match = id.match(/node_modules[/\\]\.pnpm[/\\](.+?)[@/\\]/)
            if (match) {
              const pkg = match[1].replace(/@.+/, '')
              return `vendor/${pkg}`
            }
            return 'vendor/' + id.split('node_modules/')[1].split('/')[0].toString()
          }
        }
      }
    }
  },
  server: {
    port: 8888,
    // proxy: {
    //   '/api': {
    //     target: 'https://api.openai.com',
    //     changeOrigin: true,
    //     rewrite: (path) => path.replace(/^\/api/, '')
    //   }
    // }
  },
  // 运行时和打包时
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  }
})
