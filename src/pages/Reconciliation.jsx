import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';

export default function Reconciliation() {
  const { datasetId } = useParams();
  const navigate = useNavigate();
  const [reconciliationData, setReconciliationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  const [filterType, setFilterType] = useState('all'); // all, matched, unmatched, errors
  const [viewMode, setViewMode] = useState('metrics'); // metrics, details, comparison

  useEffect(() => {
    if (datasetId) {
      fetchReconciliationData();
    }
  }, [datasetId]);

  const fetchReconciliationData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(`/datasets/${datasetId}/reconciliation`);
      setReconciliationData(response);
    } catch (err) {
      setError(err.message || 'Failed to fetch reconciliation data');
      setReconciliationData(null);
    } finally {
      setLoading(false);
    }
  };

  const toggleRowExpanded = (rowId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [rowId]: !prev[rowId],
    }));
  };

  const getFilteredResults = () => {
    if (!reconciliationData?.discrepancies) return [];

    switch (filterType) {
      case 'matched':
        return reconciliationData.discrepancies.filter((r) => r.status === 'matched');
      case 'unmatched':
        return reconciliationData.discrepancies.filter((r) => r.status === 'unmatched');
      case 'errors':
        return reconciliationData.discrepancies.filter((r) => r.status === 'error');
      default:
        return reconciliationData.discrepancies;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'matched':
        return '#28a745';
      case 'unmatched':
        return '#dc3545';
      case 'error':
        return '#fd7e14';
      default:
        return '#6c757d';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'matched':
        return '✓ Matched';
      case 'unmatched':
        return '✗ Unmatched';
      case 'error':
        return '⚠ Error';
      default:
        return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="reconciliation-container">
        <p>Loading reconciliation data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="reconciliation-container">
        <div className="alert alert-error">Error: {error}</div>
        <button className="btn-primary" onClick={() => navigate('/datasets')}>
          Back to Datasets
        </button>
      </div>
    );
  }

  if (!reconciliationData) {
    return (
      <div className="reconciliation-container">
        <p className="empty-state">No reconciliation data available</p>
        <button className="btn-primary" onClick={() => navigate('/datasets')}>
          Back to Datasets
        </button>
      </div>
    );
  }

  const filteredResults = getFilteredResults();
  const matchPercentage = reconciliationData.totalRecords > 0
    ? Math.round((reconciliationData.matchedRecords / reconciliationData.totalRecords) * 100)
    : 0;

  return (
    <div className="reconciliation-container">
      <div className="reconciliation-header">
        <div className="header-content">
          <button 
            className="btn-back" 
            onClick={() => navigate('/datasets')}
          >
            ← Back
          </button>
          <div className="header-title">
            <h1>Reconciliation Report</h1>
            <p className="dataset-name">
              {reconciliationData.datasetName || `Dataset: ${datasetId}`}
            </p>
          </div>
        </div>
      </div>

      {/* Key Metrics Section */}
      <div className="reconciliation-metrics">
        <div className="metric-card">
          <div className="metric-content">
            <span className="metric-label">Total Records</span>
            <span className="metric-value">{reconciliationData.totalRecords?.toLocaleString()}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-content">
            <span className="metric-label">Matched Records</span>
            <span className="metric-value" style={{ color: '#28a745' }}>
              {reconciliationData.matchedRecords?.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-content">
            <span className="metric-label">Unmatched Records</span>
            <span className="metric-value" style={{ color: '#dc3545' }}>
              {reconciliationData.unmatchedRecords?.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-content">
            <span className="metric-label">Match Rate</span>
            <span className="metric-value">{matchPercentage}%</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${matchPercentage}%`,
                backgroundColor: matchPercentage === 100 ? '#28a745' : matchPercentage >= 80 ? '#ffc107' : '#dc3545',
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Reconciliation Metadata */}
      {reconciliationData.reconciliedAt && (
        <div className="reconciliation-metadata">
          <span className="metadata-item">
            <strong>Reconciled At:</strong> {new Date(reconciliationData.reconciliedAt).toLocaleString()}
          </span>
          {reconciliationData.sourceDataset && (
            <span className="metadata-item">
              <strong>Source:</strong> {reconciliationData.sourceDataset}
            </span>
          )}
          {reconciliationData.targetDataset && (
            <span className="metadata-item">
              <strong>Target:</strong> {reconciliationData.targetDataset}
            </span>
          )}
          {reconciliationData.duration && (
            <span className="metadata-item">
              <strong>Duration:</strong> {reconciliationData.duration}ms
            </span>
          )}
        </div>
      )}

      {/* Detailed Metrics Breakdown */}
      {reconciliationData.metrics && (
        <div className="reconciliation-details">
          <h2>Detailed Metrics</h2>
          <div className="metrics-grid">
            {reconciliationData.metrics.map((metric, index) => (
              <div key={index} className="detail-metric-card">
                <div className="metric-header">
                  <h4>{metric.name}</h4>
                </div>
                <div className="metric-body">
                  {metric.value !== undefined && (
                    <div className="metric-stat">
                      <span className="stat-label">Value</span>
                      <span className="stat-value">{metric.value}</span>
                    </div>
                  )}
                  {metric.percentage !== undefined && (
                    <div className="metric-stat">
                      <span className="stat-label">Percentage</span>
                      <span className="stat-value">{metric.percentage}%</span>
                    </div>
                  )}
                  {metric.description && (
                    <p className="metric-description">{metric.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Controls */}
      <div className="reconciliation-filters">
        <div className="filter-controls">
          <label htmlFor="filter-select">Filter Results:</label>
          <select
            id="filter-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="all">All ({reconciliationData.discrepancies?.length || 0})</option>
            <option value="matched">Matched ({reconciliationData.discrepancies?.filter(r => r.status === 'matched').length || 0})</option>
            <option value="unmatched">Unmatched ({reconciliationData.discrepancies?.filter(r => r.status === 'unmatched').length || 0})</option>
            <option value="errors">Errors ({reconciliationData.discrepancies?.filter(r => r.status === 'error').length || 0})</option>
          </select>
        </div>
        <div className="view-mode-toggle">
          <button
            className={`view-toggle-btn ${viewMode === 'metrics' ? 'active' : ''}`}
            onClick={() => setViewMode('metrics')}
            title="Metrics View"
          >
            📊 Metrics
          </button>
          <button
            className={`view-toggle-btn ${viewMode === 'details' ? 'active' : ''}`}
            onClick={() => setViewMode('details')}
            title="Details View"
          >
            📋 Details
          </button>
        </div>
      </div>

      {/* Discrepancies Section */}
      {reconciliationData.discrepancies && reconciliationData.discrepancies.length > 0 && (
        <div className="reconciliation-results">
          <h2>Discrepancies & Issues</h2>
          {filteredResults.length === 0 ? (
            <p className="empty-state">No results match the selected filter</p>
          ) : (
            <div className="discrepancies-list">
              {filteredResults.map((discrepancy, index) => (
                <div key={discrepancy.id || index} className="discrepancy-item">
                  <div
                    className="discrepancy-header"
                    onClick={() => toggleRowExpanded(discrepancy.id || index)}
                  >
                    <div className="discrepancy-status">
                      <span
                        className="status-dot"
                        style={{ backgroundColor: getStatusColor(discrepancy.status) }}
                      ></span>
                      <span className="status-text">{getStatusLabel(discrepancy.status)}</span>
                    </div>
                    <div className="discrepancy-title">
                      <h4>{discrepancy.recordId || `Record ${index + 1}`}</h4>
                      <p className="discrepancy-type">{discrepancy.discrepancyType}</p>
                    </div>
                    <button className="expand-btn">
                      {expandedRows[discrepancy.id || index] ? '▼' : '▶'}
                    </button>
                  </div>

                  {expandedRows[discrepancy.id || index] && (
                    <div className="discrepancy-details">
                      {discrepancy.sourceValue !== undefined && (
                        <div className="detail-row">
                          <span className="detail-label">Source Value:</span>
                          <span className="detail-value">{String(discrepancy.sourceValue)}</span>
                        </div>
                      )}
                      {discrepancy.targetValue !== undefined && (
                        <div className="detail-row">
                          <span className="detail-label">Target Value:</span>
                          <span className="detail-value">{String(discrepancy.targetValue)}</span>
                        </div>
                      )}
                      {discrepancy.differenceType && (
                        <div className="detail-row">
                          <span className="detail-label">Difference Type:</span>
                          <span className="detail-value">{discrepancy.differenceType}</span>
                        </div>
                      )}
                      {discrepancy.affectedColumns && discrepancy.affectedColumns.length > 0 && (
                        <div className="detail-row">
                          <span className="detail-label">Affected Columns:</span>
                          <span className="detail-value">
                            {discrepancy.affectedColumns.join(', ')}
                          </span>
                        </div>
                      )}
                      {discrepancy.severity && (
                        <div className="detail-row">
                          <span className="detail-label">Severity:</span>
                          <span className="detail-value">{discrepancy.severity}</span>
                        </div>
                      )}
                      {discrepancy.suggestion && (
                        <div className="detail-row suggestion-row">
                          <span className="detail-label">Resolution:</span>
                          <span className="detail-value suggestion-text">
                            {discrepancy.suggestion}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="reconciliation-actions">
        <button className="btn-primary" onClick={() => navigate('/datasets')}>
          Back to Datasets
        </button>
        <button className="btn-secondary" onClick={fetchReconciliationData}>
          Refresh Data
        </button>
      </div>
    </div>
  );
}
