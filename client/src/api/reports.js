import { apiRequest } from './client';

export async function getReportsApi(date) {
  const query = date ? `?date=${encodeURIComponent(date)}` : '';
  return apiRequest(`/reports${query}`, {
    method: 'GET'
  });
}
