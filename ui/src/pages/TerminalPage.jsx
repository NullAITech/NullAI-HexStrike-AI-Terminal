import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toolRegistry from '../data/tools.json';

const TerminalPage = () => {
  const [target, setTarget] = useState('');
  // Default to the first tool in the registry
  const [selectedToolId, setSelectedToolId] = useState(toolRegistry[0].id);
  const [toolLogs, setToolLogs] = useState(["[SYSTEM] Tool Engine Ready..."]);
  const [aiLogs, setAiLogs] = useState(["[SYSTEM] LocalAI Core Initialized (Capped @ 6GB RAM)..."]);
  const [executing, setExecuting] = useState(false);
  const [showFuture, setShowFuture] = useState(false);

  // References for auto-scrolling
  const toolRef = useRef(null);
  const aiRef = useRef(null);

  // Get current tool details for display
  const currentTool = toolRegistry.find(t => t.id === selectedToolId) || toolRegistry[0];

  // Auto-scroll effect
  useEffect(() => {
    toolRef.current?.scrollIntoView({ behavior: "smooth" });
    aiRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [toolLogs, aiLogs]);

  const executeStrike = async () => {
    if (!target || executing) return;
    setExecuting(true);
    
    // Add start logs
    setToolLogs(prev => [...prev, `\n> DISPATCHING ${currentTool.name.toUpperCase()} ON ${target}...`]);
    setAiLogs(prev => [...prev, `\n> AI ANALYZING VECTOR: ${target}...`]);

    try {
      // Send ID and Target to backend
      const response = await axios.post('http://localhost:8000/execute', { 
        tool: selectedToolId, 
        target: target 
      });
      
      setToolLogs(prev => [...prev, response.data.output || "No standard output returned."]);
      setAiLogs(prev => [...prev, response.data.analysis || "AI reasoning unavailable."]);
    } catch (err) {
      setToolLogs(prev => [...prev, `[ERROR] Strike Failed: ${err.message}`]);
      setAiLogs(prev => [...prev, `[ERROR] Connection lost to Neural Core.`]);
    } finally {
      setExecuting(false);
    }
  };

  const futureFeatures = [
    { name: "Metasploit Bridge", desc: "Automated exploit matching & payload delivery" },
    { name: "Live Packet Interceptor", desc: "Real-time AI traffic analysis via Wireshark" },
    { name: "Cloud Strike", desc: "AWS/Azure credential hunter & bucket scanner" },
    { name: "Deep-Fake Voice Recon", desc: "Social engineering audio generation" }
  ];

  return (
    <div className="hex-container">
      
      {/* --- CONTROL BAR --- */}
      <div className="control-bar">
        <div className="input-group">
          {/* Tool Selector */}
          <select 
            value={selectedToolId} 
            onChange={(e) => setSelectedToolId(e.target.value)}
            className="hex-select"
          >
            {[...new Set(toolRegistry.map(t => t.category))].map(cat => (
              <optgroup label={cat} key={cat}>
                {toolRegistry.filter(t => t.category === cat).map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
          
          {/* Target Input */}
          <input 
            type="text" 
            placeholder="TARGET IP/DOMAIN" 
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="hex-input"
          />
        </div>

        {/* Action Buttons */}
        <div className="button-group">
          <button 
            onClick={executeStrike} 
            disabled={executing} 
            className={`hex-button ${executing ? 'executing' : ''}`}
          >
            {executing ? 'STRIKING...' : 'EXECUTE'}
          </button>

          <button 
            onClick={() => setShowFuture(!showFuture)}
            className="future-button"
          >
            {showFuture ? 'CLOSE OPS' : 'FUTURE OPS'}
          </button>
        </div>

        {/* Dynamic Tool Info (Desktop Only mostly) */}
        <div className="tool-info">
          <span>{currentTool.info}</span>
          <a href={currentTool.link} target="_blank" rel="noreferrer">DOCS ↗</a>
        </div>
      </div>

      {/* --- MAIN TERMINAL AREA --- */}
      <div className="terminal-main">
        
        {/* Left Pane: Raw Tool Output */}
        <div className="terminal-column left-pane">
          <div className="pane-header">RAW_OUTPUT.LOG</div>
          <div className="terminal-content">
            {toolLogs.map((log, i) => (
              <div key={i} className="log-entry">{log}</div>
            ))}
            <div ref={toolRef} />
          </div>
        </div>

        {/* Right Pane: AI Intelligence */}
        <div className="terminal-column right-pane">
          <div className="pane-header ai-header">AI_INTELLIGENCE.EXE</div>
          <div className="terminal-content ai-content">
            {aiLogs.map((log, i) => (
              <div key={i} className="log-entry">{log}</div>
            ))}
            <div ref={aiRef} />
          </div>
        </div>

        {/* Future Ops Drawer (Overlay) */}
        {showFuture && (
          <div className="future-drawer">
            <h3>ENCRYPTED PIPELINE</h3>
            <p className="drawer-subtitle">Features currently in development:</p>
            {futureFeatures.map((f, i) => (
              <div key={i} className="feature-item">
                <div className="feature-name">[LOCKED] {f.name}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- STYLES --- */}
      <style>{`
        /* Global Layout */
        .hex-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background-color: #050000;
          color: #ff0000;
          font-family: 'Courier New', Courier, monospace;
          overflow: hidden;
        }

        /* Control Bar */
        .control-bar {
          padding: 15px;
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
          border-bottom: 2px solid #330000;
          background: linear-gradient(180deg, #1a0000 0%, #050000 100%);
          align-items: center;
        }
        .input-group {
          display: flex;
          gap: 10px;
          flex: 1;
          min-width: 300px;
        }
        .button-group {
          display: flex;
          gap: 10px;
        }

        /* Inputs & Buttons */
        .hex-select, .hex-input {
          background: #000;
          color: #ff0000;
          border: 1px solid #550000;
          padding: 10px;
          outline: none;
          flex: 1;
        }
        .hex-input { color: #fff; border-color: #ff0000; }
        
        .hex-button {
          background: #ff0000;
          color: #000;
          font-weight: bold;
          border: none;
          padding: 10px 25px;
          cursor: pointer;
          box-shadow: 0 0 15px #ff0000;
          transition: all 0.2s;
        }
        .hex-button.executing {
          background: #550000;
          color: #888;
          box-shadow: none;
          cursor: not-allowed;
        }
        .future-button {
          background: transparent;
          color: #666;
          border: 1px solid #333;
          padding: 10px;
          cursor: pointer;
        }
        .future-button:hover { border-color: #666; color: #888; }

        /* Tool Info Area */
        .tool-info {
          font-size: 0.75rem;
          color: #888;
          display: flex;
          align-items: center;
          gap: 10px;
          border-left: 1px solid #333;
          padding-left: 15px;
          max-width: 400px;
        }
        .tool-info a {
          color: #ff0000;
          text-decoration: none;
          white-space: nowrap;
        }
        .tool-info a:hover { text-decoration: underline; }

        /* Terminals */
        .terminal-main {
          display: flex;
          flex: 1;
          overflow: hidden;
          position: relative; /* For drawer positioning */
        }
        .terminal-column {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: #000;
        }
        .left-pane { border-right: 1px solid #220000; }
        .right-pane { background: #030000; }

        .pane-header {
          padding: 5px 15px;
          background: #110000;
          font-size: 0.7rem;
          letter-spacing: 2px;
          color: #ff0000;
          border-bottom: 1px solid #220000;
        }
        .ai-header { background: #1a0000; color: #ffaaaa; }

        .terminal-content {
          flex: 1;
          overflow-y: auto;
          padding: 15px;
          font-size: 0.85rem;
          white-space: pre-wrap;
          scroll-behavior: smooth;
        }
        .ai-content { color: #ffaaaa; line-height: 1.5; }
        
        .log-entry { margin-bottom: 8px; border-left: 2px solid #330000; padding-left: 10px; }

        /* Scrollbars */
        .terminal-content::-webkit-scrollbar { width: 6px; }
        .terminal-content::-webkit-scrollbar-track { background: #000; }
        .terminal-content::-webkit-scrollbar-thumb { background: #330000; border-radius: 3px; }

        /* Future Drawer */
        .future-drawer {
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: 300px;
          background: rgba(5, 0, 0, 0.95);
          border-left: 2px solid #ff0000;
          padding: 20px;
          z-index: 100;
          backdrop-filter: blur(10px);
          animation: slideIn 0.3s ease-out;
        }
        .future-drawer h3 { border-bottom: 1px solid #ff0000; padding-bottom: 10px; margin-top: 0; }
        .drawer-subtitle { color: #555; font-size: 0.8rem; margin-bottom: 20px; }
        
        .feature-item { margin-bottom: 25px; opacity: 0.7; }
        .feature-name { color: #ff0000; font-weight: bold; margin-bottom: 5px; }
        .feature-desc { color: #666; font-size: 0.75rem; }

        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }

        /* Mobile Responsiveness */
        @media (max-width: 768px) {
          .terminal-main { flex-direction: column; }
          .control-bar { flex-direction: column; align-items: stretch; }
          .tool-info { display: none; } /* Hide detailed info on mobile to save space */
          .future-drawer { width: 100%; top: 0; }
          .left-pane { border-right: none; border-bottom: 1px solid #220000; height: 50%; }
        }
      `}</style>
    </div>
  );
};

export default TerminalPage;