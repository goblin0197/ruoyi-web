import { post } from '@/utils/request';

export function recommendAiVariants(data) {
  return post('/ai/center/variant-recommend', data).json();
}
