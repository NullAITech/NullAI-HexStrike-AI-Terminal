import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const TerminalPage = () => {
  const [target, setTarget] = useState('');
  const [tool, setTool] = useState('nmap');
  const [toolLogs, setToolLogs] = useState(["[SYSTEM] Tool Engine Ready..."]);
  const [aiLogs, setAiLogs] = useState(["[SYSTEM] LocalAI Core Initialized..."]);
  const [executing, setExecuting] = useState(false);

  const toolRef = useRef(null);
  const aiRef = useRef(null);

  useEffect(() => {
    toolRef.current?.scrollIntoView({ behavior: "smooth" });
    aiRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [toolLogs, aiLogs]);

  const executeStrike = async () => {
    if (!target || executing) return;
    setExecuting(true);
    setToolLogs(prev => [...prev, `> DISPATCHING ${tool.toUpperCase()} ON ${target}...`]);
    setAiLogs(prev => [...prev, `> AI analyzing target vector: ${target}...`]);

    try {
      const response = await axios.post('http://localhost:8000/execute', { tool, target });
      
      // Update both panes with the returned data
      setToolLogs(prev => [...prev, response.data.output || "No tool output recorded."]);
      setAiLogs(prev => [...prev, response.data.analysis || "AI reasoning unavailable."]);
    } catch (err) {
      setToolLogs(prev => [...prev, `[ERROR] Strike Failed: ${err.message}`]);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Control Bar */}
      <div style={{ padding: '20px', display: 'flex', gap: '15px', borderBottom: '1px solid var(--border-color)' }}>
        <select 
          value={tool} 
          onChange={(e) => setTool(e.target.value)} 
          style={{ background: '#000', color: 'red', border: '1px solid red' }}
        >
          <optgroup label="OSINT & Recon">
            <option value="emailharvester">EmailHarvester (Domain OSINT)</option>
            <option value="sherlock">Sherlock (Social Search)</option>
            <option value="nmap">Nmap (Network Scan)</option>
            <option value="autorecon">AutoRecon (Enumeration)</option>
          </optgroup>
          <optgroup label="Vulnerability & Web">
            <option value="nikto">Nikto (Web Scan)</option>
            <option value="sqlmap">SQLmap (DB Injection)</option>
            <option value="trufflehog">TruffleHog (Secret Leakage)</option>
          </optgroup>
        </select>
        <input 
          type="text" placeholder="TARGET IP/DOMAIN" value={target}
          onChange={(e) => setTarget(e.target.value)}
          style={{ background: '#000', color: 'white', border: '1px solid red', padding: '5px', width: '300px' }}
        />
        <button onClick={executeStrike} disabled={executing} style={{ background: executing ? '#555' : 'red', color: 'black', fontWeight: 'bold', border: 'none', padding: '5px 20px', cursor: 'pointer' }}>
          {executing ? 'STRIKING...' : 'EXECUTE'}
        </button>
      </div>

      {/* Split Screen Terminal */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ flex: 1, borderRight: '1px solid var(--border-color)' }}>
          <div style={{ padding: '5px 15px', color: 'red', borderBottom: '1px solid #220000', fontSize: '0.7rem' }}>TOOL OUTPUT</div>
          <div className="terminal-pane">
            {toolLogs.map((log, i) => <div key={i} style={{ marginBottom: '8px' }}>{log}</div>)}
            <div ref={toolRef} />
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ padding: '5px 15px', color: '#ff5555', borderBottom: '1px solid #220000', fontSize: '0.7rem' }}>AI INTELLIGENCE (LOCALAI)</div>
          <div className="terminal-pane" style={{ color: '#ffaaaa' }}>
            {aiLogs.map((log, i) => <div key={i} style={{ marginBottom: '8px' }}>{log}</div>)}
            <div ref={aiRef} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TerminalPage;