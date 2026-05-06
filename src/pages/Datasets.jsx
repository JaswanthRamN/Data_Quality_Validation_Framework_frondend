import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDatasets, createDataset, runValidation } from '../services/datasetService';
import FileUpload from '../components/FileUpload';

export default function Datasets() {
  const navigate = useNavigate();
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [validatingDatasetId, setValidatingDatasetId] = useState(null);

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

  const handleUploadClick = (dataset) => {
    setSelectedDataset(dataset);
    setShowUploadModal(true);
  };

  const handleUploadSuccess = (response) => {
    setSuccessMessage('File uploaded successfully!');
    setShowUploadModal(false);
    setSelectedDataset(null);
    
    // Refresh the datasets list
    fetchDatasets();
    
    // Clear success message after 3 seconds
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleUploadError = (error) => {
    const errorMessage = error.response?.data?.message || error.message || 'Upload failed';
    setError(errorMessage);
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
    setSelectedDataset(null);
  };

  const handleRunValidation = async (dataset) => {
    try {
      setValidatingDatasetId(dataset.id);
      setError(null);
      const result = await runValidation(dataset.id);
      setSuccessMessage(`Validation completed for "${dataset.name}"`);
      
      // Refresh the datasets list to get updated validation status
      await fetchDatasets();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Validation failed';
      setError(errorMessage);
    } finally {
      setValidatingDatasetId(null);
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
              <div className="dataset-content">
                <div className="dataset-title-container">
                  <h3>{dataset.name}</h3>
                  <div className="validation-status-container">
                    {validatingDatasetId === dataset.id && (
                      <span className="status-badge status-validating">
                        <span className="spinner"></span> Validating
                      </span>
                    )}
                    {dataset.validationStatus === 'passed' && validatingDatasetId !== dataset.id && (
                      <span className="status-badge status-passed">
                        ✓ Passed
                      </span>
                    )}
                    {dataset.validationStatus === 'failed' && validatingDatasetId !== dataset.id && (
                      <span className="status-badge status-failed">
                        ✗ Failed
                      </span>
                    )}
                    {dataset.validationStatus === 'pending' && validatingDatasetId !== dataset.id && (
                      <span className="status-badge status-pending">
                        ⊙ Pending
                      </span>
                    )}
                  </div>
                </div>
                <p>{dataset.description}</p>
                {dataset.lastValidatedAt && (
                  <p className="validation-info">
                    Last validated: {new Date(dataset.lastValidatedAt).toLocaleDateString()} at {new Date(dataset.lastValidatedAt).toLocaleTimeString()}
                  </p>
                )}
                {dataset.validationErrorCount !== undefined && (
                  <p className="validation-stats">
                    Issues found: {dataset.validationErrorCount} error{dataset.validationErrorCount !== 1 ? 's' : ''}, {dataset.validationWarningCount || 0} warning{(dataset.validationWarningCount || 0) !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
              <div className="dataset-actions">
                <button 
                  className="btn-secondary"
                  onClick={() => handleUploadClick(dataset)}
                >
                  Upload File
                </button>
                <button 
                  className="btn-secondary"
                  onClick={() => handleRunValidation(dataset)}
                  disabled={validatingDatasetId === dataset.id}
                >
                  {validatingDatasetId === dataset.id ? 'Validating...' : 'Run Validation'}
                </button>
                {dataset.validationStatus && (
                  <button 
                    className="btn-secondary"
                    onClick={() => navigate(`/validation/${dataset.id}`)}
                  >
                    View Results
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showUploadModal && selectedDataset && (
        <div className="modal-overlay" onClick={closeUploadModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Upload File to Dataset</h2>
              <p className="dataset-info">{selectedDataset.name}</p>
              <button 
                className="modal-close"
                onClick={closeUploadModal}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <FileUpload 
                datasetId={selectedDataset.id}
                onUploadSuccess={handleUploadSuccess}
                onUploadError={handleUploadError}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
