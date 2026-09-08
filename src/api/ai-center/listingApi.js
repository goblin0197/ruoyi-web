import { post } from '@/utils/request';

export function scoreAiListing(data) {
  return post('/ai/center/listing-score', data).json();
}
