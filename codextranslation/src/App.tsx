import React, { useState } from 'react';
import TranslatorWorkspace from './pages/TranslatorWorkspace';
import LoginPage from './pages/LoginPage';
import './styles/app.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  return (
    <div>
      {isAuthenticated ? (
        <TranslatorWorkspace />
      ) : (
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}

export default App;
