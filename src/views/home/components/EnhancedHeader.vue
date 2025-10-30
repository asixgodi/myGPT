<script setup lang="ts">
import { computed } from 'vue'
import { isMobile } from '@/types'
import { ElButton, ElTooltip, ElIcon, ElTag } from 'element-plus'
import { 
  Setting, 
  Delete, 
  Menu, 
  Close,
  Cpu,
  Monitor,
  CreditCard
} from '@element-plus/icons-vue'

interface Props {
  showSidebar: boolean
  contextOptimizationEnabled: boolean
  sessionStats: {
    totalTokens: number
    estimatedCost: number
    messageCount: number
  }
}

interface Emits {
  (e: 'config-click'): void
  (e: 'delete-click'): void
  (e: 'toggle-sidebar'): void
  (e: 'toggle-context-optimization'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const formattedCost = computed(() => {
  return (props.sessionStats.estimatedCost * 100).toFixed(4)
})

const optimizationStatus = computed(() => {
  return props.contextOptimizationEnabled ? '智能优化' : '完整上下文'
})

const optimizationColor = computed(() => {
  return props.contextOptimizationEnabled ? 'success' : 'warning'
})
</script>

<template>
  <div class="enhanced-header" :class="{ 'mobile': isMobile }">
    <!-- Left Section -->
    <div class="header-left">
      <!-- Sidebar Toggle -->
      <ElTooltip content="切换侧边栏" placement="bottom">
        <ElButton 
          type="text" 
          @click="emit('toggle-sidebar')"
          class="sidebar-toggle"
          :icon="showSidebar ? Close : Menu"
        />
      </ElTooltip>

      <!-- Title -->
      <div class="title-section">
        <h1 class="app-title">AI Studio</h1>
      </div>
    </div>

    <!-- Center Section - Stats -->
    <div class="header-center" v-if="!isMobile">
      <div class="stats-container">
        <ElTooltip content="当前会话消息数量" placement="bottom">
          <div class="stat-item">
            <ElIcon><Monitor /></ElIcon>
            <span>{{ sessionStats.messageCount }} 条</span>
          </div>
        </ElTooltip>

        <ElTooltip content="预估Token使用量" placement="bottom">
          <div class="stat-item">
            <ElIcon><Cpu /></ElIcon>
            <span>{{ sessionStats.totalTokens }} tokens</span>
          </div>
        </ElTooltip>

        <ElTooltip content="预估费用（分）" placement="bottom">
          <div class="stat-item">
            <ElIcon><CreditCard /></ElIcon>
            <span>¥{{ formattedCost }}</span>
          </div>
        </ElTooltip>
      </div>
    </div>

    <!-- Right Section -->
    <div class="header-right">
      <!-- Context Optimization Toggle -->
      <ElTooltip content="切换上下文优化模式" placement="bottom">
        <ElTag 
          :type="optimizationColor"
          @click="emit('toggle-context-optimization')"
          class="optimization-tag"
          effect="dark"
        >
          {{ optimizationStatus }}
        </ElTag>
      </ElTooltip>

      <!-- Settings Button -->
      <ElTooltip content="设置" placement="bottom">
        <ElButton 
          type="primary" 
          @click="emit('config-click')"
          :icon="Setting"
          :size="isMobile ? 'default' : 'large'"
        >
          <span v-if="!isMobile">设置</span>
        </ElButton>
      </ElTooltip>

      <!-- Delete Button -->
      <ElTooltip content="清空当前对话" placement="bottom">
        <ElButton 
          type="danger" 
          @click="emit('delete-click')"
          :icon="Delete"
          :size="isMobile ? 'default' : 'large'"
          plain
        >
          <span v-if="!isMobile">清空</span>
        </ElButton>
      </ElTooltip>
    </div>
  </div>
</template>

<style scoped>
.enhanced-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  z-index: 1000;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
}

.enhanced-header.mobile {
  padding: 0 16px;
  height: 56px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.sidebar-toggle {
  color: white !important;
  font-size: 18px;
}

.title-section {
  color: white;
}

.app-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(45deg, #fff, #e3f2fd);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.app-subtitle {
  margin: 0;
  font-size: 12px;
  opacity: 0.8;
  font-weight: 400;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.stats-container {
  display: flex;
  gap: 24px;
  background: rgba(255, 255, 255, 0.1);
  padding: 8px 16px;
  border-radius: 20px;
  backdrop-filter: blur(10px);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: white;
  font-size: 13px;
  font-weight: 500;
}

.stat-item .el-icon {
  font-size: 14px;
  opacity: 0.8;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.optimization-tag {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.optimization-tag:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* Mobile styles */
.enhanced-header.mobile .header-center {
  display: none;
}

.enhanced-header.mobile .app-title {
  font-size: 20px;
}

.enhanced-header.mobile .header-right {
  gap: 8px;
}

.enhanced-header.mobile .optimization-tag {
  font-size: 12px;
  padding: 2px 8px;
}

/* Button overrides */
.enhanced-header :deep(.el-button) {
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.enhanced-header :deep(.el-button:hover) {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.enhanced-header :deep(.el-button--primary) {
  background: rgba(33, 150, 243, 0.8);
  border-color: rgba(33, 150, 243, 0.8);
}

.enhanced-header :deep(.el-button--danger) {
  background: rgba(244, 67, 54, 0.8);
  border-color: rgba(244, 67, 54, 0.8);
}

.enhanced-header :deep(.el-button--text) {
  background: transparent;
  border: none;
  color: white;
}
</style>