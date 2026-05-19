import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { getMetrics, getMetricsOverview } from '../services/metricsService';
import '../styles/metrics.css';

export default function Metrics() {
  const [metrics, setMetrics] = useState(null);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const [metricsData, overviewData] = await Promise.all([
        getMetrics(),
        getMetricsOverview()
      ]);
      setMetrics(metricsData);
      setOverview(overviewData);
    } catch (err) {
      setError(err.message || 'Failed to fetch metrics');
      console.error('Error fetching metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="metrics-container">
          <div className="loading">Loading metrics...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="metrics-container">
        <div className="metrics-header">
          <h1>Metrics Dashboard</h1>
          <button className="btn-primary" onClick={fetchMetrics}>
            Refresh
          </button>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <div className="metrics-tabs">
          <button
            className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`tab-button ${activeTab === 'detailed' ? 'active' : ''}`}
            onClick={() => setActiveTab('detailed')}
          >
            Detailed Metrics
          </button>
        </div>

        {activeTab === 'overview' && overview && (
          <div className="metrics-overview">
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-label">Total Datasets</div>
                <div className="metric-value">{overview.totalDatasets || 0}</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Total Validations</div>
                <div className="metric-value">{overview.totalValidations || 0}</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Data Quality Score</div>
                <div className="metric-value">{(overview.dataQualityScore || 0).toFixed(2)}%</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Passed Validations</div>
                <div className="metric-value metric-success">{overview.passedValidations || 0}</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Failed Validations</div>
                <div className="metric-value metric-error">{overview.failedValidations || 0}</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Anomalies Detected</div>
                <div className="metric-value metric-warning">{overview.anomaliesDetected || 0}</div>
              </div>
            </div>

            {overview.topIssues && overview.topIssues.length > 0 && (
              <div className="top-issues">
                <h3>Top Issues</h3>
                <ul>
                  {overview.topIssues.map((issue, index) => (
                    <li key={index}>
                      <span className="issue-name">{issue.name}</span>
                      <span className="issue-count">{issue.count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === 'detailed' && metrics && (
          <div className="metrics-detailed">
            {Array.isArray(metrics) && metrics.length > 0 ? (
              <div className="metrics-table-wrapper">
                <table className="metrics-table">
                  <thead>
                    <tr>
                      <th>Dataset</th>
                      <th>Validations</th>
                      <th>Passed</th>
                      <th>Failed</th>
                      <th>Quality Score</th>
                      <th>Last Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.map((metric, index) => (
                      <tr key={index}>
                        <td>{metric.datasetName || 'N/A'}</td>
                        <td>{metric.totalValidations || 0}</td>
                        <td className="success">{metric.passedValidations || 0}</td>
                        <td className="error">{metric.failedValidations || 0}</td>
                        <td>
                          <div className="score-bar">
                            <div
                              className="score-fill"
                              style={{
                                width: `${metric.qualityScore || 0}%`,
                                backgroundColor: metric.qualityScore >= 80 ? '#28a745' : metric.qualityScore >= 60 ? '#ffc107' : '#dc3545'
                              }}
                            />
                          </div>
                          <span>{(metric.qualityScore || 0).toFixed(2)}%</span>
                        </td>
                        <td>{new Date(metric.lastUpdated).toLocaleDateString() || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="no-data">No detailed metrics available</div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
