import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getValidationResults } from '../services/datasetService';

export default function Validation() {
  const { datasetId } = useParams();
  const navigate = useNavigate();
  const [validationData, setValidationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRules, setExpandedRules] = useState({});
  const [filterType, setFilterType] = useState('all'); // all, errors, warnings, passed

  useEffect(() => {
    if (datasetId) {
      fetchValidationResults();
    }
  }, [datasetId]);

  const fetchValidationResults = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getValidationResults(datasetId);
      setValidationData(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch validation results');
      setValidationData(null);
    } finally {
      setLoading(false);
    }
  };

  const toggleRuleExpanded = (ruleId) => {
    setExpandedRules((prev) => ({
      ...prev,
      [ruleId]: !prev[ruleId],
    }));
  };

  const getFilteredResults = () => {
    if (!validationData?.results) return [];

    switch (filterType) {
      case 'errors':
        return validationData.results.filter((r) => r.status === 'failed');
      case 'warnings':
        return validationData.results.filter((r) => r.status === 'warning');
      case 'passed':
        return validationData.results.filter((r) => r.status === 'passed');
      default:
        return validationData.results;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'passed':
        return '#28a745';
      case 'failed':
        return '#dc3545';
      case 'warning':
        return '#ffc107';
      default:
        return '#6c757d';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'passed':
        return '✓ Passed';
      case 'failed':
        return '✗ Failed';
      case 'warning':
        return '⚠ Warning';
      default:
        return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="validation-container">
        <p>Loading validation results...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="validation-container">
        <div className="alert alert-error">Error: {error}</div>
        <button className="btn-primary" onClick={() => navigate('/datasets')}>
          Back to Datasets
        </button>
      </div>
    );
  }

  if (!validationData) {
    return (
      <div className="validation-container">
        <p className="empty-state">No validation data available</p>
        <button className="btn-primary" onClick={() => navigate('/datasets')}>
          Back to Datasets
        </button>
      </div>
    );
  }

  const filteredResults = getFilteredResults();
  const summaryStats = {
    total: validationData.results?.length || 0,
    passed: validationData.results?.filter((r) => r.status === 'passed').length || 0,
    failed: validationData.results?.filter((r) => r.status === 'failed').length || 0,
    warning: validationData.results?.filter((r) => r.status === 'warning').length || 0,
  };

  const passPercentage = summaryStats.total > 0 ? Math.round((summaryStats.passed / summaryStats.total) * 100) : 0;

  return (
    <div className="validation-container">
      <div className="validation-header">
        <div className="header-content">
          <button 
            className="btn-back" 
            onClick={() => navigate('/datasets')}
          >
            ← Back
          </button>
          <div className="header-title">
            <h1>Validation Results</h1>
            <p className="dataset-name">
              {validationData.datasetName || `Dataset: ${datasetId}`}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Section */}
      <div className="validation-summary">
        <div className="summary-card">
          <div className="summary-metric">
            <span className="metric-label">Overall Status</span>
            <div className="status-indicator">
              {validationData.overallStatus === 'passed' && (
                <span className="status-badge status-passed">✓ Passed</span>
              )}
              {validationData.overallStatus === 'failed' && (
                <span className="status-badge status-failed">✗ Failed</span>
              )}
              {validationData.overallStatus === 'warning' && (
                <span className="status-badge status-pending">⚠ Warning</span>
              )}
            </div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-metric">
            <span className="metric-label">Pass Rate</span>
            <span className="metric-value">{passPercentage}%</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${passPercentage}%`,
                backgroundColor: passPercentage === 100 ? '#28a745' : passPercentage >= 50 ? '#ffc107' : '#dc3545',
              }}
            ></div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-metric-row">
            <div className="metric-column">
              <span className="metric-label">Passed</span>
              <span className="metric-value" style={{ color: '#28a745' }}>
                {summaryStats.passed}
              </span>
            </div>
            <div className="metric-column">
              <span className="metric-label">Failed</span>
              <span className="metric-value" style={{ color: '#dc3545' }}>
                {summaryStats.failed}
              </span>
            </div>
            <div className="metric-column">
              <span className="metric-label">Warnings</span>
              <span className="metric-value" style={{ color: '#ffc107' }}>
                {summaryStats.warning}
              </span>
            </div>
            <div className="metric-column">
              <span className="metric-label">Total</span>
              <span className="metric-value">{summaryStats.total}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Validation Metadata */}
      {validationData.validatedAt && (
        <div className="validation-metadata">
          <span className="metadata-item">
            <strong>Validated At:</strong> {new Date(validationData.validatedAt).toLocaleString()}
          </span>
          {validationData.duration && (
            <span className="metadata-item">
              <strong>Duration:</strong> {validationData.duration}ms
            </span>
          )}
          {validationData.totalRecords && (
            <span className="metadata-item">
              <strong>Total Records:</strong> {validationData.totalRecords.toLocaleString()}
            </span>
          )}
        </div>
      )}

      {/* Filter Section */}
      <div className="validation-filters">
        <label htmlFor="filter-select">Filter Results:</label>
        <select
          id="filter-select"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="filter-select"
        >
          <option value="all">All ({summaryStats.total})</option>
          <option value="passed">Passed ({summaryStats.passed})</option>
          <option value="failed">Failed ({summaryStats.failed})</option>
          <option value="warnings">Warnings ({summaryStats.warning})</option>
        </select>
      </div>

      {/* Results Section */}
      <div className="validation-results">
        {filteredResults.length === 0 ? (
          <p className="empty-state">No results match the selected filter</p>
        ) : (
          <div className="results-list">
            {filteredResults.map((result, index) => (
              <div key={result.ruleId || index} className="result-item">
                <div
                  className="result-header"
                  onClick={() => toggleRuleExpanded(result.ruleId || index)}
                >
                  <div className="result-status">
                    <span
                      className="status-dot"
                      style={{ backgroundColor: getStatusColor(result.status) }}
                    ></span>
                    <span className="status-text">{getStatusLabel(result.status)}</span>
                  </div>
                  <div className="result-title">
                    <h3>{result.ruleName}</h3>
                    <p className="rule-description">{result.description}</p>
                  </div>
                  <button className="expand-btn">
                    {expandedRules[result.ruleId || index] ? '▼' : '▶'}
                  </button>
                </div>

                {expandedRules[result.ruleId || index] && (
                  <div className="result-details">
                    {result.severity && (
                      <div className="detail-row">
                        <span className="detail-label">Severity:</span>
                        <span className="detail-value">{result.severity}</span>
                      </div>
                    )}
                    {result.affectedRecords && (
                      <div className="detail-row">
                        <span className="detail-label">Affected Records:</span>
                        <span className="detail-value">
                          {result.affectedRecords.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {result.affectedColumns && result.affectedColumns.length > 0 && (
                      <div className="detail-row">
                        <span className="detail-label">Affected Columns:</span>
                        <span className="detail-value">
                          {result.affectedColumns.join(', ')}
                        </span>
                      </div>
                    )}
                    {result.errorMessage && (
                      <div className="detail-row">
                        <span className="detail-label">Error Message:</span>
                        <span className="detail-value error-message">
                          {result.errorMessage}
                        </span>
                      </div>
                    )}
                    {result.suggestion && (
                      <div className="detail-row suggestion-row">
                        <span className="detail-label">Suggestion:</span>
                        <span className="detail-value suggestion-text">
                          {result.suggestion}
                        </span>
                      </div>
                    )}
                    {result.samples && result.samples.length > 0 && (
                      <div className="detail-row">
                        <span className="detail-label">Sample Records:</span>
                        <div className="samples-list">
                          {result.samples.slice(0, 3).map((sample, idx) => (
                            <pre key={idx} className="sample-item">
                              {JSON.stringify(sample, null, 2)}
                            </pre>
                          ))}
                          {result.samples.length > 3 && (
                            <p className="samples-more">
                              +{result.samples.length - 3} more samples
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="validation-actions">
        <button className="btn-primary" onClick={() => navigate('/datasets')}>
          Back to Datasets
        </button>
        <button className="btn-secondary" onClick={fetchValidationResults}>
          Refresh Results
        </button>
      </div>
    </div>
  );
}
