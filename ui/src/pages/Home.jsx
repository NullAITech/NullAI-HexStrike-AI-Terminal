import React from 'react';

const Home = () => {
  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h1 className="glow-text" style={{ fontSize: '3rem', color: 'var(--blood-red)' }}>HEXSTRIKE AI</h1>
      <p style={{ fontSize: '1.2rem', color: '#888' }}>Offensive Intelligence Core Engaged.</p>
      <div className="border-red" style={{ marginTop: '30px', padding: '20px', display: 'inline-block' }}>
        <p>SYSTEM STATUS: <span style={{ color: '#00ff00' }}>ONLINE</span></p>
        <p>ACTIVE MODULES: 150+</p>
        <p>ENVIRONMENT: PARROT OS 7 (ECHO)</p>
      </div>
    </div>
  );
};

export default Home;