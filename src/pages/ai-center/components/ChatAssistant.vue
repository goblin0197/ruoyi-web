<script setup>
import { marked } from 'marked';
import { nextTick, onMounted, ref, watch } from 'vue';
import {
  assistantLoading,
  assistantMessages,
  assistantPrompts,
  assistantQuestion,
  fillAssistantPrompt,
  submitAssistantQuestion,
} from '../store/aiStore.js';

marked.setOptions({
  breaks: true,
  gfm: true,
});

function renderMarkdown(content) {
  if (!content)
    return '';
  return marked(content);
}

const messagesRef = ref(null);

function scrollMessagesToBottom() {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight;
    }
  });
}

function handleAssistantKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    submitAssistantQuestion();
  }
}

// Watch messages and scroll to bottom automatically on new message
watch(
  assistantMessages,
  () => {
    scrollMessagesToBottom();
  },
  { deep: true },
);

onMounted(() => {
  scrollMessagesToBottom();
});
</script>

<template>
  <div class="chat-assistant">
    <div class="prompt-list">
      <el-button
        v-for="prompt in assistantPrompts"
        :key="prompt"
        class="prompt-button"
        @click="fillAssistantPrompt(prompt)"
      >
        {{ prompt }}
      </el-button>
    </div>

    <div ref="messagesRef" class="assistant-messages">
      <div
        v-for="(message, index) in assistantMessages"
        :key="`${message.createdAt}-${index}`"
        class="message-item" :class="[message.role === 'assistant' ? 'is-assistant' : 'is-user']"
      >
        <div class="message-role">
          {{ message.role === 'assistant' ? 'AI' : '我' }}
        </div>
        <div
          v-if="message.role === 'assistant' && message.content"
          class="message-content markdown-body"
          v-html="renderMarkdown(message.content)"
        />
        <div
          v-else-if="message.role === 'assistant'"
          class="message-content loading-text"
        >
          正在整理回复...
        </div>
        <div v-else class="message-content">
          {{ message.content }}
        </div>
        <div class="message-time">
          {{ message.createdAt }}
        </div>
      </div>
    </div>

    <div class="assistant-form">
      <el-input
        v-model="assistantQuestion"
        type="textarea"
        :rows="3"
        placeholder="输入问题，例如：帮我整理德国站标题优化思路（Enter 发送，Shift+Enter 换行）"
        @keydown="handleAssistantKeydown"
      />
      <div class="assistant-actions">
        <el-button @click="assistantQuestion = ''">
          清空
        </el-button>
        <el-button type="primary" :loading="assistantLoading" @click="submitAssistantQuestion">
          发送
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.prompt-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 18px 0;
}

.prompt-button {
  margin-left: 0;
}

.assistant-messages {
  max-height: 480px;
  overflow: auto;
  padding-right: 4px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message-item {
  border-radius: 12px;
  padding: 14px;
  border: 1px solid #e5e7eb;
}

.is-assistant {
  background: #f8fafc;
}

.is-user {
  background: #eff6ff;
  border-color: #bfdbfe;
}

.message-role {
  font-size: 12px;
  font-weight: 700;
  color: #2563eb;
  margin-bottom: 8px;
}

.message-content {
  color: #374151;
  line-height: 1.7;
  font-size: 13px;
  white-space: pre-wrap;
}

.loading-text {
  color: #9ca3af;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

:deep(.markdown-body) {
  line-height: 1.7;
  white-space: normal;
}

:deep(.markdown-body p) {
  margin: 0 0 12px;
}

:deep(.markdown-body p:last-child) {
  margin-bottom: 0;
}

:deep(.markdown-body ul) {
  margin: 8px 0;
  padding-left: 24px;
  list-style-position: inside;
}

:deep(.markdown-body ol) {
  margin: 8px 0;
  padding-left: 36px;
}

:deep(.markdown-body li) {
  margin: 4px 0;
}

:deep(.markdown-body code) {
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 13px;
}

:deep(.markdown-body pre) {
  background: #1e293b;
  color: #e2e8f0;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 12px 0;
}

:deep(.markdown-body pre code) {
  background: none;
  padding: 0;
  color: inherit;
}

:deep(.markdown-body h1),
:deep(.markdown-body h2),
:deep(.markdown-body h3) {
  margin: 16px 0 8px;
  font-weight: 600;
}

:deep(.markdown-body blockquote) {
  border-left: 4px solid #3b82f6;
  padding-left: 16px;
  margin: 12px 0;
  color: #6b7280;
}

:deep(.markdown-body table) {
  border-collapse: collapse;
  margin: 12px 0;
}

:deep(.markdown-body th),
:deep(.markdown-body td) {
  border: 1px solid #e5e7eb;
  padding: 8px 12px;
}

:deep(.markdown-body th) {
  background: #f8fafc;
}

.message-time {
  color: #9ca3af;
  font-size: 12px;
  margin-top: 10px;
}

.assistant-form {
  margin-top: 16px;
  border-top: 1px solid #e5e7eb;
  padding-top: 16px;
}

.assistant-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 12px;
}
</style>
