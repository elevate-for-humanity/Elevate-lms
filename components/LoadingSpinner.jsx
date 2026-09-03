import React from 'react';

export const LoadingSpinner = ({ size = 'medium', message = 'Loading...' }) => {
  return (
    <div className="loading-spinner-container">
      <div className={`spinner spinner-${size}`} />
      {message && <p>{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
