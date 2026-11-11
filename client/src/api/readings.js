import { apiRequest } from './client';

export async function createReadingApi(data) {
  return apiRequest('/readings', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function getReadingsApi(params = {}) {
  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page);
  if (params.limit) query.append('limit', params.limit);
  if (params.date) query.append('date', params.date);
  if (params.startDate) query.append('startDate', params.startDate);
  if (params.endDate) query.append('endDate', params.endDate);
  if (params.slot) query.append('slot', params.slot);

  const queryString = query.toString();
  return apiRequest(`/readings${queryString ? `?${queryString}` : ''}`, {
    method: 'GET'
  });
}

export async function getReadingByIdApi(id) {
  return apiRequest(`/readings/${id}`, {
    method: 'GET'
  });
}

export async function updateReadingApi(id, data) {
  return apiRequest(`/readings/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export async function deleteReadingApi(id) {
  return apiRequest(`/readings/${id}`, {
    method: 'DELETE'
  });
}
