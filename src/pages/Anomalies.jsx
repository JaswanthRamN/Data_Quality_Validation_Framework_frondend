import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';

export default function Anomalies() {
  const { datasetId } = useParams();
  const navigate = useNavigate();
  const [anomaliesData, setAnomaliesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  const [filterType, setFilterType] = useState('all'); // all, critical, major, minor
  const [filterAnomalyType, setFilterAnomalyType] = useState('all'); // all, outlier, duplicate, missing, statistical, pattern
  const [filterConfidence, setFilterConfidence] = useState('all'); // all, high, medium, low
  const [searchColumn, setSearchColumn] = useState('');
  const [searchRecordId, setSearchRecordId] = useState('');
  const [sortBy, setSortBy] = useState('severity'); // severity, confidence, column, recordId
  const [sortOrder, setSortOrder] = useState('desc'); // asc, desc

  useEffect(() => {
    if (datasetId) {
      fetchAnomaliesData();
    }
  }, [datasetId]);

  const fetchAnomaliesData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(`/datasets/${datasetId}/anomalies`);
      setAnomaliesData(response);
    } catch (err) {
      setError(err.message || 'Failed to fetch anomalies data');
      setAnomaliesData(null);
    } finally {
      setLoading(false);
    }
  };

  const toggleRowExpanded = (anomalyId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [anomalyId]: !prev[anomalyId],
    }));
  };

  const getFilteredAnomalies = () => {
    if (!anomaliesData?.anomalies) return [];

    let filtered = anomaliesData.anomalies;

    if (filterType !== 'all') {
      filtered = filtered.filter((a) => a.severity === filterType);
    }

    if (filterAnomalyType !== 'all') {
      filtered = filtered.filter((a) => a.type === filterAnomalyType);
    }

    if (filterConfidence !== 'all') {
      filtered = filtered.filter((a) => {
        const confidence = a.confidence || 0;
        if (filterConfidence === 'high') return confidence >= 80;
        if (filterConfidence === 'medium') return confidence >= 50 && confidence < 80;
        if (filterConfidence === 'low') return confidence < 50;
        return true;
      });
    }

    if (searchColumn.trim()) {
      const searchTerm = searchColumn.toLowerCase();
      filtered = filtered.filter((a) => 
        a.column?.toLowerCase().includes(searchTerm)
      );
    }

    if (searchRecordId.trim()) {
      const searchTerm = searchRecordId.toLowerCase();
      filtered = filtered.filter((a) => 
        a.recordId?.toString().toLowerCase().includes(searchTerm)
      );
    }

    // Sorting
    filtered = filtered.sort((a, b) => {
      let compareValue = 0;
      
      if (sortBy === 'severity') {
        const severityOrder = { critical: 0, major: 1, minor: 2 };
        compareValue = (severityOrder[a.severity] || 3) - (severityOrder[b.severity] || 3);
      } else if (sortBy === 'confidence') {
        compareValue = (a.confidence || 0) - (b.confidence || 0);
      } else if (sortBy === 'column') {
        compareValue = (a.column || '').localeCompare(b.column || '');
      } else if (sortBy === 'recordId') {
        compareValue = (a.recordId || '').toString().localeCompare((b.recordId || '').toString());
      }

      return sortOrder === 'desc' ? -compareValue : compareValue;
    });

    return filtered;
  };

  const resetFilters = () => {
    setFilterType('all');
    setFilterAnomalyType('all');
    setFilterConfidence('all');
    setSearchColumn('');
    setSearchRecordId('');
    setSortBy('severity');
    setSortOrder('desc');
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return '#dc3545';
      case 'major':
        return '#fd7e14';
      case 'minor':
        return '#ffc107';
      default:
        return '#6c757d';
    }
  };

  const getSeverityLabel = (severity) => {
    switch (severity) {
      case 'critical':
        return '🔴 Critical';
      case 'major':
        return '🟠 Major';
      case 'minor':
        return '🟡 Minor';
      default:
        return '⚪ Unknown';
    }
  };

  const getAnomalyTypeLabel = (type) => {
    const labels = {
      outlier: 'Outlier',
      duplicate: 'Duplicate',
      missing: 'Missing Value',
      statistical: 'Statistical Anomaly',
      pattern: 'Pattern Anomaly',
      threshold: 'Threshold Breach',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="anomalies-container">
        <p>Loading anomalies data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="anomalies-container">
        <div className="alert alert-error">Error: {error}</div>
        <button className="btn-primary" onClick={() => navigate('/datasets')}>
          Back to Datasets
        </button>
      </div>
    );
  }

  if (!anomaliesData) {
    return (
      <div className="anomalies-container">
        <p className="empty-state">No anomalies data available</p>
        <button className="btn-primary" onClick={() => navigate('/datasets')}>
          Back to Datasets
        </button>
      </div>
    );
  }

  const filteredAnomalies = getFilteredAnomalies();
  const severityBreakdown = {
    critical: anomaliesData.anomalies?.filter((a) => a.severity === 'critical').length || 0,
    major: anomaliesData.anomalies?.filter((a) => a.severity === 'major').length || 0,
    minor: anomaliesData.anomalies?.filter((a) => a.severity === 'minor').length || 0,
  };

  const anomalyTypeBreakdown = {
    outlier: anomaliesData.anomalies?.filter((a) => a.type === 'outlier').length || 0,
    duplicate: anomaliesData.anomalies?.filter((a) => a.type === 'duplicate').length || 0,
    missing: anomaliesData.anomalies?.filter((a) => a.type === 'missing').length || 0,
    statistical: anomaliesData.anomalies?.filter((a) => a.type === 'statistical').length || 0,
    pattern: anomaliesData.anomalies?.filter((a) => a.type === 'pattern').length || 0,
  };

  const totalAnomalies = anomaliesData.anomalies?.length || 0;
  const anomalyPercentage = anomaliesData.totalRecords > 0
    ? Math.round((totalAnomalies / anomaliesData.totalRecords) * 100)
    : 0;

  return (
    <div className="anomalies-container">
      <div className="anomalies-header">
        <div className="header-content">
          <button 
            className="btn-back" 
            onClick={() => navigate('/datasets')}
          >
            ← Back
          </button>
          <div className="header-title">
            <h1>Anomalies Detection</h1>
            <p className="dataset-name">
              {anomaliesData.datasetName || `Dataset: ${datasetId}`}
            </p>
          </div>
        </div>
      </div>

      {/* Key Metrics Section */}
      <div className="anomalies-metrics">
        <div className="metric-card">
          <div className="metric-content">
            <span className="metric-label">Total Records</span>
            <span className="metric-value">{anomaliesData.totalRecords?.toLocaleString()}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-content">
            <span className="metric-label">Anomalies Detected</span>
            <span className="metric-value" style={{ color: '#dc3545' }}>
              {totalAnomalies}
            </span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-content">
            <span className="metric-label">Anomaly Rate</span>
            <span className="metric-value">{anomalyPercentage}%</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${anomalyPercentage}%`,
                backgroundColor: anomalyPercentage === 0 ? '#28a745' : anomalyPercentage < 5 ? '#ffc107' : '#dc3545',
              }}
            ></div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-content">
            <span className="metric-label">Records Affected</span>
            <span className="metric-value">
              {anomaliesData.affectedRecords?.toLocaleString() || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Anomalies Metadata */}
      {anomaliesData.detectedAt && (
        <div className="anomalies-metadata">
          <span className="metadata-item">
            <strong>Detected At:</strong> {new Date(anomaliesData.detectedAt).toLocaleString()}
          </span>
          {anomaliesData.duration && (
            <span className="metadata-item">
              <strong>Duration:</strong> {anomaliesData.duration}ms
            </span>
          )}
          {anomaliesData.algorithm && (
            <span className="metadata-item">
              <strong>Algorithm:</strong> {anomaliesData.algorithm}
            </span>
          )}
          {anomaliesData.sensitivity && (
            <span className="metadata-item">
              <strong>Sensitivity:</strong> {anomaliesData.sensitivity}
            </span>
          )}
        </div>
      )}

      {/* Severity Breakdown */}
      <div className="anomalies-breakdown">
        <div className="breakdown-section">
          <h3>By Severity</h3>
          <div className="breakdown-grid">
            <div className="breakdown-item">
              <span className="breakdown-label">Critical</span>
              <span className="breakdown-value" style={{ color: '#dc3545' }}>
                {severityBreakdown.critical}
              </span>
            </div>
            <div className="breakdown-item">
              <span className="breakdown-label">Major</span>
              <span className="breakdown-value" style={{ color: '#fd7e14' }}>
                {severityBreakdown.major}
              </span>
            </div>
            <div className="breakdown-item">
              <span className="breakdown-label">Minor</span>
              <span className="breakdown-value" style={{ color: '#ffc107' }}>
                {severityBreakdown.minor}
              </span>
            </div>
          </div>
        </div>

        <div className="breakdown-section">
          <h3>By Type</h3>
          <div className="breakdown-grid">
            {Object.entries(anomalyTypeBreakdown).map(([type, count]) => (
              <div key={type} className="breakdown-item">
                <span className="breakdown-label">{getAnomalyTypeLabel(type)}</span>
                <span className="breakdown-value">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="anomalies-filters">
        <div className="filter-controls">
          <div className="filter-group">
            <label htmlFor="severity-filter">By Severity:</label>
            <select
              id="severity-filter"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical ({severityBreakdown.critical})</option>
              <option value="major">Major ({severityBreakdown.major})</option>
              <option value="minor">Minor ({severityBreakdown.minor})</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="type-filter">By Type:</label>
            <select
              id="type-filter"
              value={filterAnomalyType}
              onChange={(e) => setFilterAnomalyType(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Types</option>
              <option value="outlier">Outlier ({anomalyTypeBreakdown.outlier})</option>
              <option value="duplicate">Duplicate ({anomalyTypeBreakdown.duplicate})</option>
              <option value="missing">Missing Value ({anomalyTypeBreakdown.missing})</option>
              <option value="statistical">Statistical ({anomalyTypeBreakdown.statistical})</option>
              <option value="pattern">Pattern ({anomalyTypeBreakdown.pattern})</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="confidence-filter">By Confidence:</label>
            <select
              id="confidence-filter"
              value={filterConfidence}
              onChange={(e) => setFilterConfidence(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Confidence Levels</option>
              <option value="high">High (≥80%)</option>
              <option value="medium">Medium (50-79%)</option>
              <option value="low">Low (&lt;50%)</option>
            </select>
          </div>
        </div>

        <div className="filter-controls">
          <div className="filter-group">
            <label htmlFor="column-search">Search Column:</label>
            <input
              id="column-search"
              type="text"
              placeholder="Enter column name..."
              value={searchColumn}
              onChange={(e) => setSearchColumn(e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label htmlFor="recordid-search">Search Record ID:</label>
            <input
              id="recordid-search"
              type="text"
              placeholder="Enter record ID..."
              value={searchRecordId}
              onChange={(e) => setSearchRecordId(e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label htmlFor="sort-by">Sort By:</label>
            <select
              id="sort-by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="severity">Severity</option>
              <option value="confidence">Confidence</option>
              <option value="column">Column</option>
              <option value="recordId">Record ID</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="sort-order">Order:</label>
            <select
              id="sort-order"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="filter-select"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>

          <button 
            className="btn-reset-filters" 
            onClick={resetFilters}
            title="Reset all filters to default"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Anomalies List */}
      <div className="anomalies-results">
        <h2>Detected Anomalies</h2>
        {filteredAnomalies.length === 0 ? (
          <p className="empty-state">No anomalies match the selected filters</p>
        ) : (
          <div className="anomalies-list">
            {filteredAnomalies.map((anomaly, index) => (
              <div key={anomaly.id || index} className="anomaly-item">
                <div
                  className="anomaly-header"
                  onClick={() => toggleRowExpanded(anomaly.id || index)}
                >
                  <div className="anomaly-status">
                    <span
                      className="status-dot"
                      style={{ backgroundColor: getSeverityColor(anomaly.severity) }}
                    ></span>
                    <span className="status-text">{getSeverityLabel(anomaly.severity)}</span>
                  </div>
                  <div className="anomaly-title">
                    <h4>{getAnomalyTypeLabel(anomaly.type)}</h4>
                    <p className="anomaly-description">{anomaly.description}</p>
                  </div>
                  <button className="expand-btn">
                    {expandedRows[anomaly.id || index] ? '▼' : '▶'}
                  </button>
                </div>

                {expandedRows[anomaly.id || index] && (
                  <div className="anomaly-details">
                    {anomaly.recordId && (
                      <div className="detail-row">
                        <span className="detail-label">Record ID:</span>
                        <span className="detail-value">{anomaly.recordId}</span>
                      </div>
                    )}
                    {anomaly.column && (
                      <div className="detail-row">
                        <span className="detail-label">Column:</span>
                        <span className="detail-value">{anomaly.column}</span>
                      </div>
                    )}
                    {anomaly.value !== undefined && (
                      <div className="detail-row">
                        <span className="detail-label">Value:</span>
                        <span className="detail-value">{String(anomaly.value)}</span>
                      </div>
                    )}
                    {anomaly.expectedRange && (
                      <div className="detail-row">
                        <span className="detail-label">Expected Range:</span>
                        <span className="detail-value">{anomaly.expectedRange}</span>
                      </div>
                    )}
                    {anomaly.confidence && (
                      <div className="detail-row">
                        <span className="detail-label">Confidence:</span>
                        <span className="detail-value">{anomaly.confidence}%</span>
                      </div>
                    )}
                    {anomaly.metrics && (
                      <div className="detail-row">
                        <span className="detail-label">Metrics:</span>
                        <div className="detail-value metrics-list">
                          {Object.entries(anomaly.metrics).map(([key, value]) => (
                            <span key={key} className="metric-badge">
                              {key}: {value}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {anomaly.recommendation && (
                      <div className="detail-row suggestion-row">
                        <span className="detail-label">Recommendation:</span>
                        <span className="detail-value suggestion-text">
                          {anomaly.recommendation}
                        </span>
                      </div>
                    )}
                    {anomaly.relatedRecords && anomaly.relatedRecords.length > 0 && (
                      <div className="detail-row">
                        <span className="detail-label">Related Records:</span>
                        <span className="detail-value">
                          {anomaly.relatedRecords.join(', ')}
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

      {/* Action Buttons */}
      <div className="anomalies-actions">
        <button className="btn-primary" onClick={() => navigate('/datasets')}>
          Back to Datasets
        </button>
        <button className="btn-secondary" onClick={fetchAnomaliesData}>
          Refresh Data
        </button>
      </div>
    </div>
  );
}
