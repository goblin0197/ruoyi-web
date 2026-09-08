import { post } from '@/utils/request';

export function matchAiCategory(data) {
  return post('/ai/center/category-match', data).json();
}
