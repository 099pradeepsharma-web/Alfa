import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Container } from './components/Container';
import { Card } from './components/Card';
import '../src/styles/theme.css';

const AppLayout = () => {
  // Example simple app layout
  const [message, setMessage] = useState('Welcome to Alfanumrik!');

  return (
    <>
      <Navbar />
      <Container>
        <Card title="Dashboard">
          <p>{message}</p>
          <button onClick={() => setMessage('Have a great learning day!')}>Change Message</button>
        </Card>
      </Container>
    </>
  );
};

export default AppLayout;
