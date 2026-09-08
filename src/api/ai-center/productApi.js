import { post } from '@/utils/request';

export function extractAiSellingPoints(data) {
  return post('/ai/center/selling-points', data).json();
}
