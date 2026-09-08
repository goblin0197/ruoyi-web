import { post } from '@/utils/request';

export function analyzeAiSeo(data) {
  return post('/ai/center/seo-embed', data).json();
}
