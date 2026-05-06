import apiClient from './apiClient';

export const getDatasets = async () => {
  try {
    const response = await apiClient.get('/datasets');
    return response;
  } catch (error) {
    throw error;
  }
};

export const getDatasetById = async (id) => {
  try {
    const response = await apiClient.get(`/datasets/${id}`);
    return response;
  } catch (error) {
    throw error;
  }
};

export const createDataset = async (data) => {
  try {
    const response = await apiClient.post('/datasets', data);
    return response;
  } catch (error) {
    throw error;
  }
};

export const updateDataset = async (id, data) => {
  try {
    const response = await apiClient.put(`/datasets/${id}`, data);
    return response;
  } catch (error) {
    throw error;
  }
};

export const deleteDataset = async (id) => {
  try {
    const response = await apiClient.delete(`/datasets/${id}`);
    return response;
  } catch (error) {
    throw error;
  }
};

export const runValidation = async (id) => {
  try {
    const response = await apiClient.post(`/datasets/${id}/validate`);
    return response;
  } catch (error) {
    throw error;
  }
};

export const getValidationResults = async (id) => {
  try {
    const response = await apiClient.get(`/datasets/${id}/validation-results`);
    return response;
  } catch (error) {
    throw error;
  }
};
