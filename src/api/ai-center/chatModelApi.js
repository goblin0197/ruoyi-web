import { get } from '@/utils/request';

export function getChatModelList() {
  return get('/ai/center/models').json();
}
