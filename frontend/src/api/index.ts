import type { DataResponse } from '../types';

export const fetchData = async (): Promise<DataResponse> => {
  const response = await fetch(import.meta.env.BASE_URL + 'data.json');
  if (!response.ok) {
    throw new Error('Failed to fetch data');
  }
  return response.json();
};
