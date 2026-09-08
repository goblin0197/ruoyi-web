import { get } from '@/utils/request';

export function getAiOverview() {
  return get('/ai/center/overview').json();
}
