<script setup lang="ts">
import { isMobile } from '@/types'
// import { goGitHub } from '@/libs/utils'
import { ElButton } from 'element-plus'

// Props
interface Props {
  showSidebar?: boolean
}

// withDefaults是 Vue 3 + TypeScript 的推荐写法，用于给 defineProps提供默认值
const props = withDefaults(defineProps<Props>(), {
  showSidebar: false
})

// Emits 
interface Emits{
  config:[]
  toggleSidebar:[]
}
const emit = defineEmits<Emits>()
</script>

<template>
  <!-- Header内容 -->
  <div class="flex flex-nowrap items-center h-16 bgColor" :class="{ 'px-6': !isMobile, 'px-3': isMobile }">
    <!-- 侧边栏切换按钮 -->
    <button 
      @click="$emit('toggleSidebar')"
      class="sidebar-toggle-btn mr-3"
      :title="showSidebar ? '隐藏侧边栏' : '显示侧边栏'"
    >
      {{ showSidebar ? '‹' : '☰' }}
    </button>
    
    <div class="font-bold text-white" :class="{ 'text-2xl': !isMobile, 'text-xl': isMobile }">AI Studio</div>
    <div class="ml-4 text-sm text-white" v-if="!isMobile">AI Studio based on ChatGPT</div>
    <!-- <div class='ml-4 my-auto cursor-pointer' @click='goGitHub' :class="{ 'scale-90': isMobile }">
      <img loading="lazy" decoding="async"
        src='https://img.shields.io/github/stars/sumingcheng/Vue3-TS-ChatGPT?logo=github' alt='GitHub'>
    </div> -->
    <div class="ml-auto text-sm cursor-pointer" @click="$emit('config')">
      <el-button :size="isMobile ? 'default' : 'large'" type="info" class="elBtnStyle" :class="{ 'text-4xl': !isMobile, 'text-3xl': isMobile }">Set</el-button>
    </div>
  </div>
</template>

<style scoped>
.sidebar-toggle-btn {
  width: 2.5rem;
  height: 2.5rem;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 1.125rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
}

.sidebar-toggle-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.sidebar-toggle-btn:active {
  transform: translateY(0);
}
</style>