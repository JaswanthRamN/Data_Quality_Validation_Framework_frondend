import { useState, useEffect } from 'react';
import { getDatasets, createDataset } from '../services/datasetService';

export default function Datasets() {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    try {
      setLoading(true);
      const data = await getDatasets();
      setDatasets(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch datasets');
      setDatasets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Dataset name is required');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await createDataset(formData);
      setSuccessMessage('Dataset created successfully!');
      setFormData({ name: '', description: '' });
      setShowForm(false);
      
      // Refresh the datasets list
      await fetchDatasets();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to create dataset');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="datasets-container"><p>Loading datasets...</p></div>;
  }

  return (
    <div className="datasets-container">
      <div className="datasets-header">
        <h1>Datasets</h1>
        <button 
          className="btn-primary" 
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : 'Add Dataset'}
        </button>
      </div>

      {successMessage && (
        <div className="alert alert-success">{successMessage}</div>
      )}

      {error && (
        <div className="alert alert-error">Error: {error}</div>
      )}

      {showForm && (
        <form className="dataset-form" onSubmit={handleFormSubmit}>
          <div className="form-group">
            <label htmlFor="name">Dataset Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter dataset name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter dataset description"
              rows="4"
            ></textarea>
          </div>

          <button 
            type="submit" 
            className="btn-primary"
            disabled={submitting}
          >
            {submitting ? 'Creating...' : 'Create Dataset'}
          </button>
        </form>
      )}

      {datasets.length === 0 ? (
        <p className="empty-state">No datasets found</p>
      ) : (
        <div className="datasets-list">
          {datasets.map((dataset) => (
            <div key={dataset.id} className="dataset-item">
              <h3>{dataset.name}</h3>
              <p>{dataset.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
