<script setup>
import {
  currentSessionId,
  sessionList,
  startNewSession,
  switchSession,
} from '../store/aiStore.js';
</script>

<template>
  <div class="session-history">
    <div class="panel-header">
      <div>
        <h2>AI 智能助手</h2>
        <p>中心页内嵌轻量咨询区，保留最近五次会话。</p>
      </div>
      <div class="session-controls">
        <el-select
          v-model="currentSessionId"
          placeholder="选择会话"
          size="small"
          clearable
          style="width: 140px"
          @change="switchSession"
        >
          <el-option
            v-for="s in sessionList"
            :key="s.id"
            :label="s.sessionTitle"
            :value="s.id"
          />
        </el-select>
        <el-button text size="small" @click="startNewSession">
          新建会话
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.panel-header h2 {
  margin: 0 0 6px;
  font-size: 20px;
  color: #111827;
}

.panel-header p {
  margin: 0;
  color: #6b7280;
  font-size: 13px;
}

.session-controls {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}
</style>
