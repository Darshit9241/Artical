import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SiyaRamArticle from './components/SiyaRamArticle';
import Login from './components/Login';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Check localStorage on initial load
    return localStorage.getItem('isAuthenticated') === 'true';
  });

  // Update localStorage whenever authentication state changes
  useEffect(() => {
    localStorage.setItem('isAuthenticated', isAuthenticated.toString());
  }, [isAuthenticated]);

  const handleLogin = (email: string, password: string) => {
    // Check for specific credentials
    if (email === 'siyaram@gmail.com' && password === 'siyaram@') {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} isAuthenticated={isAuthenticated} />} />
          <Route 
            path="/" 
            element={
              isAuthenticated ? <SiyaRamArticle onLogout={handleLogout} /> : <Navigate to="/login" />
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
