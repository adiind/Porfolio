// Temporary test file to verify React is mounting
// If this works, the issue is in the original App component

import React from 'react';

const App: React.FC = () => {
  return (
    <div style={{ 
      color: 'white', 
      padding: '40px',
      fontSize: '24px',
      background: '#050505',
      minHeight: '100vh'
    }}>
      <h1>React is Working!</h1>
      <p>If you see this, React is mounting correctly.</p>
      <p>The issue is likely in the original App component.</p>
    </div>
  );
};

export default App;


