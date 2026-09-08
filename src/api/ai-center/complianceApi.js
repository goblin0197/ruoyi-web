import { post } from '@/utils/request';

export function detectAiProhibitedWords(data) {
  return post('/ai/center/prohibited-words', data).json();
}
