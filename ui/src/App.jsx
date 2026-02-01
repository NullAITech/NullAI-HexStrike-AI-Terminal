import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TerminalPage from './pages/TerminalPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<TerminalPage />} />
      </Routes>
    </Router>
  );
}

export default App;