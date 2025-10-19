import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Container } from './components/Container';
import { Card } from './components/Card';
import Dashboard from './screens/Dashboard';
import AuthScreen from './screens/AuthScreen';
import '../src/styles/theme.css';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  return (
    <>
      <Navbar />
      <Container>
        {isLoggedIn ? (
          <>
            <button onClick={handleLogout} style={{ marginBottom: '1rem' }}>
              Logout
            </button>
            <Dashboard
              studentName="Alice"
              masteryLevel={75}
              onStartLearning={() => alert('Start Learning Clicked!')}
            />
          </>
        ) : (
          <>
            <AuthScreen onLogin={handleLogin} />
          </>
        )}
      </Container>
    </>
  );
};

export default App;
