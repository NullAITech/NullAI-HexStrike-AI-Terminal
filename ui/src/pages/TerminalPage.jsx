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
  const [toolSearch, setToolSearch] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [showToolDetail, setShowToolDetail] = useState(false);
  // Batch execution
  const [batchSelected, setBatchSelected] = useState([]);
  const [batchMode, setBatchMode] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [batchCurrentTool, setBatchCurrentTool] = useState('');
  const [batchQueue, setBatchQueue] = useState([]);
  const [batchRunning, setBatchRunning] = useState(false);
  // Execution history log — timestamped record of all tool executions
  const [executionHistory, setExecutionHistory] = useState([]);
  const [execStartTime, setExecStartTime] = useState(null);
  // Tool chaining
  const [chainTools, setChainTools] = useState([]);
  const [chainInput, setChainInput] = useState('');
  const [chainRunning, setChainRunning] = useState(false);
  const [chainStep, setChainStep] = useState(0);
  const [chainResults, setChainResults] = useState([]);
  // Keyboard shortcut help modal
  const [showHelp, setShowHelp] = useState(false);
  // Visual effects
  const [crtFlicker, setCrtFlicker] = useState(true);
  const [density, setDensity] = useState('medium'); // low/medium/high for matrix rain
  // Auto-completion
  const [showAutoComplete, setShowAutoComplete] = useState(false);
  const [autoCompleteResults, setAutoCompleteResults] = useState([]);
  const [autoCompleteIndex, setAutoCompleteIndex] = useState(0);
  // Tool comparison
  const [showCompare, setShowCompare] = useState(false);
  const [compareToolA, setCompareToolA] = useState('');
  const [compareToolB, setCompareToolB] = useState('');
  // Terminal input history
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalHistory, setTerminalHistory] = useState([]);
  const [terminalHistoryIdx, setTerminalHistoryIdx] = useState(-1);
  // Custom playbooks
  const [customPlaybooks, setCustomPlaybooks] = useState([]);
  const [showPlaybookModal, setShowPlaybookModal] = useState(false);
  const [playbookForm, setPlaybookForm] = useState({ name: '', description: '', tools: [], tags: '' });
  // Advanced search/filter chips
  const [filterChips, setFilterChips] = useState({ difficulty: [], usefulness: [], tags: [] });
  const [showTagDropdown, setShowTagDropdown] = useState(false);

  // Load favorites from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('hexstrike-favorites');
      if (saved) setFavorites(JSON.parse(saved));
    } catch {}
    // Load custom playbooks from localStorage
    try {
      const savedPlaybooks = localStorage.getItem('hexstrike-playbooks');
      if (savedPlaybooks) setCustomPlaybooks(JSON.parse(savedPlaybooks));
    } catch {}
  }, []);

  const toggleFavorite = (toolId) => {
    setFavorites(prev => {
      const next = prev.includes(toolId) ? prev.filter(id => id !== toolId) : [...prev, toolId];
      try { localStorage.setItem('hexstrike-favorites', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const isFavorited = (toolId) => favorites.includes(toolId);

  // Star rating renderer
  const renderStars = (rating) => {
    const full = Math.floor(rating / 2);
    const half = rating % 2 >= 1;
    return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - (half ? 1 : 0));
  };

  // Filter chip toggles
  const toggleDifficulty = (d) => {
    setFilterChips(prev => ({
      ...prev,
      difficulty: prev.difficulty.includes(d) ? prev.difficulty.filter(x => x !== d) : [...prev.difficulty, d]
    }));
  };
  const toggleUsefulness = (u) => {
    setFilterChips(prev => ({
      ...prev,
      usefulness: prev.usefulness.includes(u) ? prev.usefulness.filter(x => x !== u) : [...prev.usefulness, u]
    }));
  };
  const toggleTag = (tag) => {
    setFilterChips(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter(x => x !== tag) : [...prev.tags, tag]
    }));
  };
  const clearFilters = () => setFilterChips({ difficulty: [], usefulness: [], tags: [] });

  // All available tags across tools
  const allTags = [...new Set(toolRegistry.flatMap(t => t.tags))].sort();

  // Filtered tools with search + chip filters
  const filteredTools = toolRegistry.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(toolSearch.toLowerCase()) ||
      t.id.toLowerCase().includes(toolSearch.toLowerCase()) ||
      t.tags.some(tag => tag.toLowerCase().includes(toolSearch.toLowerCase()));
    if (!matchesSearch) return false;
    if (filterChips.difficulty.length > 0 && !filterChips.difficulty.includes(t.difficulty)) return false;
    if (filterChips.usefulness.length > 0) {
      const min = Math.min(...filterChips.usefulness);
      if (t.usefulness < min) return false;
    }
    if (filterChips.tags.length > 0 && !filterChips.tags.some(tag => t.tags.includes(tag))) return false;
    return true;
  });

  // Favorited tools sorted first
  const favoritedTools = filteredTools.filter(t => favorites.includes(t.id));
  const nonFavoritedTools = filteredTools.filter(t => !favorites.includes(t.id));

  const handleToolClick = (toolId, category) => {
    if (batchMode) {
      setBatchSelected(prev =>
        prev.includes(toolId) ? prev.filter(id => id !== toolId) : [...prev, toolId]
      );
      return;
    }
    setSelectedToolId(toolId);
    setActiveCategory(category);
    setShowToolDetail(true);
  };

  // Command palette: tool search, recent commands, keyboard nav
  const [cmdResults, setCmdResults] = useState([]);
  const [cmdActiveIndex, setCmdActiveIndex] = useState(0);
  const [showRecentOnly, setShowRecentOnly] = useState(false);

  // Live output viewer
  const [liveOutput, setLiveOutput] = useState([]);
  const [showLiveOutput, setShowLiveOutput] = useState(false);

  const toolRef = useRef(null);
  const aiRef = useRef(null);
  const streamRef = useRef(null);
  const paletteInputRef = useRef(null);
  const liveOutputRef = useRef(null);

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
      if (e.ctrlKey && e.key === '/') {
        e.preventDefault();
        setShowHelp(prev => !prev);
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

  // Build palette results: search tools/playbooks, show recent commands when empty
  useEffect(() => {
    if (!isCmdPaletteOpen) return;
    const q = cmdInput.toLowerCase().trim();
    if (!q) {
      const recent = cmdHistory.slice(0, 8).map(c => ({ type: 'recent', label: c, id: c }));
      const tools = toolRegistry.map(t => ({ type: 'tool', label: `${t.id} — ${t.name}`, id: t.id }));
      const playbooks = playbookRegistry.map(p => ({ type: 'playbook', label: `${p.id} — ${p.name}`, id: p.id }));
      const custom = customPlaybooks.map(p => ({ type: 'playbook', label: `${p.id} — ${p.name}`, id: p.id }));
      setCmdResults([...recent, ...tools, ...playbooks, ...custom]);
      setShowRecentOnly(true);
    } else {
      const matched = [
        ...toolRegistry.filter(t => t.id.toLowerCase().includes(q) || t.name.toLowerCase().includes(q)).map(t => ({ type: 'tool', label: `${t.id} — ${t.name}`, id: t.id })),
        ...playbookRegistry.filter(p => p.id.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)).map(p => ({ type: 'playbook', label: `${p.id} — ${p.name}`, id: p.id })),
        ...customPlaybooks.filter(p => p.id.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)).map(p => ({ type: 'playbook', label: `${p.id} — ${p.name}`, id: p.id })),
        ...cmdHistory.filter(c => c.toLowerCase().includes(q)).slice(0, 5).map(c => ({ type: 'recent', label: c, id: c })),
      ];
      setCmdResults(matched);
      setShowRecentOnly(false);
    }
    setCmdActiveIndex(0);
  }, [cmdInput, isCmdPaletteOpen, cmdHistory]);

  // Scroll active result into view
  useEffect(() => {
    if (!isCmdPaletteOpen) return;
    const list = document.querySelector('.palette-results');
    const active = list?.querySelector('.palette-item-active');
    active?.scrollIntoView({ block: 'nearest' });
  }, [cmdActiveIndex, isCmdPaletteOpen]);

  // Auto-completion: filter tools by partial name/id match
  useEffect(() => {
    if (!isCmdPaletteOpen || !cmdInput.trim()) {
      setShowAutoComplete(false);
      setAutoCompleteResults([]);
      return;
    }
    const q = cmdInput.toLowerCase().trim();
    const matches = toolRegistry.filter(t =>
      t.id.toLowerCase().startsWith(q) || t.name.toLowerCase().includes(q)
    ).slice(0, 8);
    setAutoCompleteResults(matches);
    setAutoCompleteIndex(0);
    setShowAutoComplete(matches.length > 0);
  }, [cmdInput, isCmdPaletteOpen]);
  useEffect(() => {
    if (!isCmdPaletteOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setIsCmdPaletteOpen(false);
        setCmdInput('');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isCmdPaletteOpen]);

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

const executeBatch = async () => {
    if (batchSelected.length === 0 || !target || batchRunning) return;
    setBatchRunning(true);
    setBatchProgress(0);
    const batchStartTime = Date.now();
    setExecStartTime(batchStartTime);
    setToolLogs(prev => [...prev, `\n[SYSTEM] > BATCH MODE: Running ${batchSelected.length} tools on ${target}...`]);
    setAiLogs(prev => [...prev, '\n[SYSTEM] > BATCH SEQUENCE INITIATED...']);
    setShowLiveOutput(true);

    const results = [];
    for (let i = 0; i < batchSelected.length; i++) {
      const toolId = batchSelected[i];
      const toolName = toolRegistry.find(t => t.id === toolId)?.name || toolId;
      setBatchCurrentTool(toolName);
      setBatchProgress(Math.floor(((i) / batchSelected.length) * 100));
      setToolLogs(prev => [...prev, `\n[BATCH] > [${i+1}/${batchSelected.length}] Starting ${toolName}...`]);
      setAiLogs(prev => [...prev, `[BATCH] Executing ${toolName} (${i+1}/${batchSelected.length})`]);

      try {
        const eventSource = new EventSource(`http://localhost:8000/execute-stream?tool=${toolId}&target=${target}`);
        let output = '';
        await new Promise((resolve, reject) => {
          eventSource.onmessage = (event) => {
            const rawData = event.data.replace(/\\n/g, '\n');
            const lines = rawData.split('\n').filter(line => line.trim() !== '');
            lines.forEach(line => {
              output += line + '\n';
              setToolLogs(prev => [...prev, line]);
              setLiveOutput(prev => [...prev, line]);
              if (line.startsWith('AI_ANALYSIS:')) {
                setAiLogs(prev => [...prev, line.replace('AI_ANALYSIS: ', '')]);
              }
            });
          };
          eventSource.onerror = () => { eventSource.close(); resolve(); };
          setTimeout(() => { eventSource.close(); resolve(); }, 30000);
        });
        results.push({ toolId, toolName, status: 'SUCCESS', output });
        setToolLogs(prev => [...prev, `[BATCH] ✓ ${toolName} complete`]);
      } catch (err) {
        results.push({ toolId, toolName, status: 'FAILED', error: err.message });
        setToolLogs(prev => [...prev, `[BATCH] ✗ ${toolName} failed: ${err.message}`]);
      }

      setBatchProgress(Math.floor(((i + 1) / batchSelected.length) * 100));
    }

    setBatchRunning(false);
    setBatchCurrentTool('');
    setScanProgress(100);
    addToast(`Batch complete: ${results.filter(r => r.status === 'SUCCESS').length}/${results.length} succeeded`, 'success');
    const batchDuration = execStartTime ? Date.now() - execStartTime : 0;
    setExecutionHistory(prev => [{
      id: Date.now(),
      timestamp: new Date().toLocaleString(),
      target,
      tool: 'BATCH',
      status: 'SUCCESS',
      duration: `${Math.round(batchDuration / 1000)}s`
    }, ...prev].slice(0, 50));
    setExecStartTime(null);
    setHistory(prev => [{ timestamp: new Date().toLocaleTimeString(), target, tool: 'BATCH', status: 'SUCCESS' }, ...prev].slice(0, 10));
  };

  const addToChain = (toolId) => {
    if (chainTools.includes(toolId)) {
      setChainTools(chainTools.filter(id => id !== toolId));
      setChainResults(chainResults.filter(r => r.toolId !== toolId));
    } else {
      setChainTools([...chainTools, toolId]);
    }
  };

  const removeFromChain = (index) => {
    setChainTools(chainTools.filter((_, i) => i !== index));
    setChainResults(chainResults.filter((_, i) => i !== index));
  };

  const clearChain = () => {
    setChainTools([]);
    setChainResults([]);
    setChainStep(0);
    setChainRunning(false);
  };

  const executeChain = async () => {
    if (chainTools.length === 0 || !target || chainRunning) return;
    setChainRunning(true);
    setChainStep(0);
    const chainStartTime = Date.now();
    setExecStartTime(chainStartTime);
    setToolLogs(prev => [...prev, `\n[CHAIN] > Starting attack chain: ${chainTools.map(id => toolRegistry.find(t=>t.id===id)?.name || id).join(' → ')}`]);
    setAiLogs(prev => [...prev, '\n[CHAIN] > Sequential exploitation pipeline initialized...']);
    setShowLiveOutput(true);

    const results = [];
    let chainInput = target;

    for (let i = 0; i < chainTools.length; i++) {
      const toolId = chainTools[i];
      const toolName = toolRegistry.find(t => t.id === toolId)?.name || toolId;
      setChainStep(i + 1);
      setBatchCurrentTool(`${toolName} (${i+1}/${chainTools.length})`);
      setToolLogs(prev => [...prev, `\n[CHAIN] > Step ${i+1}/${chainTools.length}>: ${toolName} on ${chainInput}`]);
      setAiLogs(prev => [...prev, `[CHAIN] Step ${i+1}: ${toolName} — input: ${chainInput}`]);

      try {
        const eventSource = new EventSource(`http://localhost:8000/execute-stream?tool=${toolId}&target=${encodeURIComponent(chainInput)}`);
        let output = '';
        await new Promise((resolve, reject) => {
          eventSource.onmessage = (event) => {
            const rawData = event.data.replace(/\\n/g, '\n');
            const lines = rawData.split('\n').filter(line => line.trim() !== '');
            lines.forEach(line => {
              output += line + '\n';
              setToolLogs(prev => [...prev, line]);
              setLiveOutput(prev => [...prev, line]);
              if (line.startsWith('AI_ANALYSIS:')) {
                setAiLogs(prev => [...prev, line.replace('AI_ANALYSIS: ', '')]);
              }
              if (line.match(/open\s+\d+/i)) {
                const portMatch = line.match(/open\s+(\d+)/i);
                if (portMatch) chainInput = `${chainInput}:${portMatch[1]}`;
              }
            });
          };
          eventSource.onerror = () => { eventSource.close(); resolve(); };
          setTimeout(() => { eventSource.close(); resolve(); }, 30000);
        });
        results.push({ toolId, toolName, status: 'SUCCESS', output });
        setChainResults([...results, { toolId, toolName, status: 'SUCCESS', output }]);
        setToolLogs(prev => [...prev, `[CHAIN] ✓ Step ${i+1}: ${toolName} complete`]);
      } catch (err) {
        results.push({ toolId, toolName, status: 'FAILED', error: err.message });
        setChainResults([...results, { toolId, toolName, status: 'FAILED', error: err.message }]);
        setToolLogs(prev => [...prev, `[CHAIN] ✗ Step ${i+1}: ${toolName} failed: ${err.message}`]);
        break;
      }
    }

    setChainRunning(false);
    setBatchCurrentTool('');
    setScanProgress(100);
    const successCount = results.filter(r => r.status === 'SUCCESS').length;
    addToast(`Chain complete: ${successCount}/${chainTools.length} steps succeeded`, successCount === chainTools.length ? 'success' : 'error');
    const chainDuration = execStartTime ? Date.now() - execStartTime : 0;
    setExecutionHistory(prev => [{
      id: Date.now(),
      timestamp: new Date().toLocaleString(),
      target,
      tool: 'CHAIN',
      status: successCount === chainTools.length ? 'SUCCESS' : 'PARTIAL',
      duration: `${Math.round(chainDuration / 1000)}s`
    }, ...prev].slice(0, 50));
    setExecStartTime(null);
  };

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
    setLiveOutput([]);
    setShowLiveOutput(true);

    const timestamp = new Date().toLocaleTimeString();
    const startTime = Date.now();
    setExecStartTime(startTime);
    const toolName = playbookRegistry.find(p => p.id === toolId)?.name || customPlaybooks.find(p => p.id === toolId)?.name || toolRegistry.find(t => t.id === toolId)?.name || toolId;
    addToast(`Strike started: ${toolName}`, 'info');
    setToolLogs(prev => [...prev, `\n[${timestamp}] > ESTABLISHING STREAM FOR ${toolId.toUpperCase()} ON ${target}...`]);
    setAiLogs(prev => [...prev, `\n[${timestamp}] > NEURAL CORE SYNCING...`]);
    setLiveOutput(prev => [...prev, `[${timestamp}] > ESTABLISHING STREAM FOR ${toolId.toUpperCase()} ON ${target}...`]);

    // Scan progress animation
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress = Math.min(100, progress + Math.random() * 15 + 5);
      setScanProgress(Math.floor(progress));
    }, 400);

    try {
      const playbook = playbookRegistry.find(p => p.id === toolId) || customPlaybooks.find(p => p.id === toolId);
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
            setLiveOutput(prev => [...prev, line]);
          } else if (line.startsWith('AI_ANALYSIS:')) {
            const aiText = line.replace('AI_ANALYSIS: ', '');
            setAiLogs(prev => [...prev, aiText]);
            setLiveOutput(prev => [...prev, `AI: ${aiText}`]);
            addToast('Neural Intelligence: Analysis Complete', 'ai');
            clearInterval(progressInterval);
            setScanProgress(100);
            eventSource.close();
            setExecuting(false);
            const duration = execStartTime ? Date.now() - execStartTime : 0;
            setExecutionHistory(prev => [{
              id: Date.now(),
              timestamp: new Date().toLocaleString(),
              target,
              tool: playbook ? playbook.name : toolId,
              status: 'SUCCESS',
              duration: `${Math.round(duration / 1000)}s`
            }, ...prev].slice(0, 50));
            setExecStartTime(null);
            setHistory(prev => [{
              timestamp,
              target,
              tool: playbook ? playbook.name : toolId,
              status: 'SUCCESS'
            }, ...prev].slice(0, 10));
            addToast(`Strike complete: ${toolName}`, 'success');
          } else {
            setToolLogs(prev => [...prev, line]);
            setLiveOutput(prev => [...prev, line]);
          }
        });
      };

      eventSource.onerror = (err) => {
        setToolLogs(prev => [...prev, '[ERROR] Stream disconnected.']);
        setLiveOutput(prev => [...prev, '[ERROR] Stream disconnected.']);
        eventSource.close();
        setExecuting(false);
        addToast('Stream disconnected', 'error');
      };

    } catch (err) {
      setToolLogs(prev => [...prev, `[ERROR] Strike Failed: ${err.message}`]);
      setLiveOutput(prev => [...prev, `[ERROR] Strike Failed: ${err.message}`]);
      setAiLogs(prev => [...prev, '[ERROR] Connection lost to Neural Core.']);
      setExecuting(false);
      addToast('Strike Failed', 'error');
    }
  };

  const exportPDF = () => {
    if (!target) return;
    const reportContent = toolLogs.join('\n');
    const aiContent = aiLogs.join('\n');
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) { addToast('Popup blocked — allow popups for PDF export', 'error'); return; }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>HexStrike Report — ${target}</title>
        <style>
          body { font-family: 'Courier New', monospace; font-size: 11px; color: #00ff41; background: #0a0a0a; padding: 20px; line-height: 1.5; }
          h1 { color: #ff0000; font-size: 18px; border-bottom: 1px solid #ff0000; padding-bottom: 8px; }
          h2 { color: #bc13fe; font-size: 14px; margin-top: 20px; }
          .meta { color: #fbbf24; font-size: 10px; margin-bottom: 15px; }
          .log-line { white-space: pre-wrap; word-break: break-all; margin-bottom: 2px; }
          .ai-line { color: #ffaaaa; border-left: 2px solid #ff0000; padding-left: 10px; margin-left: 10px; }
          .section { margin-bottom: 20px; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <h1>◆ HexStrike Report</h1>
        <div class="meta">Target: ${target} | Generated: ${new Date().toLocaleString()} | Status: ${executionHistory[0]?.status || 'IN_PROGRESS'}</div>
        <div class="section"><h2>■ RAW OUTPUT</h2>${reportContent.split('\n').map(l => `<div class="log-line">${l.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>`).join('')}</div>
        <div class="section"><h2>■ AI ANALYSIS</h2>${aiContent.split('\n').map(l => `<div class="log-line ai-line">${l.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>`).join('')}</div>
        <div class="section"><h2>■ EXECUTION HISTORY</h2>${executionHistory.map(h => `<div class="log-line">[${h.timestamp}] ${h.tool} on ${h.target} — ${h.status} (${h.duration})</div>`).join('')}</div>
      </body>
      </html>`);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 300);
    addToast('PDF report sent to printer — save as PDF from dialog', 'success');
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
      await axios.post('http://localhost:8000/api/session/save', {
        name: sessionName,
        target,
        tool_logs: toolLogs,
        ai_logs: aiLogs,
        settings: { fontSize, scanlineActive, glitchActive, matrixRain, stealthMode, theme },
        compromise_level: compromiseLevel,
        tool_history: history,
      });
      addToast(`Session "${sessionName}" saved`, 'success');
      setSessionName('');
      // Refresh session list
      axios.get('http://localhost:8000/api/session/list')
        .then(res => setSessions(res.data.sessions || {}))
        .catch(() => {});
    } catch { addToast('Save Failed', 'error'); }
  };

  const loadSession = async (name) => {
    try {
      const res = await axios.get(`http://localhost:8000/api/session/load?name=${name}`);
      const data = res.data;
      if (data.error) { addToast(data.error, 'error'); return; }
      if (data.target) setTarget(data.target);
      if (data.tool_logs) setToolLogs(data.tool_logs);
      if (data.ai_logs) setAiLogs(data.ai_logs);
      if (data.settings) {
        setFontSize(data.settings.fontSize || 14);
        setScanlineActive(data.settings.scanlineActive !== false);
        setGlitchActive(data.settings.glitchActive !== false);
        setMatrixRain(data.settings.matrixRain !== false);
        setStealthMode(data.settings.stealthMode || false);
        setTheme(data.settings.theme || 'void-red');
      }
      if (data.compromise_level !== undefined) setCompromiseLevel(data.compromise_level);
      if (data.tool_history) setHistory(data.tool_history);
      addToast(`Loaded "${name}"`, 'info');
    } catch { addToast('Load Failed', 'error'); }
  };

  const deleteSession = async (name) => {
    if (!window.confirm(`Delete session "${name}"?`)) return;
    try {
      await axios.delete(`http://localhost:8000/api/session/delete?name=${encodeURIComponent(name)}`);
      addToast(`Session "${name}" deleted`, 'info');
      axios.get('http://localhost:8000/api/session/list')
        .then(res => setSessions(res.data.sessions || {}))
        .catch(() => {});
    } catch { addToast('Delete Failed', 'error'); }
  };

  const handleCmdSubmit = (e) => {
    e.preventDefault();
    const selected = cmdResults[cmdActiveIndex];
    if (selected) {
      setCmdInput('');
      setIsCmdPaletteOpen(false);
      setCmdHistory(prev => {
        const next = [selected.id, ...prev.filter(c => c !== selected.id)];
        return next.slice(0, 20);
      });
      executeStrike(selected.id);
    } else if (cmdInput && target) {
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
      if (showRecentOnly && cmdInput === '') {
        setHistoryIndex(prev => {
          const newIndex = prev < cmdHistory.length - 1 ? prev + 1 : prev;
          setCmdInput(cmdHistory[cmdHistory.length - 1 - newIndex] || '');
          return newIndex;
        });
      } else {
        setCmdActiveIndex(prev => Math.max(0, prev - 1));
      }
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (showRecentOnly && cmdInput === '') {
        setHistoryIndex(prev => {
          const newIndex = prev > 0 ? prev - 1 : -1;
          setCmdInput(cmdHistory[cmdHistory.length - 1 - newIndex] || '');
          return newIndex;
        });
      } else {
        setCmdActiveIndex(prev => Math.min(cmdResults.length - 1, prev + 1));
      }
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCmdSubmit(e);
    }
    if (e.key === 'Tab' && autoCompleteResults.length > 0) {
      e.preventDefault();
      const next = (autoCompleteIndex + 1) % autoCompleteResults.length;
      setAutoCompleteIndex(next);
      setCmdInput(autoCompleteResults[next].id);
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

  const closeAllDrawers = () => {
    document.querySelector('.hex-sidebar')?.classList.remove('open');
    document.querySelector('.hex-intel')?.classList.remove('open');
    document.querySelector('.exec-history-panel')?.classList.remove('open');
  };

  const insertTemplate = (cmd) => {
    setCmdInput(cmd);
    setShowTemplates(false);
  };

  // Custom Playbook CRUD
  const saveCustomPlaybook = () => {
    if (!playbookForm.name || playbookForm.tools.length === 0) return;
    const pb = {
      id: 'pb-' + Date.now(),
      name: playbookForm.name,
      description: playbookForm.description,
      tools: [...playbookForm.tools],
      difficulty: 'intermediate',
      usefulness: 7,
      tags: playbookForm.tags.split(',').map(t => t.trim()).filter(Boolean),
      isCustom: true,
      category_order: 0
    };
    const next = [...customPlaybooks, pb];
    setCustomPlaybooks(next);
    try { localStorage.setItem('hexstrike-playbooks', JSON.stringify(next)); } catch {}
    setPlaybookForm({ name: '', description: '', tools: [], tags: '' });
    setShowPlaybookModal(false);
    addToast('Playbook saved', 'success');
  };
  const deleteCustomPlaybook = (id) => {
    const next = customPlaybooks.filter(p => p.id !== id);
    setCustomPlaybooks(next);
    try { localStorage.setItem('hexstrike-playbooks', JSON.stringify(next)); } catch {}
    addToast('Playbook deleted', 'info');
  };
  const toggleToolInForm = (toolId) => {
    setPlaybookForm(prev => ({
      ...prev,
      tools: prev.tools.includes(toolId) ? prev.tools.filter(id => id !== toolId) : [...prev.tools, toolId]
    }));
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
    <div className={`hex-studio ${stealthMode ? 'stealth-mode' : ''}`} data-theme={theme}>
      {matrixRain && <CanvasRain density={density} />}
      {scanlineActive && <div className="crt-overlay" />}
      <div className={`crt-flicker ${crtFlicker ? '' : 'crt-flicker-paused'}`} />

      <aside className="hex-sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo">◈</div>
          <div className="brand-text">NULLAI SECURITY</div>
          <div className="brand-sub">STUDIO</div>
        </div>
        
        {/* Search Bar */}
        <div className="tool-search">
          <input
            type="text"
            placeholder="Search tools..."
            value={toolSearch}
            onChange={(e) => setToolSearch(e.target.value)}
            className="tool-search-input"
            aria-label="Search tools"
          />
          {favorites.length > 0 && (
            <div className="favorites-count">★ {favorites.length}</div>
          )}
        </div>

        {/* Advanced Filter Chips */}
        <div className="filter-chips">
          <div className="filter-chips-header">
            <span>FILTERS</span>
            {(filterChips.difficulty.length + filterChips.usefulness.length + filterChips.tags.length) > 0 && (
              <button className="clear-filters" onClick={clearFilters}>CLEAR</button>
            )}
          </div>
          <div className="chip-group">
            <span className="chip-label">DIFFICULTY</span>
            {['beginner','intermediate','advanced'].map(d => (
              <button
                key={d}
                className={`chip ${filterChips.difficulty.includes(d) ? 'chip-active' : ''} chip-${d}`}
                onClick={() => toggleDifficulty(d)}
              >{d}</button>
            ))}
          </div>
          <div className="chip-group">
            <span className="chip-label">USEFULNESS</span>
            {[8,6,4].map(u => (
              <button
                key={u}
                className={`chip ${filterChips.usefulness.includes(u) ? 'chip-active' : ''}`}
                onClick={() => toggleUsefulness(u)}
              >&gt;={u}+</button>
            ))}
          </div>
          <div className="chip-group chip-group-tags">
            <span className="chip-label" onClick={() => setShowTagDropdown(!showTagDropdown)} style={{cursor:'pointer'}}>TAGS ▲</span>
            {showTagDropdown && (
              <div className="tag-dropdown">
                {allTags.map(tag => (
                  <label key={tag} className="tag-option">
                    <input type="checkbox" checked={filterChips.tags.includes(tag)} onChange={() => toggleTag(tag)} />
                    {tag}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Batch Selection Toggle */}
        {batchMode && (
          <div className="batch-toggle-sidebar">
            <div className="batch-toggle-sidebar-label">
              <input
                type="checkbox"
                className="batch-toggle-checkbox"
                checked={batchSelected.length === filteredTools.length && filteredTools.length > 0}
                onChange={(e) => {
                  if (e.target.checked) {
                    setBatchSelected(filteredTools.map(t => t.id));
                  } else {
                    setBatchSelected([]);
                  }
                }}
              />
              SELECT ALL ({batchSelected.length}/{filteredTools.length})
            </div>
          </div>
        )}

        <nav className="category-nav">
          {/* Favorites Section */}
          {favorites.length > 0 && (
            <div className="cat-group">
              <div className="cat-label active">★ Favorites</div>
              <div className="tool-list open">
                {favoritedTools.map(t => (
                  <button
                    key={t.id}
                    className={`tool-btn ${selectedToolId === t.id ? 'active' : ''} ${batchSelected.includes(t.id) ? 'batch-selected' : ''}`}
                    onClick={() => handleToolClick(t.id, t.category)}
                  >
                    <span className="tool-id">{t.id}</span> {t.name}
                    <span className="tool-stars" title={`Usefulness: ${t.usefulness}/10`}>{renderStars(t.usefulness)}</span>
                    <span className={`diff-badge diff-${t.difficulty}`}>{t.difficulty.slice(0,4)}</span>
                    <span
                      className="fav-star"
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(t.id); }}
                      title="Remove from favorites"
                    >★</span>
                    {batchMode && <span className={`batch-select-indicator ${batchSelected.includes(t.id) ? 'selected' : ''}`}>{batchSelected.includes(t.id) ? '☑' : '☐'}</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

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
                  className={`tool-btn ${selectedToolId === p.id ? 'active' : ''} ${batchSelected.includes(p.id) ? 'batch-selected' : ''}`}
                  onClick={() => {
                    handleToolClick(p.id, 'playbooks');
                  }}
                >
                  <span className="tool-id">{p.id}</span> {p.name}
                  <span className="tool-stars" title={`Usefulness: ${p.usefulness}/10`}>{renderStars(p.usefulness)}</span>
                  <span className={`diff-badge diff-${p.difficulty}`}>{p.difficulty.slice(0,4)}</span>
                  {batchMode && <span className={`batch-select-indicator ${batchSelected.includes(p.id) ? 'selected' : ''}`}>{batchSelected.includes(p.id) ? '☑' : '☐'}</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Playbooks */}
          <div className="cat-group">
            <div className="cat-label" onClick={() => setShowPlaybookModal(true)} style={{cursor:'pointer'}}>
              + Create Playbook
            </div>
            {customPlaybooks.map(pb => (
              <div key={pb.id} className="tool-list open">
                <button
                  className={`tool-btn ${selectedToolId === pb.id ? 'active' : ''}`}
                  onClick={() => { handleToolClick(pb.id, 'playbooks'); setShowPlaybookModal(false); }}
                >
                  <span className="tool-id">{pb.id}</span> {pb.name}
                  <span className="tool-stars" title={`Usefulness: ${pb.usefulness}/10`}>{renderStars(pb.usefulness)}</span>
                  <span className={`diff-badge diff-${pb.difficulty}`}>{pb.difficulty.slice(0,4)}</span>
                  <span
                    className="fav-star"
                    onClick={(e) => { e.stopPropagation(); deleteCustomPlaybook(pb.id); }}
                    title="Delete playbook"
                    style={{color:'#ff0000'}}
                  >✕</span>
                </button>
              </div>
            ))}
          </div>

          {[...new Set(filteredTools.map(t => t.category))].map(cat => (
            <div key={cat} className="cat-group">
              <div 
                className={`cat-label ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </div>
              <div className={`tool-list ${activeCategory === cat ? 'open' : ''}`}>
                {nonFavoritedTools.filter(t => t.category === cat).map(t => (
                  <button
                    key={t.id}
                    className={`tool-btn ${selectedToolId === t.id ? 'active' : ''} ${batchSelected.includes(t.id) ? 'batch-selected' : ''}`}
                    onClick={() => handleToolClick(t.id, t.category)}
                  >
                    <span className="tool-id">{t.id}</span> {t.name}
                    <span className="tool-stars" title={`Usefulness: ${t.usefulness}/10`}>{renderStars(t.usefulness)}</span>
                    <span className={`diff-badge diff-${t.difficulty}`}>{t.difficulty.slice(0,4)}</span>
                    <span
                      className={`fav-star ${isFavorited(t.id) ? 'favorited' : ''}`}
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(t.id); }}
                      title={isFavorited(t.id) ? 'Remove from favorites' : 'Add to favorites'}
                    >{isFavorited(t.id) ? '★' : '☆'}</span>
                    {batchMode && <span className={`batch-select-indicator ${batchSelected.includes(t.id) ? 'selected' : ''}`}>{batchSelected.includes(t.id) ? '☑' : '☐'}</span>}
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

      {/* Execution History Panel */}
      <div className="exec-history-panel" id="exec-history-panel">
        <div className="exec-history-header">
          <span>EXECUTION LOG</span>
          <button className="settings-toggle" onClick={() => document.getElementById('exec-history-panel')?.classList.remove('open')} style={{fontSize:'0.5rem',padding:'2px 6px'}}>✕</button>
        </div>
        <div className="exec-history-body">
          {executionHistory.length === 0 && <div className="empty-state">No executions yet.</div>}
          {executionHistory.map(h => (
            <div key={h.id} className="history-item exec-history-item">
              <div className="h-meta">{h.timestamp}</div>
              <div className="h-tool">{h.tool} → {h.target}</div>
              <div className="h-status" style={{color: h.status === 'SUCCESS' ? '#00ff41' : h.status === 'FAILED' ? '#ff0000' : '#fbbf24'}}>
                {h.status} ({h.duration})
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Drawer overlay for mobile */}
      <div className="drawer-overlay" id="drawer-overlay" onClick={closeAllDrawers} />

      <main className="hex-workspace">
        <header className="workspace-header">
          <div className="target-bar">
            <button 
              className="settings-toggle mobile-menu-btn" 
              onClick={() => {
                const sidebar = document.querySelector('.hex-sidebar');
                sidebar?.classList.toggle('open');
                // Close intel panel if open
                document.querySelector('.hex-intel')?.classList.remove('open');
                document.querySelector('.exec-history-panel')?.classList.remove('open');
              }}
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
              {/* Batch Mode Toggle */}
              <button 
                onClick={() => setBatchMode(!batchMode)} 
                className={`settings-toggle ${batchMode ? 'batch-active' : ''}`}
              >
                BATCH {batchMode ? 'ON' : 'OFF'}
              </button>
              {/* Run Batch Button */}
              {batchMode && (
                <button 
                  onClick={executeBatch} 
                  disabled={batchSelected.length === 0 || batchRunning || !target} 
                  className="batch-run-btn"
                >
                  {batchRunning ? `BATCHING ${batchProgress}%` : `RUN BATCH (${batchSelected.length})`}
                </button>
              )}
              {/* Run Chain Button */}
              <button 
                onClick={executeChain} 
                disabled={chainTools.length === 0 || chainRunning || !target} 
                className="strike-btn chain-btn"
              >
                {chainRunning ? 'CHAINING...' : `RUN CHAIN${chainTools.length > 0 ? ` (${chainTools.length})` : ''}`}
              </button>
              {/* Theme Toggle */}
              <button 
                onClick={() => setTheme(prev => prev === 'void-red' ? 'light' : 'void-red')} 
                className="theme-toggle-btn"
                title="Toggle Dark/Light Theme"
              >
                {theme === 'void-red' ? '☀ LIGHT' : '☾ DARK'}
              </button>
              {/* Tool Compare */}
              <button 
                onClick={() => setShowCompare(true)} 
                className="compare-btn"
                title="Compare two tools side-by-side"
              >
                ⚖ COMPARE
              </button>
            </div>
          </div>
          {/* Batch Progress Bar */}
          {batchMode && batchRunning && (
            <div className="batch-progress-bar">
              <div className="batch-progress-fill" style={{width: `${batchProgress}%`}} />
              <span className="batch-progress-text">{batchCurrentTool} — {batchProgress}%</span>
            </div>
          )}
          {/* Chain Status Bar */}
          {chainTools.length > 0 && (
            <div className="chain-status-bar">
              <span className="chain-status-label">CHAIN:</span>
              {chainTools.map((id, i) => {
                const t = toolRegistry.find(t => t.id === id);
                const result = chainResults[i];
                const statusColor = result?.status === 'SUCCESS' ? '#00ff41' : result?.status === 'FAILED' ? '#ff0000' : '#666';
                return (
                  <React.Fragment key={id}>
                    {i > 0 && <span className="chain-arrow">→</span>}
                    <span 
                      className="chain-step" 
                      style={{color: i < chainStep ? statusColor : '#888', borderColor: i === chainStep - 1 ? '#fbbf24' : '#333'}}
                      onClick={() => removeFromChain(i)}
                      title="Click to remove"
                    >
                      {t?.name || id}
                      {result && <span className="chain-step-status" style={{color: statusColor}}> {result.status === 'SUCCESS' ? '✓' : '✗'}</span>}
                    </span>
                  </React.Fragment>
                );
              })}
              <button onClick={clearChain} className="settings-toggle" style={{fontSize:'0.5rem',padding:'2px 6px',marginLeft:'8px'}}>CLEAR</button>
            </div>
          )}
          {/* Chain Builder */}
          {batchMode && (
            <div className="chain-builder">
              <input
                className="chain-builder-input"
                placeholder="Add tool to chain..."
                value={chainInput}
                onChange={(e) => setChainInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && chainInput.trim()) { addToChain(chainInput.trim().toLowerCase()); setChainInput(''); } }}
                aria-label="Add tool to chain"
              />
              <button 
                onClick={() => { if (chainInput.trim()) { addToChain(chainInput.trim().toLowerCase()); setChainInput(''); } }}
                className="chain-builder-add"
                disabled={!chainInput.trim()}
              >
                ADD TO CHAIN
              </button>
              <span className="chain-builder-hint">Type tool ID or name, press Enter</span>
            </div>
          )}
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

        {/* Live Output Viewer Panel */}
        {showLiveOutput && (
          <div className={`live-output-panel ${executing ? 'active' : ''}`}>
            <div className="live-output-header">
              <span>LIVE_OUTPUT</span>
              <button className="settings-toggle" onClick={() => setShowLiveOutput(false)} style={{fontSize:'0.5rem',padding:'2px 6px'}}>✕</button>
            </div>
            <div className="live-output-body" ref={liveOutputRef}>
              {liveOutput.map((line, i) => (
                <div key={i} className="log-line typewriter" style={{ animationDelay: `${i * 0.03}s`, fontSize: `${fontSize * 0.85}px` }}>
                  {line}
                </div>
              ))}
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

        {/* Mobile Bottom Action Bar */}
        <div className="mobile-bottom-bar">
          <button className="bottom-bar-btn" onClick={() => executeStrike('portscan')} disabled={executing} title="Port Scan">PORT</button>
          <button className="bottom-bar-btn strike-btn-mobile" onClick={() => executeStrike('autopilot')} disabled={executing} title="AutoPilot Strike">⚡ STRIKE</button>
          <button className="bottom-bar-btn" onClick={exportPDF} title="Export PDF">📄 PDF</button>
          <button className="bottom-bar-btn" onClick={exportReport} title="Export Report">📋 EXPORT</button>
          <button className="bottom-bar-btn" onClick={() => document.getElementById('exec-history-panel')?.classList.toggle('open')} title="Execution History">📜 LOG</button>
        </div>
        {/* Terminal Input with Command History */}
        <div className="terminal-input-bar">
          <span className="terminal-input-prefix">▸</span>
          <input
            className="terminal-input"
            placeholder="Type command... (↑↓ history · Enter execute · Esc clear)"
            value={terminalInput}
            onChange={(e) => setTerminalInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (terminalHistory.length > 0) {
                  setTerminalHistoryIdx(prev => {
                    const next = prev < terminalHistory.length - 1 ? prev + 1 : prev;
                    setTerminalInput(terminalHistory[next] || '');
                    return next;
                  });
                }
              }
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setTerminalHistoryIdx(prev => {
                  const next = prev > 0 ? prev - 1 : -1;
                  setTerminalInput(terminalHistory[next] || '');
                  return next;
                });
              }
              if (e.key === 'Enter' && terminalInput.trim()) {
                const cmd = terminalInput.trim();
                setTerminalHistory(prev => {
                  const next = [cmd, ...prev.filter(c => c !== cmd)];
                  return next.slice(0, 50);
                });
                setTerminalHistoryIdx(-1);
                setTerminalInput('');
                executeStrike(cmd);
              }
              if (e.key === 'Escape') {
                setTerminalInput('');
              }
            }}
            aria-label="Terminal command input"
          />
          <span className="terminal-input-hint">{terminalHistory.length} cmds</span>
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
          <div style={{fontSize:'0.6rem',color:'var(--blood-red)',textTransform:'uppercase',marginBottom:'8px',fontFamily:'Orbitron',letterSpacing:'1px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span>◆ SESSIONS</span>
            <span style={{fontSize:'0.5rem',color:'var(--text-dim)',fontWeight:'normal'}}>{Object.keys(sessions).length} saved</span>
          </div>
          <div style={{display:'flex',gap:'5px',marginBottom:'8px'}}>
            <input className="target-input" placeholder="Session name..." value={sessionName} onChange={(e) => setSessionName(e.target.value)} style={{width:'100%',fontSize:'0.7rem',padding:'4px 8px'}} onKeyDown={(e) => { if (e.key === 'Enter' && sessionName && target) saveSession(); }} />
            <button onClick={saveSession} className="settings-toggle" style={{fontSize:'0.55rem',padding:'4px 8px',borderColor:'#00ff41',color:'#00ff41'}}>SAVE</button>
          </div>
          {Object.keys(sessions).length === 0 && (
            <div style={{fontSize:'0.6rem',color:'#555',textAlign:'center',padding:'8px',fontStyle:'italic'}}>No saved sessions</div>
          )}
          {Object.keys(sessions).map((name, i) => (
            <div key={i} className="history-item session-item" style={{cursor:'pointer',padding:'6px 8px',fontSize:'0.65rem',display:'flex',justifyContent:'space-between',alignItems:'center',gap:'6px'}}>
              <span style={{color:'var(--blood-red)',flex:'1',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} onClick={() => loadSession(name)} title={`Load session: ${name}`}>{name}</span>
              <span style={{opacity:0.4,fontSize:'0.55rem',flexShrink:0}}>{sessions[name].target}</span>
              <button onClick={(e) => { e.stopPropagation(); deleteSession(name); }} style={{background:'transparent',border:'1px solid #333',color:'#666',fontSize:'0.5rem',padding:'1px 4px',cursor:'pointer',fontFamily:'Orbitron',flexShrink:0}} title={`Delete session: ${name}`}>DEL</button>
            </div>
          ))}
        </div>
      </aside>

      {isCmdPaletteOpen && (
        <div className="cmd-palette" onClick={(e) => { if (e.target === e.currentTarget) { setIsCmdPaletteOpen(false); setCmdInput(''); } }}>
          <form onSubmit={handleCmdSubmit}>
            <input
              ref={paletteInputRef}
              autoFocus
              className="palette-input"
              placeholder={showRecentOnly ? "Search tools, playbooks, or run command..." : "Search tools, playbooks, or run command..."}
              value={cmdInput}
              onChange={(e) => setCmdInput(e.target.value)}
              onKeyDown={handleCmdKeyDown}
            />
            <div className="palette-hint">↑↓ Navigate · Enter Execute · Esc Close · Ctrl+K Toggle · Tab Complete</div>
          </form>
          {showAutoComplete && (
            <div className="autocomplete-dropdown">
              {autoCompleteResults.map((item, i) => (
                <div
                  key={item.id}
                  className={`autocomplete-item ${i === autoCompleteIndex ? 'autocomplete-item-active' : ''}`}
                  onClick={() => {
                    setCmdInput(item.id);
                    setShowAutoComplete(false);
                    setAutoCompleteResults([]);
                  }}
                >
                  <span className="autocomplete-type">⚙</span>
                  <span className="autocomplete-label">{item.id}</span>
                  <span className="autocomplete-name">{item.name}</span>
                </div>
              ))}
            </div>
          )}
          <div className="palette-results">
            {cmdResults.length === 0 && (
              <div className="palette-empty">No matches found</div>
            )}
            {cmdResults.map((item, i) => (
              <div
                key={`${item.type}-${item.id}`}
                className={`palette-item ${i === cmdActiveIndex ? 'palette-item-active' : ''}`}
                onClick={() => {
                  setCmdInput('');
                  setIsCmdPaletteOpen(false);
                  setCmdHistory(prev => {
                    const next = [item.id, ...prev.filter(c => c !== item.id)];
                    return next.slice(0, 20);
                  });
                  executeStrike(item.id);
                }}
              >
                <span className={`palette-type type-${item.type}`}>{item.type === 'tool' ? '⚙' : item.type === 'playbook' ? '◆' : '⌛'}</span>
                <span className="palette-label">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showHelp && (
        <div className="help-overlay" onClick={() => setShowHelp(false)}>
          <div className="help-modal" onClick={e => e.stopPropagation()}>
            <div className="help-header">KEYBOARD_SHORTCUTS</div>
            <div className="help-body">
              <div className="help-row"><span className="help-key">Ctrl+K</span><span className="help-desc">Command palette</span></div>
              <div className="help-row"><span className="help-key">Ctrl+F</span><span className="help-desc">Toggle fullscreen</span></div>
              <div className="help-row"><span className="help-key">Ctrl+S</span><span className="help-desc">Save session</span></div>
              <div className="help-row"><span className="help-key">Ctrl+/</span><span className="help-desc">This help</span></div>
              <div className="help-row"><span className="help-key">Tab</span><span className="help-desc">Auto-complete tool name</span></div>
              <div className="help-row"><span className="help-key">↑↓</span><span className="help-desc">Navigate palette</span></div>
              <div className="help-row"><span className="help-key">Enter</span><span className="help-desc">Execute selected</span></div>
              <div className="help-row"><span className="help-key">Esc</span><span className="help-desc">Close modal</span></div>
            </div>
            <button className="save-btn" onClick={() => setShowHelp(false)}>CLOSE</button>
          </div>
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
                <input type="checkbox" checked={crtFlicker} onChange={() => setCrtFlicker(!crtFlicker)} />
              </div>
              <div className="setting-item">
                <span className="s-label">MATRIX_RAIN:</span>
                <input type="checkbox" checked={matrixRain} onChange={() => setMatrixRain(!matrixRain)} />
              </div>
              <div className="setting-item">
                <span className="s-label">MATRIX_DENSITY:</span>
                <select className="settings-toggle" value={density} onChange={(e) => setDensity(e.target.value)} style={{fontSize:'0.55rem',padding:'2px 4px'}}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
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
      {/* Tool Detail Modal */}
      {showToolDetail && (
        <div className="modal-overlay" onClick={() => setShowToolDetail(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{currentTool.name}</h2>
              <button className="modal-close" onClick={() => setShowToolDetail(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-info">
                <span className="modal-category">{currentTool.category}</span>
                <span className="modal-id">{currentTool.id}</span>
              </div>
              <p className="modal-description">{currentTool.info}</p>
              <div className="modal-stats">
                <div className="modal-stat">
                  <span className="stat-label">Usefulness</span>
                  <div className="stat-bar">
                    {[1,2,3,4,5,6,7,8,9,10].map(i => (
                      <span key={i} className={`stat-segment ${i <= currentTool.usefulness ? 'filled' : ''}`} />
                    ))}
                  </div>
                  <span className="stat-value">{currentTool.usefulness}/10</span>
                </div>
                <div className="modal-stat">
                  <span className="stat-label">Difficulty</span>
                  <span className={`difficulty-badge ${currentTool.difficulty}`}>{currentTool.difficulty}</span>
                </div>
                <div className="modal-stat">
                  <span className="stat-label">Rating</span>
                  <span className="modal-stars" title={`${currentTool.usefulness}/10`}>{renderStars(currentTool.usefulness)}</span>
                </div>
              </div>
              <div className="modal-tags">
                {currentTool.tags.map((tag, i) => (
                  <span key={i} className="tag">{tag}</span>
                ))}
              </div>
              {currentTool.link && (
                <a href={currentTool.link} target="_blank" rel="noopener noreferrer" className="modal-link">
                  🔗 {currentTool.link}
                </a>
              )}
            </div>
            <div className="modal-footer">
              <span
                className={`fav-toggle ${isFavorited(currentTool.id) ? 'favorited' : ''}`}
                onClick={() => toggleFavorite(currentTool.id)}
                title={isFavorited(currentTool.id) ? 'Remove from favorites' : 'Add to favorites'}
              >
                {isFavorited(currentTool.id) ? '★ Favorited' : '☆ Add to favorites'}
              </span>
            </div>
          </div>
        </div>
      )}
      {/* Tool Comparison Modal */}
      {showCompare && (
        <div className="compare-overlay" onClick={() => setShowCompare(false)}>
          <div className="compare-modal" onClick={e => e.stopPropagation()}>
            <div className="compare-header">
              <h2>⚖ TOOL COMPARISON</h2>
              <button className="compare-close" onClick={() => setShowCompare(false)}>✕</button>
            </div>
            <div className="compare-selectors">
              <span className="compare-selector-label">TOOL A:</span>
              <select className="compare-selector" value={compareToolA} onChange={e => setCompareToolA(e.target.value)}>
                <option value="">-- Select Tool A --</option>
                {toolRegistry.map(t => (
                  <option key={t.id} value={t.id}>{t.id} — {t.name}</option>
                ))}
              </select>
              <span className="compare-vs">VS</span>
              <span className="compare-selector-label">TOOL B:</span>
              <select className="compare-selector" value={compareToolB} onChange={e => setCompareToolB(e.target.value)}>
                <option value="">-- Select Tool B --</option>
                {toolRegistry.map(t => (
                  <option key={t.id} value={t.id}>{t.id} — {t.name}</option>
                ))}
              </select>
            </div>
            <div className="compare-body">
              {(!compareToolA || !compareToolB) && (
                <div className="compare-empty">
                  Select two tools above to compare them side-by-side.
                </div>
              )}
              {compareToolA && compareToolB && (() => {
                const toolA = toolRegistry.find(t => t.id === compareToolA);
                const toolB = toolRegistry.find(t => t.id === compareToolB);
                if (!toolA || !toolB) return null;
                return (
                  <>
                    <div className="compare-tool-card">
                      <div className="compare-tool-header">
                        <span className="compare-tool-category">{toolA.category}</span>
                        <span className="compare-tool-name">{toolA.name}</span>
                        <span className="compare-tool-id">{toolA.id}</span>
                      </div>
                      <p className="compare-description">{toolA.info}</p>
                      <div className="compare-stats">
                        <div className="compare-stat">
                          <span className="compare-stat-label">Usefulness</span>
                          <div className="compare-usefulness-bar">
                            {[1,2,3,4,5,6,7,8,9,10].map(i => (
                              <span key={i} className={`compare-usefulness-segment ${i <= toolA.usefulness ? 'filled' : ''}`} />
                            ))}
                            <span className="compare-usefulness-value">{toolA.usefulness}/10</span>
                          </div>
                        </div>
                        <div className="compare-stat">
                          <span className="compare-stat-label">Difficulty</span>
                          <span className={`compare-difficulty ${toolA.difficulty}`}>{toolA.difficulty}</span>
                        </div>
                        <div className="compare-tags">
                          {toolA.tags.map((tag, i) => (
                            <span key={i} className="compare-tag">{tag}</span>
                          ))}
                        </div>
                      </div>
                      {toolA.link && (
                        <a href={toolA.link} target="_blank" rel="noopener noreferrer" className="compare-link">
                          🔗 {toolA.link}
                        </a>
                      )}
                    </div>
                    <div className="compare-tool-card">
                      <div className="compare-tool-header">
                        <span className="compare-tool-category">{toolB.category}</span>
                        <span className="compare-tool-name">{toolB.name}</span>
                        <span className="compare-tool-id">{toolB.id}</span>
                      </div>
                      <p className="compare-description">{toolB.info}</p>
                      <div className="compare-stats">
                        <div className="compare-stat">
                          <span className="compare-stat-label">Usefulness</span>
                          <div className="compare-usefulness-bar">
                            {[1,2,3,4,5,6,7,8,9,10].map(i => (
                              <span key={i} className={`compare-usefulness-segment ${i <= toolB.usefulness ? 'filled' : ''}`} />
                            ))}
                            <span className="compare-usefulness-value">{toolB.usefulness}/10</span>
                          </div>
                        </div>
                        <div className="compare-stat">
                          <span className="compare-stat-label">Difficulty</span>
                          <span className={`compare-difficulty ${toolB.difficulty}`}>{toolB.difficulty}</span>
                        </div>
                        <div className="compare-tags">
                          {toolB.tags.map((tag, i) => (
                            <span key={i} className="compare-tag">{tag}</span>
                          ))}
                        </div>
                      </div>
                      {toolB.link && (
                        <a href={toolB.link} target="_blank" rel="noopener noreferrer" className="compare-link">
                          🔗 {toolB.link}
                        </a>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
      {/* Create Playbook Modal */}
      {showPlaybookModal && (
        <div className="modal-overlay" onClick={() => setShowPlaybookModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{width:'600px'}}>
            <div className="modal-header">
              <h2 className="modal-title">CREATE PLAYBOOK</h2>
              <button className="modal-close" onClick={() => setShowPlaybookModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-info">
                <span className="modal-category">CUSTOM</span>
              </div>
              <input
                className="target-input"
                placeholder="Playbook name..."
                value={playbookForm.name}
                onChange={(e) => setPlaybookForm(prev => ({...prev, name: e.target.value}))}
                style={{width:'100%',marginBottom:'8px'}}
              />
              <input
                className="target-input"
                placeholder="Description..."
                value={playbookForm.description}
                onChange={(e) => setPlaybookForm(prev => ({...prev, description: e.target.value}))}
                style={{width:'100%',marginBottom:'8px'}}
              />
              <input
                className="target-input"
                placeholder="Tags (comma-separated)..."
                value={playbookForm.tags}
                onChange={(e) => setPlaybookForm(prev => ({...prev, tags: e.target.value}))}
                style={{width:'100%',marginBottom:'8px'}}
              />
              <div style={{maxHeight:'200px',overflowY:'auto',border:'1px solid var(--dark-red)',padding:'8px',marginBottom:'8px'}}>
                {toolRegistry.map(t => (
                  <label key={t.id} style={{display:'flex',alignItems:'center',gap:'8px',padding:'4px 0',cursor:'pointer',fontSize:'0.75rem'}}>
                    <input
                      type="checkbox"
                      checked={playbookForm.tools.includes(t.id)}
                      onChange={() => toggleToolInForm(t.id)}
                    />
                    <span className="tool-id">{t.id}</span> {t.name}
                    <span className="tool-stars">{renderStars(t.usefulness)}</span>
                    <span className={`diff-badge diff-${t.difficulty}`}>{t.difficulty.slice(0,4)}</span>
                  </label>
                ))}
              </div>
              <div style={{fontSize:'0.65rem',color:'var(--text-dim)'}}>
                Selected: {playbookForm.tools.length} tools
              </div>
            </div>
            <div className="modal-footer">
              <button className="save-btn" onClick={saveCustomPlaybook} disabled={!playbookForm.name || playbookForm.tools.length === 0}>
                SAVE PLAYBOOK
              </button>
            </div>
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

const CanvasRain = ({ density = 'medium' }) => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*';
    const fontSize = 14;
    const columnSkip = density === 'low' ? 3 : density === 'high' ? 1 : 2;
    const columns = Math.floor(canvas.width / fontSize);
    const activeColumns = [];
    for (let i = 0; i < columns; i += columnSkip) {
      activeColumns.push(i);
    }
    const drops = {};
    activeColumns.forEach(i => { drops[i] = 1; });
    
    let animationId;
    
    const draw = () => {
      ctx.fillStyle = 'rgba(5, 5, 5, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#00ff41';
      ctx.font = `${fontSize}px monospace`;
      
      activeColumns.forEach(i => {
        const text = chars.charAt(Math.floor(Math.random() * chars.length));
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      });
      
      animationId = requestAnimationFrame(draw);
    };
    
    draw();
    
    return () => cancelAnimationFrame(animationId);
  }, [density]);
  
  return <canvas ref={canvasRef} className="matrix-rain" style={{ opacity: 0.15 }} />;
};

export default TerminalPage;