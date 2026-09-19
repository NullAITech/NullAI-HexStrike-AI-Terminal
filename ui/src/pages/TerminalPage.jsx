import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toolRegistry from '../data/tools.json';
import playbookRegistry from '../data/playbooks.json';

const TerminalPage = () => {
  const [target, setTarget] = useState('');
  const [selectedToolId, setSelectedToolId] = useState(toolRegistry[0].id);
  const [toolLogs, setToolLogs] = useState(["[SYSTEM] HexStrike Kernel Loaded..."]);
  const [aiLogs, setAiLogs] = useState(["[SYSTEM] Neural Intelligence Offline. Awaiting Vector..."]);
  const [executing, setExecuting] = useState(false);
  const [activeCategory, setActiveCategory] = useState(toolRegistry[0].category);
  const [history, setHistory] = useState([]);
  const [isCmdPaletteOpen, setIsCmdPaletteOpen] = useState(false);
  const [cmdInput, setCmdInput] = useState('');
  const [targetIntel, setTargetIntel] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [compromiseLevel, setCompromiseLevel] = useState(0);
  const [autopilotActive, setAutopilotActive] = useState(false);
  const [cmdHistory, setCmdHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [toasts, setToasts] = useState([]);
  const [fullscreen, setFullscreen] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [matrixRain, setMatrixRain] = useState(true);
  const [scanlineActive, setScanlineActive] = useState(true);
  const [glitchActive, setGlitchActive] = useState(true);
  const [targetReachable, setTargetReachable] = useState(null);
  const [sessions, setSessions] = useState({});
  const [sessionName, setSessionName] = useState('');
  const [exportFormat, setExportFormat] = useState('md');
  const [logFilter, setLogFilter] = useState({system: true, ai: true, error: true, tool: true});
  const [scanProgress, setScanProgress] = useState(0);
  const [theme, setTheme] = useState('void-red');
  const [stealthMode, setStealthMode] = useState(false);
  const [waveformBars, setWaveformBars] = useState(8);
  const [topologyPorts, setTopologyPorts] = useState([]);
  const [activeView, setActiveView] = useState('terminal');
  const [analytics, setAnalytics] = useState(null);
  // AI Attack Chain
  const [attackChain, setAttackChain] = useState({ recon: false, exploit: false, postExploit: false, exfil: false });
  const [chainActive, setChainActive] = useState(false);
  // Threat Intel
  const [threatIntel, setThreatIntel] = useState(null);
  const [threatLoading, setThreatLoading] = useState(false);
  // Command Templates
  const [templates, setTemplates] = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateCmd, setNewTemplateCmd] = useState('');
  // Target Fingerprinting
  const [fingerprint, setFingerprint] = useState(null);
  const [fingerprintLoading, setFingerprintLoading] = useState(false);
  // UI accessibility
  const [focusVisible, setFocusVisible] = useState(false);

  const toolRef = useRef(null);
  const aiRef = useRef(null);
  const streamRef = useRef(null);

  const currentTool = toolRegistry.find(t => t.id === selectedToolId) || toolRegistry[0];

  useEffect(() => {
    toolRef.current?.scrollIntoView({ behavior: "smooth" });
    aiRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [toolLogs, aiLogs]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        setIsCmdPaletteOpen(prev => !prev);
      }
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        toggleFullscreen();
      }
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        if (sessionName && target) saveSession();
        else addToast('Enter a session name first', 'error');
      }
    };
    const handleFocus = () => setFocusVisible(true);
    const handleBlur = () => setFocusVisible(false);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('focusin', handleFocus);
    window.addEventListener('focusout', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('focusin', handleFocus);
      window.removeEventListener('focusout', handleBlur);
    };
  }, [sessionName, target]);

  useEffect(() => {
    if (activeView === 'dashboard') {
      axios.get('http://localhost:8000/api/analytics')
        .then(res => setAnalytics(res.data))
        .catch(() => setAnalytics(null));
    }
  }, [activeView]);

  useEffect(() => {
    if (targetIntel && targetIntel.ports) {
      setTopologyPorts(targetIntel.ports.filter(p => p.status === 'open' || p.state === 'open'));
    } else {
      setTopologyPorts([]);
    }
  }, [targetIntel]);

  // Waveform activity: pulse bars when logs change
  useEffect(() => {
    if (toolLogs.length > 0 || aiLogs.length > 0) {
      setWaveformBars(prev => prev + 1);
      const id = setTimeout(() => setWaveformBars(0), 600);
      return () => clearTimeout(id);
    }
  }, [toolLogs.length, aiLogs.length]);

  // AI Attack Chain: update stages based on compromise level
  useEffect(() => {
    if (compromiseLevel >= 50) {
      setChainActive(true);
      setAttackChain(prev => ({
        ...prev,
        recon: true,
        exploit: compromiseLevel >= 60,
        postExploit: compromiseLevel >= 80,
        exfil: compromiseLevel >= 95
      }));
    } else if (compromiseLevel >= 25) {
      setAttackChain(prev => ({ ...prev, recon: true, exploit: false, postExploit: false, exfil: false }));
    } else {
      setAttackChain({ recon: false, exploit: false, postExploit: false, exfil: false });
      setChainActive(false);
    }
  }, [compromiseLevel]);

  // Threat Intel: fetch from public API
  useEffect(() => {
    if (!target) return;
    let ignore = false;
    const fetchThreat = async () => {
      setThreatLoading(true);
      try {
        // Try ip-api.com for geolocation + proxy/VPN detection
        const res = await axios.get(`http://ip-api.com/json/${target}?fields=status,country,city,isp,org,as,proxy,hosting,query`);
        if (res.data.status === 'success' && !ignore) {
          const d = res.data;
          const riskScore = (d.proxy ? 30 : 0) + (d.hosting ? 20 : 0) + 10;
          setThreatIntel({
            country: d.country, city: d.city, isp: d.isp, org: d.org, as: d.as,
            proxy: d.proxy, hosting: d.hosting, query: d.query,
            riskScore: Math.min(100, riskScore),
            openPorts: targetIntel?.ports?.filter(p => p.status === 'open' || p.state === 'open') || [],
            vulnerabilities: []
          });
        }
      } catch {}
      // Try Shodan for additional intel (requires API key in env)
      try {
        const shodanKey = process.env.REACT_APP_SHODAN_KEY || '';
        if (shodanKey) {
          const shodanRes = await axios.get(`https://api.shodan.io/shodan/host/${target}?key=${shodanKey}`);
          if (shodanRes.data && !ignore) {
            setThreatIntel(prev => prev ? { ...prev, vulnerabilities: shodanRes.data.vulns || [] } : null);
          }
        }
      } catch {}
      setThreatLoading(false);
    };
    fetchThreat();
    return () => { ignore = true; };
  }, [target]);

  // Fingerprint target from HTTP headers
  useEffect(() => {
    if (!target) return;
    let ignore = false;
    const fpTarget = async () => {
      setFingerprintLoading(true);
      try {
        const res = await axios.get(`http://localhost:8000/api/fingerprint?host=${target}`);
        if (!ignore && res.data) {
          const headers = res.data.headers || {};
          const server = (headers.server || '').toLowerCase();
          const xPowered = (headers['x-powered-by'] || '').toLowerCase();
          const tech = [];
          if (server.includes('wordpress')) tech.push('WordPress');
          if (server.includes('apache')) tech.push('Apache');
          if (server.includes('nginx')) tech.push('nginx');
          if (server.includes('iis')) tech.push('IIS');
          if (server.includes('tomcat')) tech.push('Tomcat');
          if (server.includes('node')) tech.push('Node.js');
          if (xPowered.includes('php')) tech.push('PHP');
          if (xPowered.includes('asp')) tech.push('ASP.NET');
          if (headers['x-frame-options']) tech.push('Frame-Protected');
          if (headers['x-xss-protection']) tech.push('XSS-Protected');
          if (headers['strict-transport-security']) tech.push('HSTS');
          if (headers['content-security-policy']) tech.push('CSP');
          setFingerprint({ server: headers.server || 'Unknown', tech, raw: headers });
        }
      } catch {}
      setFingerprintLoading(false);
    };
    fpTarget();
    return () => { ignore = true; };
  }, [target]);

  // Load saved templates from backend
  useEffect(() => {
    axios.get('http://localhost:8000/api/templates')
      .then(res => setTemplates(res.data.templates || []))
      .catch(() => setTemplates([]));
  }, []);

  useEffect(() => {
    if (target) {
      axios.get(`http://localhost:8000/target-intel?target=${target}`)
        .then(res => setTargetIntel(res.data))
        .catch(() => setTargetIntel(null));
      axios.get(`http://localhost:8000/api/ping?host=${target}`)
        .then(res => setTargetReachable(res.data.reachable))
        .catch(() => setTargetReachable(null));
      axios.get(`http://localhost:8000/api/session/list`)
        .then(res => setSessions(res.data.sessions || {}))
        .catch(() => {});
    }
  }, [target]);

const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  const executeStrike = async (toolOrPlaybookId = null) => {
    const toolId = toolOrPlaybookId || selectedToolId;
    if (!target || executing) return;
    setExecuting(true);
    setScanProgress(0);
    
    const timestamp = new Date().toLocaleTimeString();
    setToolLogs(prev => [...prev, `\n[${timestamp}] > ESTABLISHING STREAM FOR ${toolId.toUpperCase()} ON ${target}...`]);
    setAiLogs(prev => [...prev, `\n[${timestamp}] > NEURAL CORE SYNCING...`]);

    // Scan progress animation
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress = Math.min(100, progress + Math.random() * 15 + 5);
      setScanProgress(Math.floor(progress));
    }, 400);

    try {
      const playbook = playbookRegistry.find(p => p.id === toolId);
      const payload = playbook ? playbook.tools : toolId;

      const eventSource = new EventSource(`http://localhost:8000/execute-stream?tool=${payload}&target=${target}`);
      streamRef.current = eventSource;
      
      eventSource.onmessage = (event) => {
        const rawData = event.data.replace(/\\n/g, '\n').replace(/\\n/g, '\n');
        const lines = rawData.split('\n').filter(line => line.trim() !== '');
        
        lines.forEach(line => {
          applyCompromise(line);
          if (line.startsWith('SYSTEM:') || line.startsWith('ENGINE:') || line.startsWith('ERROR:')) {
            setToolLogs(prev => [...prev, line]);
          } else if (line.startsWith('AI_ANALYSIS:')) {
            const aiText = line.replace('AI_ANALYSIS: ', '');
            setAiLogs(prev => [...prev, aiText]);
            addToast('Neural Intelligence: Analysis Complete', 'ai');
            clearInterval(progressInterval);
            setScanProgress(100);
            eventSource.close();
            setExecuting(false);
            setHistory(prev => [{
              timestamp,
              target,
              tool: playbook ? playbook.name : toolId,
              status: 'SUCCESS'
            }, ...prev].slice(0, 10));
          } else {
            setToolLogs(prev => [...prev, line]);
          }
        });
      };

      eventSource.onerror = (err) => {
        setToolLogs(prev => [...prev, '[ERROR] Stream disconnected.']);
        eventSource.close();
        setExecuting(false);
        addToast('Stream disconnected', 'error');
      };

    } catch (err) {
      setToolLogs(prev => [...prev, `[ERROR] Strike Failed: ${err.message}`]);
      setAiLogs(prev => [...prev, '[ERROR] Connection lost to Neural Core.']);
      setExecuting(false);
      addToast('Strike Failed', 'error');
    }
  };

  const exportReport = async () => {
    if (!target) return;
    try {
      if (exportFormat === 'json') {
        const res = await axios.get(`http://localhost:8000/api/export-json?target=${target}`);
        const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `HexStrike_${target}.json`; a.click();
        addToast('JSON Report Exported', 'success');
      } else if (exportFormat === 'csv') {
        const res = await axios.get(`http://localhost:8000/api/export-csv?target=${target}`);
        const blob = new Blob([res.data.csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `HexStrike_${target}.csv`; a.click();
        addToast('CSV Report Exported', 'success');
      } else {
        const res = await axios.get(`http://localhost:8000/export-report?target=${target}`);
        const blob = new Blob([res.data.report], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `HexStrike_Report_${target}.md`; a.click();
        addToast('Markdown Report Exported', 'success');
      }
    } catch (err) {
      alert("Failed to export report.");
      addToast('Export Failed', 'error');
    }
  };

  const saveSession = async () => {
    if (!sessionName || !target) return;
    try {
      await axios.get(`http://localhost:8000/api/session/save?name=${sessionName}&target=${target}`);
      addToast(`Session "${sessionName}" saved`, 'success');
      setSessionName('');
    } catch { addToast('Save Failed', 'error'); }
  };

  const loadSession = async (name) => {
    try {
      const res = await axios.get(`http://localhost:8000/api/session/load?name=${name}`);
      if (res.data.target) { setTarget(res.data.target); addToast(`Loaded "${name}"`, 'info'); }
    } catch { addToast('Load Failed', 'error'); }
  };

  const handleCmdSubmit = (e) => {
    e.preventDefault();
    if (cmdInput && target) {
      setCmdHistory(prev => [...prev, cmdInput]);
      setHistoryIndex(-1);
      executeStrike(cmdInput);
      setCmdInput('');
      setIsCmdPaletteOpen(false);
    }
  };

  const handleCmdKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHistoryIndex(prev => {
        const newIndex = prev < cmdHistory.length - 1 ? prev + 1 : prev;
        setCmdInput(cmdHistory[cmdHistory.length - 1 - newIndex] || '');
        return newIndex;
      });
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHistoryIndex(prev => {
        const newIndex = prev > 0 ? prev - 1 : -1;
        setCmdInput(cmdHistory[cmdHistory.length - 1 - newIndex] || '');
        return newIndex;
      });
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  const applyCompromise = (output) => {
    if (autopilotActive) {
      const indicators = ['vulnerable', 'exploitable', 'access granted', 'compromised', 'credential', 'admin', 'root', 'success'];
      if (indicators.some(ind => output.toLowerCase().includes(ind))) {
        setCompromiseLevel(prev => {
          const next = Math.min(100, prev + 15);
          if (next >= 80) {
            setTimeout(() => {
              const nextTool = playbookRegistry.find(p => p.id === 'credBlast') || toolRegistry[0];
              executeStrike(nextTool.id);
            }, 2000);
          }
          return next;
        });
      }
    } else {
      const indicators = ['vulnerable', 'exploitable', 'access granted', 'compromised', 'credential', 'admin', 'root'];
      if (indicators.some(ind => output.toLowerCase().includes(ind))) {
        setCompromiseLevel(prev => Math.min(100, prev + 15));
      }
    }
  };

  // Template CRUD
  const saveTemplate = async () => {
    if (!newTemplateName || !newTemplateCmd) return;
    try {
      await axios.post('http://localhost:8000/api/templates', { name: newTemplateName, command: newTemplateCmd });
      setTemplates(prev => [...prev, { name: newTemplateName, command: newTemplateCmd }]);
      setNewTemplateName('');
      setNewTemplateCmd('');
      addToast('Template saved', 'success');
    } catch { addToast('Save failed', 'error'); }
  };

  const deleteTemplate = async (name) => {
    try {
      await axios.delete(`http://localhost:8000/api/templates?name=${encodeURIComponent(name)}`);
      setTemplates(prev => prev.filter(t => t.name !== name));
      addToast('Template deleted', 'info');
    } catch { addToast('Delete failed', 'error'); }
  };

  const insertTemplate = (cmd) => {
    setCmdInput(cmd);
    setShowTemplates(false);
  };

  // Attack Chain component
  const AttackChain = () => {
    const stages = [
      { key: 'recon', label: 'RECON', icon: '◉' },
      { key: 'exploit', label: 'EXPLOIT', icon: '◈' },
      { key: 'postExploit', label: 'POST-EXPLOIT', icon: '⬡' },
      { key: 'exfil', label: 'EXFIL', icon: '◎' }
    ];
    return (
      <div className="attack-chain">
        {stages.map((stage, i) => {
          const active = attackChain[stage.key];
          const isLast = i === stages.length - 1;
          return (
            <React.Fragment key={stage.key}>
              {i > 0 && <div className={`chain-connector ${attackChain[stages[i-1].key] ? 'active' : ''}`} />}
              <div className={`chain-node ${active ? 'active' : ''} ${compromiseLevel >= 50 ? 'glow' : ''}`} title={`${stage.label}: ${active ? 'COMPLETE' : 'PENDING'}`}>
                <span className="chain-icon">{active ? '◆' : stage.icon}</span>
                <span className="chain-label">{stage.label}</span>
              </div>
            </React.Fragment>
          );
        })}
        <div className="chain-progress">
          <div className="chain-progress-bar" style={{width: `${compromiseLevel}%`}} />
        </div>
      </div>
    );
  };

  // Threat Intel component
  const ThreatIntelPanel = () => {
    if (threatLoading) return <div className="threat-panel"><div className="threat-loading">LOADING INTEL...</div></div>;
    if (!threatIntel) return <div className="threat-panel"><div className="empty-state">No threat data</div></div>;
    return (
      <div className="threat-panel">
        <div className="threat-header">THREAT INTEL</div>
        <div className="threat-body">
          <div className="threat-row"><span className="threat-key">IP:</span><span className="threat-val">{threatIntel.query}</span></div>
          <div className="threat-row"><span className="threat-key">Country:</span><span className="threat-val">{threatIntel.country || '—'}</span></div>
          <div className="threat-row"><span className="threat-key">City:</span><span className="threat-val">{threatIntel.city || '—'}</span></div>
          <div className="threat-row"><span className="threat-key">ISP:</span><span className="threat-val">{threatIntel.isp || '—'}</span></div>
          <div className="threat-row"><span className="threat-key">ORG:</span><span className="threat-val">{threatIntel.org || '—'}</span></div>
          <div className="threat-row">
            <span className="threat-key">Risk:</span>
            <span className="threat-val" style={{color: threatIntel.riskScore > 50 ? '#ff0000' : threatIntel.riskScore > 25 ? '#fbbf24' : '#00ff41'}}>
              {threatIntel.riskScore}/100
            </span>
          </div>
          {threatIntel.proxy && <div className="threat-row"><span className="threat-key">Proxy:</span><span className="threat-val" style={{color:'#ff0000'}}>DETECTED</span></div>}
          {threatIntel.hosting && <div className="threat-row"><span className="threat-key">Hosting:</span><span className="threat-val" style={{color:'#fbbf24'}}>YES</span></div>}
          {threatIntel.openPorts.length > 0 && (
            <div className="threat-row">
              <span className="threat-key">Ports:</span>
              <span className="threat-val">{threatIntel.openPorts.map(p => p.port).join(', ')}</span>
            </div>
          )}
          {threatIntel.vulnerabilities.length > 0 && (
            <div className="threat-row">
              <span className="threat-key">CVEs:</span>
              <span className="threat-val" style={{color:'#ff0000'}}>{threatIntel.vulnerabilities.join(', ')}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Fingerprint component
  const FingerprintPanel = () => {
    if (fingerprintLoading) return <div className="fp-panel"><span style={{color:'#fbbf24',fontSize:'0.6rem'}}>FINGERPRINTING...</span></div>;
    if (!fingerprint) return null;
    return (
      <div className="fp-panel">
        <span className="fp-label">SERVER:</span>
        <span className="fp-val">{fingerprint.server}</span>
        <div className="fp-tags">
          {fingerprint.tech.map((t, i) => (
            <span key={i} className="fp-tag">{t}</span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`hex-studio ${stealthMode ? 'stealth-mode' : ''}`}>
      {matrixRain && <CanvasRain />}
      {scanlineActive && <div className="crt-overlay" />}
      <div className="crt-flicker" />

      <aside className="hex-sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo">◈</div>
          <div className="brand-text">NULLAI SECURITY</div>
          <div className="brand-sub">STUDIO</div>
        </div>
        
        <nav className="category-nav">
          <div className="cat-group">
            <div 
              className={`cat-label ${activeView === 'dashboard' ? 'active' : ''}`}
              onClick={() => { setActiveView('dashboard'); setActiveCategory('playbooks'); }}
            >
              Dashboard
            </div>
          </div>
          <div className="cat-group">
            <div 
              className={`cat-label ${activeCategory === 'playbooks' ? 'active' : ''}`}
              onClick={() => { setActiveView('terminal'); setActiveCategory('playbooks'); }}
            >
              Sovereign Playbooks
            </div>
            <div className={`tool-list ${activeCategory === 'playbooks' ? 'open' : ''}`}>
              {playbookRegistry.map(p => (
                <button 
                  key={p.id} 
                  className={`tool-btn ${selectedToolId === p.id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedToolId(p.id);
                    setActiveCategory('playbooks');
                  }}
                >
                  <span className="tool-id">{p.id}</span> {p.name}
                </button>
              ))}
            </div>
          </div>

          {[...new Set(toolRegistry.map(t => t.category))].map(cat => (
            <div key={cat} className="cat-group">
              <div 
                className={`cat-label ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </div>
              <div className={`tool-list ${activeCategory === cat ? 'open' : ''}`}>
                {toolRegistry.filter(t => t.category === cat).map(t => (
                  <button 
                    key={t.id} 
                    className={`tool-btn ${selectedToolId === t.id ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedToolId(t.id);
                      setActiveCategory(cat);
                    }}
                  >
                    <span className="tool-id">{t.id}</span> {t.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="status-indicator">
            <span className="dot"></span> KERNEL: STABLE
          </div>
          <button 
            className="settings-toggle" 
            onClick={() => setShowSettings(!showSettings)}
          >
            CONFIG_SESS
          </button>
        </div>
      </aside>

      <main className="hex-workspace">
        <header className="workspace-header">
          <div className="target-bar">
            <button 
              className="settings-toggle mobile-menu-btn" 
              onClick={() => document.querySelector('.hex-sidebar')?.classList.toggle('open')}
              aria-label="Toggle navigation menu"
            >☰</button>
            <span className="label">TARGET_VECTOR:</span>
            <input 
              type="text" 
              placeholder="Enter IP or Domain..." 
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="target-input"
              aria-label="Target vector input"
              role="textbox"
            />
            {targetReachable === true && <span className="reach-badge" style={{color:'#00ff41',textShadow:'0 0 5px #00ff41'}}>● REACHABLE</span>}
            {targetReachable === false && <span className="reach-badge" style={{color:'#ff0000',textShadow:'0 0 5px #ff0000'}}>● UNREACHABLE</span>}
            <button onClick={() => executeStrike('portscan')} disabled={executing} className="settings-toggle" style={{fontSize:'0.55rem',padding:'4px 8px'}}>PORTSCAN</button>
            <div className="action-group" style={{display: 'flex', gap: '10px'}}>
              <button onClick={exportReport} className="report-btn">EXPORT ({exportFormat.toUpperCase()})</button>
              <select className="settings-toggle" value={exportFormat} onChange={(e) => setExportFormat(e.target.value)} style={{fontSize:'0.55rem',padding:'2px 4px'}}>
                <option value="md">Markdown</option>
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
              </select>
              <button onClick={() => executeStrike('autopilot')} disabled={executing} className="strike-btn autopilot-btn">
                {executing ? 'STRIKING...' : 'AUTOPILOT STRIKE'}
              </button>
              <button onClick={toggleFullscreen} className="settings-toggle">
                {fullscreen ? 'EXIT_FULL' : 'FULLSCREEN'}
              </button>
              <button onClick={() => setShowTemplates(true)} className="settings-toggle">
                TEMPLATES
              </button>
            </div>
          </div>
          <div className="header-metrics">
            <div className="metric">TOOL: <span className="highlight">{currentTool.name}</span></div>
            <div className="metric">SENSITIVITY: <span className="highlight">HIGH</span></div>
            <div className="metric">COMPROMISE: <span className="highlight" style={{ color: compromiseLevel > 70 ? '#ff0000' : compromiseLevel > 40 ? '#fbbf24' : '#00ff00' }}>{compromiseLevel}%</span></div>
            <div className="metric">FONT: <span className="highlight">{fontSize}px</span></div>
            <div className="metric">SCAN: <span className="highlight" style={{color: scanProgress >= 100 ? '#00ff41' : '#fbbf24'}}>{scanProgress}%</span></div>
            <div className="metric">WAVEFORM:
              <span style={{display:'inline-flex',gap:'2px',alignItems:'flex-end',marginLeft:'4px',height:'16px'}}>
                {Array.from({length:8}).map((_,i) => (
                  <span key={i} style={{
                    display:'inline-block',width:'3px',
                    height: `${stealthMode ? 4 : Math.max(2, Math.abs(Math.sin((waveformBars + i) * 0.8)) * 14)}px`,
                    backgroundColor: stealthMode ? '#333' : '#00ff41',
                    boxShadow: stealthMode ? 'none' : '0 0 4px #00ff41',
                    transition: 'height 0.1s, background 0.3s',
                    borderRadius: '1px'
                  }} />
                ))}
              </span>
            </div>
            <div className="metric">TOPOLOGY:
              <span style={{display:'inline-flex',gap:'3px',alignItems:'center',marginLeft:'4px'}}>
                {topologyPorts.length > 0 ? topologyPorts.slice(0,12).map((p,i) => (
                  <span key={i} style={{
                    display:'inline-block',width:'6px',height:'6px',borderRadius:'50%',
                    backgroundColor: stealthMode ? '#333' : '#00ff41',
                    boxShadow: stealthMode ? 'none' : `0 0 6px ${p.port === 443 || p.port === 8443 ? '#bc13fe' : p.port === 22 ? '#00ff41' : '#fbbf24'}`,
                    animation: stealthMode ? 'none' : `topoPulse 1.5s infinite ${i * 0.15}s`
                  }} title={`Port ${p.port}`} />
                )) : <span style={{color:'#666',fontSize:'0.6rem'}}>—</span>}
              </span>
            </div>
          </div>
        </header>

        {/* AI Attack Chain Visualization */}
        {chainActive && <AttackChain />}

        {/* Fingerprint display */}
        <FingerprintPanel />

        {activeView === 'dashboard' ? (
          <div className="dashboard-view" style={{padding:'20px',color:'#00ff41',fontFamily:'Courier New,monospace'}}>
            <h2 style={{color:'#ff0040',textShadow:'0 0 10px #ff0040',marginBottom:'20px'}}>&#9666; ANALYTICS DASHBOARD</h2>
            {!analytics ? (
              <div style={{color:'#888',textAlign:'center',padding:'40px'}}>Loading analytics...</div>
            ) : (
              <>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:'12px',marginBottom:'24px'}}>
                  <div className="dash-card" style={{background:'#111',border:'1px solid #333',padding:'14px',borderRadius:'4px'}}>
                    <div style={{fontSize:'0.6rem',color:'#888',textTransform:'uppercase'}}>Total Strikes</div>
                    <div style={{fontSize:'2rem',color:'#ff0040'}}>{analytics.total_strikes}</div>
                  </div>
                  <div className="dash-card" style={{background:'#111',border:'1px solid #333',padding:'14px',borderRadius:'4px'}}>
                    <div style={{fontSize:'0.6rem',color:'#888',textTransform:'uppercase'}}>Tools Used</div>
                    <div style={{fontSize:'2rem',color:'#00ffff'}}>{analytics.unique_tools}</div>
                  </div>
                  <div className="dash-card" style={{background:'#111',border:'1px solid #333',padding:'14px',borderRadius:'4px'}}>
                    <div style={{fontSize:'0.6rem',color:'#888',textTransform:'uppercase'}}>Targets</div>
                    <div style={{fontSize:'2rem',color:'#bc13fe'}}>{analytics.unique_targets}</div>
                  </div>
                  <div className="dash-card" style={{background:'#111',border:'1px solid #333',padding:'14px',borderRadius:'4px'}}>
                    <div style={{fontSize:'0.6rem',color:'#888',textTransform:'uppercase'}}>Avg Compromise</div>
                    <div style={{fontSize:'2rem',color:'#fbbf24'}}>{analytics.avg_compromise_time_seconds != null ? `${analytics.avg_compromise_time_seconds}s` : 'N/A'}</div>
                  </div>
                </div>

                <h3 style={{color:'#00ffff',margin:'16px 0 8px',borderBottom:'1px solid #333',paddingBottom:'4px'}}>Strike Count Over Time</h3>
                <div style={{display:'flex',gap:'2px',alignItems:'flex-end',height:'100px',marginBottom:'24px',background:'#0a0a0a',padding:'10px',borderRadius:'4px',border:'1px solid #222'}}>
                  {analytics.top_targets.map((t,i) => (
                    <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'4px'}}>
                      <div style={{
                        width:'100%',background:'linear-gradient(to top, #ff0040, #bc13fe)',
                        height:`${Math.max(4, (t.strikes / Math.max(1, ...analytics.top_targets.map(x => x.strikes))) * 70)}px`,
                        borderRadius:'2px 2px 0 0',minWidth:'8px'
                      }} />
                      <div style={{fontSize:'0.45rem',color:'#888',textAlign:'center',wordBreak:'break-all',maxWidth:'60px'}}>{t.target.substring(0,8)}</div>
                      <div style={{fontSize:'0.55rem',color:'#00ff41'}}>{t.strikes}</div>
                    </div>
                  ))}
                </div>

                <h3 style={{color:'#00ffff',margin:'16px 0 8px',borderBottom:'1px solid #333',paddingBottom:'4px'}}>Success Rate by Tool</h3>
                <div style={{marginBottom:'24px',background:'#0a0a0a',padding:'10px',borderRadius:'4px',border:'1px solid #222'}}>
                  {Object.entries(analytics.success_rate_by_tool).map(([tool, rate]) => (
                    <div key={tool} style={{display:'flex',alignItems:'center',gap:'8px',margin:'4px 0'}}>
                      <span style={{fontSize:'0.6rem',color:'#888',width:'100px',textAlign:'right'}}>{tool}</span>
                      <div style={{flex:1,background:'#111',borderRadius:'2px',height:'14px',overflow:'hidden'}}>
                        <div style={{
                          width:`${rate}%`,height:'100%',background: rate >= 70 ? '#00ff41' : rate >= 40 ? '#fbbf24' : '#ff0040',
                          borderRadius:'2px',transition:'width 0.3s'
                        }} />
                      </div>
                      <span style={{fontSize:'0.6rem',color:'#00ff41',width:'40px'}}>{rate}%</span>
                    </div>
                  ))}
                </div>

                <h3 style={{color:'#00ffff',margin:'16px 0 8px',borderBottom:'1px solid #333',paddingBottom:'4px'}}>Tool Usage</h3>
                <div style={{marginBottom:'24px',background:'#0a0a0a',padding:'10px',borderRadius:'4px',border:'1px solid #222'}}>
                  {analytics.top_targets.slice(0,10).map((t,i) => (
                    <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:'1px solid #111',fontSize:'0.7rem'}}>
                      <span style={{color:'#bc13fe'}}>{t.target}</span>
                      <span style={{color:'#00ffff'}}>{t.strikes} strikes</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="terminal-grid" style={{position:'relative',overflow:'hidden'}}>
          {executing && <div className="scan-sweep" />}
          <div className="terminal-pane">
            <div className="pane-head">
              <span>RAW_OUTPUT.LOG</span>
              <span className="pane-status">LIVE</span>
            </div>
            <div className="pane-body" style={{ fontSize: `${fontSize}px` }}>
              {toolLogs.filter(log => {
                if (log.startsWith('SYSTEM:') || log.startsWith('ENGINE:') || log.startsWith('ERROR:')) return logFilter.system;
                if (log.startsWith('AI_ANALYSIS:')) return logFilter.ai;
                return logFilter.tool;
              }).map((log, i) => <div key={i} className="log-line typewriter" style={{ animationDelay: `${i * 0.05}s` }}>{log}</div>)}
              <div ref={toolRef} />
            </div>
          </div>
          <div className="terminal-pane ai-pane">
            <div className="pane-head">
              <span>NEURAL_ANALYSIS.EXE</span>
              <span className="pane-status ai-status">ANALYZING</span>
            </div>
            <div className="pane-body" style={{ fontSize: `${fontSize}px` }}>
              {aiLogs.filter(log => logFilter.ai).map((log, i) => <div key={i} className="log-line ai-line typewriter" style={{ animationDelay: `${i * 0.05}s` }}>{log}</div>)}
              <div ref={aiRef} />
            </div>
          </div>
        </div>
        )}

        <div style={{padding:'8px',display:'flex',gap:'8px',borderTop:'1px solid var(--dark-red)',background:'#0a0a0a',alignItems:'center'}}>
          <span style={{fontSize:'0.55rem',color:'var(--text-dim)',fontFamily:'Orbitron',marginRight:'4px'}}>FILTER:</span>
          <button onClick={() => setLogFilter(f => ({...f, system: !f.system}))} className="settings-toggle" style={{fontSize:'0.5rem',padding:'2px 6px',borderColor: logFilter.system ? '#00ff41' : '#333',color: logFilter.system ? '#00ff41' : '#666'}}>SYS</button>
          <button onClick={() => setLogFilter(f => ({...f, ai: !f.ai}))} className="settings-toggle" style={{fontSize:'0.5rem',padding:'2px 6px',borderColor: logFilter.ai ? '#bc13fe' : '#333',color: logFilter.ai ? '#bc13fe' : '#666'}}>AI</button>
          <button onClick={() => setLogFilter(f => ({...f, error: !f.error}))} className="settings-toggle" style={{fontSize:'0.5rem',padding:'2px 6px',borderColor: logFilter.error ? '#ff0000' : '#333',color: logFilter.error ? '#ff0000' : '#666'}}>ERR</button>
          <button onClick={() => setLogFilter(f => ({...f, tool: !f.tool}))} className="settings-toggle" style={{fontSize:'0.5rem',padding:'2px 6px',borderColor: logFilter.tool ? '#fbbf24' : '#333',color: logFilter.tool ? '#fbbf24' : '#666'}}>TOOL</button>
          <span style={{marginLeft:'auto',fontSize:'0.55rem',color:'var(--text-dim)',fontFamily:'Orbitron'}}>PROGRESS: {scanProgress}%</span>
        </div>
      </main>

      <aside className="hex-intel">
        <button 
          className="settings-toggle mobile-menu-btn" 
          onClick={() => document.querySelector('.hex-intel')?.classList.toggle('open')}
          aria-label="Toggle intel panel"
          style={{position:'sticky',top:0,zIndex:10,background:'#080808'}}
        >☰ INTEL</button>
        <div className="intel-header">TARGET_INTEL</div>
        <div className="history-list">
          {!targetIntel && <div className="empty-state">No target selected.</div>}
          {targetIntel && targetIntel.history.length === 0 && <div className="empty-state">No history for this target.</div>}
          {targetIntel?.history.map((h, i) => (
            <div key={i} className="history-item">
              <div className="h-meta">{new Date(h.timestamp).toLocaleString()}</div>
              <div className="h-tool">{h.tool}</div>
              <div className="h-output" style={{fontSize: '0.65rem', opacity: 0.6, marginTop: '5px'}}>
                {h.output.substring(0, 100)}...
              </div>
            </div>
          ))}
        </div>
        {/* Threat Intel Panel */}
        <ThreatIntelPanel />
        <div style={{padding:'10px',borderTop:'1px solid var(--dark-red)'}}>
          <div style={{fontSize:'0.6rem',color:'var(--text-dim)',textTransform:'uppercase',marginBottom:'8px',fontFamily:'Orbitron'}}>SESSIONS</div>
          <div style={{display:'flex',gap:'5px',marginBottom:'8px'}}>
            <input className="target-input" placeholder="Session name..." value={sessionName} onChange={(e) => setSessionName(e.target.value)} style={{width:'100%',fontSize:'0.7rem',padding:'4px 8px'}} />
            <button onClick={saveSession} className="settings-toggle" style={{fontSize:'0.55rem',padding:'4px 8px'}}>SAVE</button>
          </div>
          {Object.keys(sessions).map((name, i) => (
            <div key={i} className="history-item" onClick={() => loadSession(name)} style={{cursor:'pointer',padding:'6px 8px',fontSize:'0.65rem'}}>
              <span style={{color:'var(--blood-red)'}}>{name}</span>
              <span style={{opacity:0.4,float:'right',fontSize:'0.55rem'}}>{sessions[name].target}</span>
            </div>
          ))}
        </div>
      </aside>

      {isCmdPaletteOpen && (
        <div className="cmd-palette" onClick={() => setIsCmdPaletteOpen(false)}>
          <form onSubmit={handleCmdSubmit}>
            <input 
              autoFocus
              className="palette-input"
              placeholder="Run raw shell command..."
              value={cmdInput}
              onChange={(e) => setCmdInput(e.target.value)}
            />
            <div className="palette-hint">Press Enter to execute</div>
          </form>
        </div>
      )}

      {showSettings && (
        <div className="settings-overlay" onClick={() => setShowSettings(false)}>
          <div className="settings-modal" onClick={e => e.stopPropagation()}>
            <div className="settings-header">KERNEL_CONFIG</div>
            <div className="settings-body">
              <div className="setting-item">
                <span className="s-label">AI_MODEL:</span>
                <span className="s-val">GPT-4-Sovereign</span>
              </div>
              <div className="setting-item">
                <span className="s-label">SENSITIVITY:</span>
                <input type="range" min="1" max="10" defaultValue="8" />
              </div>
              <div className="setting-item">
                <span className="s-label">CRT_FLICKER:</span>
                <input type="checkbox" defaultChecked />
              </div>
              <div className="setting-item">
                <span className="s-label">MATRIX_RAIN:</span>
                <input type="checkbox" checked={matrixRain} onChange={() => setMatrixRain(!matrixRain)} />
              </div>
              <div className="setting-item">
                <span className="s-label">SCANLINES:</span>
                <input type="checkbox" checked={scanlineActive} onChange={() => setScanlineActive(!scanlineActive)} />
              </div>
              <div className="setting-item">
                <span className="s-label">GLITCH:</span>
                <input type="checkbox" checked={glitchActive} onChange={() => setGlitchActive(!glitchActive)} />
              </div>
              <div className="setting-item">
                <span className="s-label">FONT_SIZE:</span>
                <input type="range" min="10" max="20" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} />
              </div>
              <div className="setting-item">
                <span className="s-label">STEALTH_MODE:</span>
                <input type="checkbox" checked={stealthMode} onChange={() => setStealthMode(!stealthMode)} />
              </div>
              <div className="setting-item">
                <span className="s-label">ANON_MODE:</span>
                <input type="checkbox" />
              </div>
            </div>
            <button className="save-btn" onClick={() => setShowSettings(false)}>SAVE_CONFIG</button>
          </div>
        </div>
      )}
      {/* Command Templates Dropdown */}
      {showTemplates && (
        <div className="templates-overlay" onClick={() => setShowTemplates(false)}>
          <div className="templates-modal" onClick={e => e.stopPropagation()}>
            <div className="templates-header">COMMAND_TEMPLATES</div>
            <div className="templates-body">
              {templates.length === 0 && <div className="empty-state">No templates saved.</div>}
              {templates.map((t, i) => (
                <div key={i} className="template-item">
                  <span className="template-name" onClick={() => insertTemplate(t.command)}>{t.name}</span>
                  <span className="template-cmd">{t.command}</span>
                  <button className="template-del" onClick={() => deleteTemplate(t.name)}>✕</button>
                </div>
              ))}
            </div>
            <div className="templates-footer">
              <input className="target-input" placeholder="Template name..." value={newTemplateName} onChange={(e) => setNewTemplateName(e.target.value)} style={{fontSize:'0.65rem',padding:'4px 8px',width:'40%'}} />
              <input className="target-input" placeholder="Command..." value={newTemplateCmd} onChange={(e) => setNewTemplateCmd(e.target.value)} style={{fontSize:'0.65rem',padding:'4px 8px',width:'40%'}} />
              <button onClick={saveTemplate} className="settings-toggle" style={{fontSize:'0.55rem',padding:'4px 8px'}}>SAVE</button>
            </div>
            <button className="save-btn" onClick={() => setShowTemplates(false)}>CLOSE</button>
          </div>
        </div>
      )}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
};

const CanvasRain = () => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*';
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const drops = Array(columns).fill(1);
    
    let animationId;
    
    const draw = () => {
      ctx.fillStyle = 'rgba(5, 5, 5, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#00ff41';
      ctx.font = `${fontSize}px monospace`;
      
      for (let i = 0; i < drops.length; i++) {
        const text = chars.charAt(Math.floor(Math.random() * chars.length));
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
      
      animationId = requestAnimationFrame(draw);
    };
    
    draw();
    
    return () => cancelAnimationFrame(animationId);
  }, []);
  
  return <canvas ref={canvasRef} className="matrix-rain" style={{ opacity: 0.15 }} />;
};

export default TerminalPage;