import React from 'react';
import '../styles/loading-spinner.css';

const LoadingSpinner = ({ fullScreen = false, message = 'Loading...' }) => {
  const containerClass = fullScreen ? 'spinner-fullscreen' : 'spinner-inline';

  return (
    <div className={containerClass}>
      <div className="spinner-container">
        <div className="spinner"></div>
        {message && <p className="spinner-message">{message}</p>}
      </div>
    </div>
  );
};

export default LoadingSpinner;
