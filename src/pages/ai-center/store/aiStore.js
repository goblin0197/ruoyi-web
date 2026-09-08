import { ElMessage } from 'element-plus';
import { ref } from 'vue';
import {
  chatWithAiAssistant,
  getAssistantMessages,
  getAssistantSessions,
} from '@/api/ai-center/assistantApi.js';
import { getChatModelList } from '@/api/ai-center/chatModelApi.js';
import { getAiOverview } from '@/api/ai-center/overviewApi.js';
import { AI_ASSISTANT_PROMPTS } from '../constants/features.js';
import {
  getAiState,
  getAssistantSessionState,
  saveAssistantSessionState,
  resetAssistantState as storageResetAssistantState,
  trackActivity,
} from '../services/aiCenterStorage.js';

// State
export const overview = ref(getAiState().overview);
export const activities = ref(getAiState().activities);
export const assistantMessages = ref(getAiState().assistantMessages);
export const assistantPrompts = ref(AI_ASSISTANT_PROMPTS);
export const assistantQuestion = ref('');
export const assistantLoading = ref(false);
export const modelList = ref([]);
export const selectedModelId = ref(null);
export const savedDraftCount = ref(0);
export const currentSessionId = ref(getAssistantSessionState().currentSessionId);
export const sessionList = ref([]);

// Abort Controller for SSE
let currentAbortController = null;

// Actions
export function refreshOverview() {
  return getAiOverview()
    .then((res) => {
      if (res.data?.overview) {
        overview.value = { ...overview.value, ...res.data.overview };
      }
    })
    .catch(() => {});
}

export async function loadSessionList() {
  try {
    sessionList.value = await getAssistantSessions();
  }
  catch (e) {
    console.error('加载会话列表失败', e);
  }
}

export async function loadSessionMessages(sessionId) {
  try {
    const messages = await getAssistantMessages(sessionId);
    assistantMessages.value = messages.map(m => ({
      role: m.role,
      content: m.content,
      createdAt: m.createTime || '',
    }));
  }
  catch (e) {
    console.error('加载会话消息失败', e);
    ElMessage.warning('加载会话消息失败');
  }
}

export function switchSession(sessionId) {
  if (currentAbortController) {
    currentAbortController.abort();
    currentAbortController = null;
  }
  assistantLoading.value = false;

  if (!sessionId) {
    startNewSession();
    return;
  }
  currentSessionId.value = sessionId;
  saveAssistantSessionState(sessionId);
  loadSessionMessages(sessionId);
}

export function startNewSession() {
  if (currentAbortController) {
    currentAbortController.abort();
    currentAbortController = null;
  }
  assistantLoading.value = false;

  currentSessionId.value = null;
  saveAssistantSessionState(null);
  const defaultState = storageResetAssistantState();
  assistantMessages.value = defaultState.assistantMessages;
  assistantPrompts.value = defaultState.assistantPrompts;
  assistantQuestion.value = '';
}

export function fillAssistantPrompt(prompt) {
  assistantQuestion.value = prompt;
}

export function submitAssistantQuestion() {
  if (assistantLoading.value) {
    return;
  }

  if (!assistantQuestion.value.trim()) {
    ElMessage.warning('请输入问题');
    return;
  }

  if (currentAbortController)
    currentAbortController.abort();
  currentAbortController = new AbortController();

  const question = assistantQuestion.value;
  assistantQuestion.value = '';
  assistantLoading.value = true;

  const now = new Date().toLocaleString('zh-CN', { hour12: false });
  const userMessage = { role: 'user', content: question, createdAt: now };
  assistantMessages.value = [...assistantMessages.value, userMessage];

  const aiMessage = { role: 'assistant', content: '', createdAt: now };
  assistantMessages.value = [...assistantMessages.value, aiMessage];
  const aiIndex = assistantMessages.value.length - 1;

  let activeSessionId = currentSessionId.value;

  chatWithAiAssistant(
    { question, scene: 'ai-center', sessionId: activeSessionId },
    {
      signal: currentAbortController.signal,
      onSession(payload) {
        if (payload.sessionId) {
          activeSessionId = payload.sessionId;
          currentSessionId.value = payload.sessionId;
          saveAssistantSessionState(payload.sessionId);
        }
      },
      onContent(partial) {
        aiMessage.content += partial;
        const updated = [...assistantMessages.value];
        updated[aiIndex] = { ...aiMessage };
        assistantMessages.value = updated;
      },
      onDone(fullText, sessionId) {
        if (sessionId && !activeSessionId) {
          activeSessionId = sessionId;
          currentSessionId.value = sessionId;
          saveAssistantSessionState(sessionId);
        }
        activities.value = trackActivity('assistant', 'AI 智能助手', {
          action: '智能咨询',
          subject: question.length > 20 ? `${question.slice(0, 20)}...` : question,
          summary: `咨询完成，共 ${fullText.length} 字`,
        });
        refreshOverview();
        assistantLoading.value = false;
        loadSessionList();
      },
      onError(err) {
        aiMessage.content = err.message || '发送失败，请稍后重试';
        const updated = [...assistantMessages.value];
        updated[aiIndex] = { ...aiMessage };
        assistantMessages.value = updated;
        assistantLoading.value = false;
      },
    },
  ).catch(() => {
    assistantLoading.value = false;
  });
}

export function clearAssistantConversation() {
  startNewSession();
  ElMessage.success('已清除会话');
}

export function loadModels() {
  getChatModelList().then((res) => {
    modelList.value = (res.data || []).map(m => ({ ...m, id: String(m.id) }));
    const savedId = localStorage.getItem('ai-center:selectedModelId');
    if (savedId && modelList.value.some(m => m.id === savedId)) {
      selectedModelId.value = savedId;
    }
    else if (modelList.value.length) {
      selectedModelId.value = modelList.value[0].id;
    }
  }).catch(() => {});
}

export function handleModelChange(val) {
  localStorage.setItem('ai-center:selectedModelId', String(val));
}

export function abortAssistantRequest() {
  if (currentAbortController) {
    currentAbortController.abort();
    currentAbortController = null;
  }
}
