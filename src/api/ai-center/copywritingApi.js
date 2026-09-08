import { post } from '@/utils/request';

export function generateAiMultilingualCopy(data) {
  return post('/ai/center/multilingual', data).json();
}

export function optimizeAiCopywriting(data) {
  return post('/ai/center/copy-optimize', data).json();
}
