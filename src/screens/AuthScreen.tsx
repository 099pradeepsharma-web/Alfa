import React, { useState } from 'react';
import '../styles/theme.css';

interface AuthScreenProps {
  onLogin: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement actual auth logic here
    alert(`Logging in with ${email}`);
    onLogin();
  };

  return (
    <div className="container" style={{ maxWidth: '400px' }}>
      <form onSubmit={handleSubmit} className="card">
        <h2>Login to Alfanumrik</h2>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input"
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="input"
          />
        </div>
        <button type="submit">Log In</button>
      </form>
    </div>
  );
};

export default AuthScreen;
