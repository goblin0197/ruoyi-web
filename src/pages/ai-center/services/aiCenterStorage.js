import { AI_ASSISTANT_PROMPTS, AI_FEATURES } from '../constants/features.js';

const STORAGE_KEY = 'ai-center:state:v1';
const ACTIVITY_LIMIT = 20;

function safeClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function formatTimestamp(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

function resolveStorage(storage) {
  if (storage) {
    return storage;
  }
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return null;
}

export function createDefaultAiState() {
  return {
    overview: {
      heroTitle: 'AI 工具箱',
      heroDescription: '围绕跨境电商 Listing、文案和选品辅助，提供统一的 AI 模拟工作台。',
      stats: {
        optimizedListings: 1248,
        generatedCopies: 3572,
        riskScans: 247,
        seoLift: 23.7,
      },
      featureUsage: AI_FEATURES.reduce((accumulator, feature) => {
        accumulator[feature.code] = 0;
        return accumulator;
      }, {}),
      assistantPrompts: AI_ASSISTANT_PROMPTS,
    },
    activities: [],
    drafts: {},
    results: {},
    currentAssistantSessionId: null,
    sessionMessages: {},
    assistantMessages: [
      {
        role: 'assistant',
        content: '你好，我是 AI 助手。你可以让我帮你整理 Listing 文案、卖点方向或本地化建议。',
        createdAt: formatTimestamp(new Date('2026-05-15T09:00:00')),
      },
    ],
  };
}

function mergeState(rawState) {
  const defaultState = createDefaultAiState();
  if (!rawState) {
    return defaultState;
  }

  return {
    overview: {
      ...defaultState.overview,
      ...(rawState.overview || {}),
      stats: {
        ...defaultState.overview.stats,
        ...((rawState.overview && rawState.overview.stats) || {}),
      },
      featureUsage: {
        ...defaultState.overview.featureUsage,
        ...((rawState.overview && rawState.overview.featureUsage) || {}),
      },
      assistantPrompts:
        (rawState.overview && rawState.overview.assistantPrompts) || defaultState.overview.assistantPrompts,
    },
    activities: Array.isArray(rawState.activities)
      ? rawState.activities
      : [],
    drafts: rawState.drafts || {},
    results: rawState.results || {},
    assistantMessages: Array.isArray(rawState.assistantMessages) && rawState.assistantMessages.length
      ? rawState.assistantMessages
      : defaultState.assistantMessages,
    currentAssistantSessionId: rawState.currentAssistantSessionId || null,
    sessionMessages: rawState.sessionMessages || {},
  };
}

export function getAiState(storage) {
  const targetStorage = resolveStorage(storage);
  if (!targetStorage) {
    return createDefaultAiState();
  }

  const rawValue = targetStorage.getItem(STORAGE_KEY);
  if (!rawValue) {
    return createDefaultAiState();
  }

  try {
    return mergeState(JSON.parse(rawValue));
  }
  catch {
    return createDefaultAiState();
  }
}

export function saveAiState(state, storage) {
  const targetStorage = resolveStorage(storage);
  if (!targetStorage) {
    return state;
  }
  targetStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  return state;
}

export function patchAiState(patch, storage) {
  const nextState = mergeState({
    ...getAiState(storage),
    ...patch,
  });
  saveAiState(nextState, storage);
  return nextState;
}

export function getOverview(storage) {
  return safeClone(getAiState(storage).overview);
}

export function updateOverviewStats(updater, storage) {
  const state = getAiState(storage);
  const nextOverview = safeClone(state.overview);
  updater(nextOverview);
  state.overview = nextOverview;
  saveAiState(state, storage);
  return nextOverview;
}

export function getFeatureDraft(featureCode, storage) {
  return safeClone(getAiState(storage).drafts[featureCode] || {});
}

export function saveFeatureDraft(featureCode, draft, storage) {
  const state = getAiState(storage);
  state.drafts[featureCode] = safeClone(draft);
  saveAiState(state, storage);
  return state.drafts[featureCode];
}

export function getFeatureResult(featureCode, storage) {
  return safeClone(getAiState(storage).results[featureCode] || null);
}

export function saveFeatureResult(featureCode, result, storage) {
  const state = getAiState(storage);
  state.results[featureCode] = safeClone(result);
  saveAiState(state, storage);
  return state.results[featureCode];
}

export function getAssistantMessages(storage) {
  return safeClone(getAiState(storage).assistantMessages);
}

// 获取指定会话的消息 key
function getSessionMessagesKey(sessionId) {
  return sessionId ? `session:${sessionId}` : 'session:draft';
}

// 获取指定会话消息
export function getSessionMessages(sessionId, storage) {
  const state = getAiState(storage);
  const key = getSessionMessagesKey(sessionId);
  return safeClone(state.sessionMessages?.[key] || []);
}

// 保存指定会话消息
export function saveSessionMessages(sessionId, messages, storage) {
  const state = getAiState(storage);
  if (!state.sessionMessages) {
    state.sessionMessages = {};
  }
  const key = getSessionMessagesKey(sessionId);
  state.sessionMessages[key] = safeClone(messages);
  saveAiState(state, storage);
  return state.sessionMessages[key];
}

// 获取会话状态
export function getAssistantSessionState(storage) {
  const state = getAiState(storage);
  return {
    currentSessionId: state.currentAssistantSessionId || null,
  };
}

// 保存会话状态
export function saveAssistantSessionState(sessionId, storage) {
  const state = getAiState(storage);
  state.currentAssistantSessionId = sessionId;
  saveAiState(state, storage);
}

export function saveAssistantMessages(messages, storage) {
  const state = getAiState(storage);
  state.assistantMessages = safeClone(messages);
  saveAiState(state, storage);
  return state.assistantMessages;
}

export function resetAssistantState(storage) {
  const state = getAiState(storage);
  const defaultState = createDefaultAiState();
  // 只重置助手消息，不影响 overview/activities/drafts/results
  state.assistantMessages = safeClone(defaultState.assistantMessages);
  saveAiState(state, storage);
  return {
    assistantMessages: safeClone(state.assistantMessages),
    assistantPrompts: safeClone(defaultState.overview.assistantPrompts),
  };
}

export function appendActivity(activity, storage) {
  const state = getAiState(storage);
  const nextActivity = {
    timestamp: activity.timestamp || formatTimestamp(),
    status: activity.status || 'success',
    ...activity,
  };
  state.activities = [nextActivity, ...state.activities].slice(0, ACTIVITY_LIMIT);
  saveAiState(state, storage);
  return safeClone(state.activities);
}

export function clearAiState(storage) {
  const targetStorage = resolveStorage(storage);
  if (!targetStorage) {
    return;
  }
  targetStorage.removeItem(STORAGE_KEY);
}

export function trackActivity(featureCode, featureName, activityInfo, storage) {
  const state = getAiState(storage);
  const activity = {
    featureCode,
    featureName,
    timestamp: formatTimestamp(),
    status: 'success',
    ...activityInfo,
  };
  state.activities = [activity, ...(state.activities || [])].slice(0, ACTIVITY_LIMIT);
  saveAiState(state, storage);
  return safeClone(state.activities);
}

export { formatTimestamp };
