import { useState, useRef } from 'react';
import apiClient from '../services/apiClient';

export default function FileUpload({ datasetId, onUploadSuccess, onUploadError }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const fileInputRef = useRef(null);

  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  const ALLOWED_TYPES = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/json',
    'application/xml',
    'text/xml',
    'application/parquet'
  ];

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    
    if (!selectedFile) {
      return;
    }

    // Validate file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError('File size exceeds 100MB limit');
      setFile(null);
      return;
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setError('Invalid file type. Allowed: CSV, Excel, JSON, XML, Parquet');
      setFile(null);
      return;
    }

    setError(null);
    setFile(selectedFile);
    setSuccess(null);
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!file) {
      setError('Please select a file first');
      return;
    }

    if (!datasetId) {
      setError('Dataset ID is required');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setProgress(0);

      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post(`/datasets/${datasetId}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percentCompleted);
        },
      });

      setSuccess('File uploaded successfully!');
      setFile(null);
      setProgress(0);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Call success callback
      if (onUploadSuccess) {
        onUploadSuccess(response);
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Upload failed';
      setError(errorMessage);
      
      // Call error callback
      if (onUploadError) {
        onUploadError(err);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const droppedFile = e.dataTransfer?.files?.[0];
    if (droppedFile) {
      const syntheticEvent = {
        target: { files: e.dataTransfer.files }
      };
      handleFileSelect(syntheticEvent);
    }
  };

  return (
    <div className="file-upload-container">
      <form onSubmit={handleUpload} className="file-upload-form">
        <div
          className="file-upload-area"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            id="file-input"
            onChange={handleFileSelect}
            disabled={uploading}
            accept=".csv,.xlsx,.xls,.json,.xml,.parquet"
            className="file-input"
          />
          <label htmlFor="file-input" className="file-upload-label">
            <div className="upload-icon">📁</div>
            <p className="upload-text">
              Drag and drop your file here or click to select
            </p>
            <p className="upload-subtext">
              Supported formats: CSV, Excel, JSON, XML, Parquet (Max 100MB)
            </p>
          </label>
        </div>

        {file && (
          <div className="file-preview">
            <p className="file-name">📄 {file.name}</p>
            <p className="file-size">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        )}

        {uploading && (
          <div className="progress-container">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="progress-text">{progress}% uploaded</p>
          </div>
        )}

        {error && (
          <div className="alert alert-error">{error}</div>
        )}

        {success && (
          <div className="alert alert-success">{success}</div>
        )}

        <button
          type="submit"
          className="btn-primary"
          disabled={!file || uploading}
        >
          {uploading ? `Uploading... ${progress}%` : 'Upload File'}
        </button>
      </form>
    </div>
  );
}
