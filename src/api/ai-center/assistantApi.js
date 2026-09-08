/**
 * AI 智能助手 - SSE 流式调用
 *
 * 后端 /ai/center/assistant 返回 SseEmitter，事件格式：
 *   event: content  → {"event":"content","content":"增量文本"}
 *   event: session  → {"event":"session","content":"{\"sessionId\":123}"}
 *   event: done     → {"event":"done","done":true}
 *   event: error    → {"event":"error","error":"错误信息"}
 *
 * @param {object} data - { question, scene, sessionId }
 * @param {object} options - { onContent, onSession, onDone, onError, signal }
 * @returns {Promise} resolve 时携带完整拼接文本
 */
import { useUserStore } from '@/stores';

/**
 * AI 能力中心免登录，后端通过 X-USERINFO 请求头识别用户（与 ruoyi-web 登录态打通）。
 */
function aiCenterAuthHeaders() {
  try {
    const store = useUserStore();
    const userId = store.userInfo?.userId;
    if (userId != null) {
      return { 'X-USERINFO': encodeURIComponent(JSON.stringify({ id: userId })) };
    }
  }
  catch (e) {
    console.warn('注入 X-USERINFO 失败', e);
  }
  return {};
}

export function chatWithAiAssistant(data, options = {}) {
  const { onContent, onSession, onDone, onError, signal } = options;
  let doneCalled = false;

  const modelId = localStorage.getItem('ai-center:selectedModelId');
  const base = import.meta.env.VITE_WEB_BASE_API;
  const url = modelId ? `${base}/ai/center/assistant?modelId=${modelId}` : `${base}/ai/center/assistant`;

  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...aiCenterAuthHeaders(),
    },
    body: JSON.stringify(data),
    signal,
  }).then(async (response) => {
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      const err = new Error(text || `请求失败 (${response.status})`);
      if (onError)
        onError(err);
      throw err;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';

    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done)
          break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // 保留不完整行

        let eventType = '';
        for (const line of lines) {
          if (line.startsWith('event:')) {
            eventType = line.slice(6).trim();
          }
          else if (line.startsWith('data:')) {
            const raw = line.slice(5).trim();
            if (!raw)
              continue;

            let payload;
            try {
              // 将超出安全范围的数字转为字符串，避免精度丢失
              const safeRaw = raw.replace(/:\s*(\d{16,})/g, ':"$1"');
              payload = JSON.parse(safeRaw);
            }
            catch (e) {
              if (!(e instanceof SyntaxError))
                throw e;
              continue; // 跳过非 JSON 行
            }

            if (eventType === 'content' || payload.event === 'content') {
              fullText += payload.content || '';
              if (onContent)
                onContent(payload.content || '', fullText);
            }
            else if (eventType === 'session' || payload.event === 'session') {
              if (onSession) {
                // sessionId 可能在顶层或 content 字符串中
                let sessionId = payload.sessionId;
                console.debug('[SSE] session event, payload.sessionId:', sessionId, 'payload.content:', payload.content);
                if (!sessionId && payload.content) {
                  try {
                    // 将超出安全范围的数字转为字符串
                    const safeContent = typeof payload.content === 'string'
                      ? payload.content.replace(/:\s*(\d{16,})/g, ':"$1"')
                      : JSON.stringify(payload.content);
                    const parsed = JSON.parse(safeContent);
                    sessionId = parsed.sessionId;
                    console.debug('[SSE] parsed sessionId from content:', sessionId);
                  }
                  catch (e) { console.debug('[SSE] failed to parse content:', e); }
                }
                if (sessionId) {
                  console.debug('[SSE] calling onSession with sessionId:', sessionId);
                  onSession({ sessionId });
                }
                else {
                  console.debug('[SSE] sessionId not found in session event');
                }
              }
            }
            else if (eventType === 'done' || payload.event === 'done') {
              doneCalled = true;
              if (onDone)
                onDone(fullText, payload.sessionId);
            }
            else if (eventType === 'error' || payload.event === 'error') {
              const err = new Error(payload.error || '未知错误');
              if (onError)
                onError(err);
              throw err;
            }

            eventType = '';
          }
        }
      }
    }
    finally {
      reader.cancel();
    }

    if (!doneCalled && onDone)
      onDone(fullText);
    return fullText;
  }).catch((e) => {
    if (e.name === 'AbortError')
      return '';
    throw e;
  });
}

/**
 * 获取当前用户的 AI 助手历史会话列表
 */
const apiBase = import.meta.env.VITE_WEB_BASE_API;

export function getAssistantSessions() {
  return fetch(`${apiBase}/ai/center/assistant/sessions`, {
    headers: aiCenterAuthHeaders(),
  }).then(res => res.json()).then(res => res.data || []);
}

/**
 * 获取指定会话的历史消息
 * @param {number} sessionId
 */
export function getAssistantMessages(sessionId) {
  return fetch(`${apiBase}/ai/center/assistant/messages?sessionId=${sessionId}`, {
    headers: aiCenterAuthHeaders(),
  }).then(res => res.json()).then(res => res.data || []);
}
