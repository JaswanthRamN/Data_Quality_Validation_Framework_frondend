import apiClient from './apiClient';

export const getMetrics = async () => {
  try {
    const response = await apiClient.get('/metrics');
    return response;
  } catch (error) {
    throw error;
  }
};

export const getMetricsByDataset = async (datasetId) => {
  try {
    const response = await apiClient.get(`/metrics/dataset/${datasetId}`);
    return response;
  } catch (error) {
    throw error;
  }
};

export const getMetricsByDateRange = async (startDate, endDate) => {
  try {
    const response = await apiClient.get('/metrics', {
      params: { startDate, endDate }
    });
    return response;
  } catch (error) {
    throw error;
  }
};

export const getMetricsOverview = async () => {
  try {
    const response = await apiClient.get('/metrics/overview');
    return response;
  } catch (error) {
    throw error;
  }
};
