import 'element-plus/dist/index.css'
import { createApp } from 'vue'
import App from './App.vue'
import './assets/index.css'
import './assets/tailwind.css'
import router from './router'
import { createPinia } from 'pinia'
const pinia = createPinia()
const app = createApp(App)
app.use(router)
app.use(pinia)
app.mount('#app')
