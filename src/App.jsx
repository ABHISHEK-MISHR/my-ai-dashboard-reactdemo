import { useState, useRef, useEffect, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// 🔑 STEP 1: Apni Gemini API Key yahan paste karo
//    aistudio.google.com → "Get API Key" → Copy karo → yahan paste karo
// ─────────────────────────────────────────────────────────────────────────────
const GEMINI_API_KEY = "AIzaSyCoIn1SPcoQcuO7fUHCD7rx9U85CPbyjAY"; // ← sirf yahi ek jagah change karo!

// ─── GEMINI API CALL ──────────────────────────────────────────────────────────
// Yeh function Gemini API ko call karta hai
// messages = [{role:"user", text:"..."}, {role:"ai", text:"..."}] format mein
async function callGemini(messages, systemPrompt = "") {
  // Gemini ka URL - gemini-2.0-flash model use kar rahe hain (fastest + free)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  // Gemini ka message format thoda alag hai Claude se
  // Claude: [{role:"user", content:"..."}]
  // Gemini: [{role:"user", parts:[{text:"..."}]}]
  const contents = messages.map(m => ({
    role: m.role === "ai" || m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.text || m.content || "" }]
  }));

  const body = {
    contents,
    generationConfig: {
      maxOutputTokens: 1000,
      temperature: 0.7,
    }
  };

  // Agar system prompt hai toh add karo
  if (systemPrompt) {
    body.systemInstruction = { parts: [{ text: systemPrompt }] };
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  // Error check
  if (data.error) throw new Error(data.error.message);

  // Gemini ka response format: data.candidates[0].content.parts[0].text
  return data.candidates[0].content.parts[0].text;
}

// ─── IMAGE ANALYSIS - Gemini Vision ──────────────────────────────────────────
// Image analysis ke liye alag function - base64 image bhi bhejta hai
async function callGeminiVision(base64Image, mimeType, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [
          // Pehle image
          { inline_data: { mime_type: mimeType, data: base64Image } },
          // Phir text prompt
          { text: prompt }
        ]
      }],
      generationConfig: { maxOutputTokens: 1000 }
    })
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.candidates[0].content.parts[0].text;
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Syne:wght@400;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #050508;
    --surface: #0d0d14;
    --surface2: #13131e;
    --border: rgba(255,255,255,0.06);
    --accent: #4285f4;
    --accent2: #34a853;
    --accent3: #fbbc04;
    --text: #e8e8f0;
    --muted: #6b6b80;
    --glow: 0 0 30px rgba(66,133,244,0.3);
    --font-display: 'Syne', sans-serif;
    --font-mono: 'Space Mono', monospace;
  }

  body { background: var(--bg); color: var(--text); font-family: var(--font-display); overflow-x: hidden; }
  .app { display: flex; height: 100vh; overflow: hidden; }

  .sidebar {
    width: 220px; flex-shrink: 0;
    background: var(--surface);
    border-right: 1px solid var(--border);
    display: flex; flex-direction: column;
    padding: 24px 0; position: relative; z-index: 10;
  }
  .sidebar-logo {
    padding: 0 20px 28px;
    font-size: 18px; font-weight: 800; letter-spacing: -0.5px;
    border-bottom: 1px solid var(--border);
    display: flex; align-items: center; gap: 10px;
  }
  .logo-dot {
    width: 10px; height: 10px; border-radius: 50%;
    background: var(--accent);
    box-shadow: 0 0 12px var(--accent);
    animation: pulse 2s ease-in-out infinite;
  }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(0.85)} }

  .nav { padding: 16px 10px; flex: 1; }
  .nav-item {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px; border-radius: 10px;
    cursor: pointer; font-size: 13px; font-weight: 600;
    color: var(--muted); transition: all 0.2s ease;
    letter-spacing: 0.3px; margin-bottom: 2px;
    border: 1px solid transparent;
  }
  .nav-item:hover { color: var(--text); background: rgba(255,255,255,0.04); }
  .nav-item.active {
    color: var(--accent); background: rgba(66,133,244,0.1);
    border-color: rgba(66,133,244,0.2);
  }
  .nav-icon { font-size: 16px; }
  .sidebar-footer { padding: 16px 20px; border-top: 1px solid var(--border); font-size: 11px; color: var(--muted); font-family: var(--font-mono); }

  .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
  .header {
    padding: 18px 32px; border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
    background: var(--surface);
  }
  .header-title { font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
  .header-subtitle { font-size: 12px; color: var(--muted); font-family: var(--font-mono); margin-top: 2px; }
  .status-badge {
    display: flex; align-items: center; gap: 6px;
    font-size: 11px; font-family: var(--font-mono); color: var(--accent3);
    background: rgba(251,188,4,0.08); border: 1px solid rgba(251,188,4,0.2);
    padding: 6px 12px; border-radius: 20px;
  }
  .status-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent3); animation: pulse 1.5s infinite; }

  .content { flex: 1; overflow-y: auto; padding: 28px 32px; }
  .content::-webkit-scrollbar { width: 4px; }
  .content::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

  /* API Key Banner */
  .api-banner {
    background: rgba(251,188,4,0.1); border: 1px solid rgba(251,188,4,0.3);
    border-radius: 12px; padding: 14px 18px; margin-bottom: 20px;
    font-size: 13px; display: flex; align-items: center; gap: 10px;
  }
  .api-input {
    flex: 1; background: var(--surface2); border: 1px solid var(--border);
    border-radius: 8px; padding: 8px 12px; color: var(--text);
    font-family: var(--font-mono); font-size: 12px; outline: none;
  }
  .api-save-btn {
    padding: 8px 16px; border-radius: 8px; border: none;
    background: var(--accent); color: #fff; cursor: pointer;
    font-size: 12px; font-weight: 700;
  }

  /* CHAT */
  .chat-container { display: flex; flex-direction: column; height: 100%; }
  .chat-messages { flex: 1; overflow-y: auto; padding-right: 4px; display: flex; flex-direction: column; gap: 16px; }
  .chat-messages::-webkit-scrollbar { width: 3px; }
  .chat-messages::-webkit-scrollbar-thumb { background: var(--border); }

  .msg { display: flex; gap: 12px; animation: fadeUp 0.3s ease; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  .msg.user { flex-direction: row-reverse; }
  .msg-avatar {
    width: 34px; height: 34px; border-radius: 10px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; font-weight: 700;
  }
  .msg.user .msg-avatar { background: linear-gradient(135deg, var(--accent), var(--accent2)); }
  .msg.ai .msg-avatar { background: linear-gradient(135deg, #1e1e30, #2a2a40); border: 1px solid var(--border); }
  .msg-bubble {
    max-width: 70%; padding: 12px 16px; border-radius: 14px;
    font-size: 14px; line-height: 1.6;
  }
  .msg.user .msg-bubble {
    background: linear-gradient(135deg, rgba(66,133,244,0.25), rgba(52,168,83,0.15));
    border: 1px solid rgba(66,133,244,0.3); border-top-right-radius: 4px;
  }
  .msg.ai .msg-bubble {
    background: var(--surface2); border: 1px solid var(--border); border-top-left-radius: 4px;
  }

  .chat-input-area {
    margin-top: 20px; display: flex; gap: 10px; align-items: flex-end;
    background: var(--surface2); border: 1px solid var(--border);
    border-radius: 16px; padding: 12px 16px; transition: border-color 0.2s;
  }
  .chat-input-area:focus-within { border-color: rgba(66,133,244,0.4); box-shadow: var(--glow); }
  .chat-textarea {
    flex: 1; background: transparent; border: none; outline: none;
    color: var(--text); font-family: var(--font-display); font-size: 14px;
    resize: none; min-height: 22px; max-height: 120px; line-height: 1.5;
  }
  .chat-textarea::placeholder { color: var(--muted); }
  .send-btn {
    width: 36px; height: 36px; border-radius: 10px; border: none;
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center;
    font-size: 16px; transition: transform 0.15s, box-shadow 0.15s; flex-shrink: 0;
  }
  .send-btn:hover:not(:disabled) { transform: scale(1.05); box-shadow: var(--glow); }
  .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .typing-indicator { display: flex; gap: 4px; padding: 4px 0; }
  .typing-dot {
    width: 6px; height: 6px; border-radius: 50%; background: var(--accent);
    animation: bounce 1.2s ease infinite;
  }
  .typing-dot:nth-child(2) { animation-delay: 0.2s; }
  .typing-dot:nth-child(3) { animation-delay: 0.4s; }
  @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }

  /* VOICE */
  .voice-container { display: flex; flex-direction: column; align-items: center; height: 100%; }
  .voice-orb-wrapper { flex: 1; display: flex; align-items: center; justify-content: center; position: relative; }
  .voice-rings { position: absolute; width: 200px; height: 200px; border-radius: 50%; }
  .voice-ring {
    position: absolute; inset: 0; border-radius: 50%;
    border: 1px solid rgba(66,133,244,0.3);
    animation: ringPulse 2s ease-out infinite;
  }
  .voice-ring:nth-child(2) { animation-delay: 0.5s; }
  .voice-ring:nth-child(3) { animation-delay: 1s; }
  @keyframes ringPulse { 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(2);opacity:0} }
  .voice-ring.active { border-color: rgba(66,133,244,0.8); animation-duration: 0.8s; }
  .voice-orb {
    width: 140px; height: 140px; border-radius: 50%;
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    display: flex; align-items: center; justify-content: center;
    font-size: 48px; cursor: pointer; position: relative; z-index: 1;
    box-shadow: 0 0 60px rgba(66,133,244,0.4);
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .voice-orb:hover { transform: scale(1.05); }
  .voice-orb.listening { animation: orbPulse 0.8s ease-in-out infinite; }
  @keyframes orbPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
  .voice-waveform { display: flex; align-items: center; gap: 4px; height: 40px; margin: 20px 0; }
  .wave-bar { width: 4px; background: var(--accent); border-radius: 2px; transition: height 0.1s ease; }
  .wave-bar.active { animation: waveAnim 0.5s ease-in-out infinite alternate; }
  @keyframes waveAnim { from{height:4px} to{height:36px} }
  .voice-transcript {
    background: var(--surface2); border: 1px solid var(--border);
    border-radius: 16px; padding: 20px; width: 100%; max-width: 600px;
    font-size: 14px; line-height: 1.7; min-height: 100px;
  }
  .voice-status { margin-top: 12px; font-size: 12px; font-family: var(--font-mono); color: var(--muted); }

  /* ANALYZER */
  .analyzer-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .analyzer-panel { display: flex; flex-direction: column; }
  .panel-label { font-size: 11px; font-family: var(--font-mono); color: var(--muted); letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px; }
  .analyzer-textarea {
    flex: 1; background: var(--surface2); border: 1px solid var(--border);
    border-radius: 12px; padding: 16px; color: var(--text);
    font-family: var(--font-mono); font-size: 13px; resize: none; outline: none;
    line-height: 1.6; min-height: 200px;
  }
  .analyzer-output {
    flex: 1; background: var(--surface2); border: 1px solid var(--border);
    border-radius: 12px; padding: 16px; font-size: 13px; line-height: 1.7;
    min-height: 200px; overflow-y: auto; white-space: pre-wrap; font-family: var(--font-mono);
  }
  .mode-bar { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
  .mode-btn {
    padding: 6px 14px; border-radius: 8px; border: 1px solid var(--border);
    background: var(--surface); color: var(--muted); cursor: pointer;
    font-size: 12px; font-family: var(--font-display); font-weight: 600; transition: all 0.15s;
  }
  .mode-btn.active { background: rgba(66,133,244,0.15); border-color: var(--accent); color: var(--accent); }
  .run-btn {
    padding: 10px 24px; border-radius: 10px; border: none;
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    color: #fff; cursor: pointer; font-size: 13px; font-weight: 700;
    font-family: var(--font-display); margin-top: 10px; transition: opacity 0.2s, transform 0.15s;
  }
  .run-btn:hover:not(:disabled) { transform: translateY(-1px); }
  .run-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  /* CODE GEN */
  .codegen-container { display: flex; flex-direction: column; gap: 16px; height: 100%; }
  .codegen-prompt {
    background: var(--surface2); border: 1px solid var(--border);
    border-radius: 12px; padding: 14px 16px; display: flex; gap: 10px; align-items: center;
  }
  .codegen-input {
    flex: 1; background: transparent; border: none; outline: none;
    color: var(--text); font-family: var(--font-display); font-size: 14px;
  }
  .codegen-input::placeholder { color: var(--muted); }
  .lang-select {
    background: var(--surface); border: 1px solid var(--border);
    color: var(--text); border-radius: 8px; padding: 6px 10px;
    font-size: 12px; font-family: var(--font-mono); cursor: pointer; outline: none;
  }
  .code-output {
    flex: 1; background: #0a0a10; border: 1px solid var(--border);
    border-radius: 14px; overflow: hidden; display: flex; flex-direction: column;
  }
  .code-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 16px; background: var(--surface2); border-bottom: 1px solid var(--border);
  }
  .code-lang-tag { font-size: 11px; font-family: var(--font-mono); color: var(--accent3); }
  .copy-btn {
    font-size: 11px; font-family: var(--font-mono); padding: 4px 10px;
    border-radius: 6px; border: 1px solid var(--border);
    background: var(--surface); color: var(--muted); cursor: pointer; transition: all 0.2s;
  }
  .copy-btn:hover { color: var(--text); }
  .code-body { flex: 1; padding: 20px; overflow-y: auto; font-family: var(--font-mono); font-size: 13px; line-height: 1.7; white-space: pre-wrap; color: #c9d1d9; }

  /* IMAGE */
  .imganalyze-container { display: flex; flex-direction: column; gap: 16px; }
  .drop-zone {
    border: 2px dashed var(--border); border-radius: 16px;
    padding: 48px; text-align: center; cursor: pointer; transition: all 0.2s;
  }
  .drop-zone:hover, .drop-zone.dragover { border-color: var(--accent); background: rgba(66,133,244,0.05); }
  .drop-icon { font-size: 48px; margin-bottom: 12px; }
  .drop-text { font-size: 14px; color: var(--muted); }
  .preview-img { max-height: 280px; border-radius: 12px; object-fit: contain; margin: 0 auto; display: block; }
  .analyze-result {
    background: var(--surface2); border: 1px solid var(--border);
    border-radius: 12px; padding: 20px; font-size: 14px; line-height: 1.7; white-space: pre-wrap;
  }

  /* DASHBOARD */
  .dash-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; margin-bottom: 20px; }
  .stat-card {
    background: var(--surface2); border: 1px solid var(--border);
    border-radius: 14px; padding: 20px; position: relative; overflow: hidden;
  }
  .stat-value { font-size: 28px; font-weight: 800; letter-spacing: -1px; }
  .stat-label { font-size: 11px; color: var(--muted); font-family: var(--font-mono); margin-top: 4px; }
  .stat-delta { font-size: 11px; margin-top: 8px; color: var(--accent2); }
  .recent-list { display: flex; flex-direction: column; gap: 8px; }
  .recent-item {
    display: flex; align-items: center; gap: 12px;
    background: var(--surface2); border: 1px solid var(--border);
    border-radius: 10px; padding: 12px 16px; cursor: pointer;
    transition: border-color 0.2s;
  }
  .recent-item:hover { border-color: rgba(66,133,244,0.3); }
  .recent-icon { font-size: 18px; }
  .recent-info { flex: 1; }
  .recent-title { font-size: 13px; font-weight: 600; }
  .recent-sub { font-size: 11px; color: var(--muted); font-family: var(--font-mono); margin-top: 2px; }

  .spinner {
    width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.15);
    border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block;
  }
  @keyframes spin { to{transform:rotate(360deg)} }

  @media(max-width: 768px) {
    .sidebar { width: 64px; }
    .sidebar-logo span, .nav-label, .sidebar-footer { display: none; }
    .analyzer-layout { grid-template-columns: 1fr; }
    .dash-grid { grid-template-columns: 1fr 1fr; }
  }
`;

// ─── API KEY MANAGER ──────────────────────────────────────────────────────────
// Agar upar GEMINI_API_KEY set nahi ki toh yeh banner dikhega app mein
function ApiKeyBanner({ apiKey, setApiKey }) {
  const [input, setInput] = useState(apiKey || "");
  if (apiKey && apiKey !== "YOUR_GEMINI_API_KEY_HERE") return null;
  return (
    <div className="api-banner">
      <span>🔑</span>
      <span style={{ fontSize: 12, color: "var(--accent3)", whiteSpace: "nowrap" }}>Gemini API Key:</span>
      <input className="api-input" placeholder="Paste your Gemini API key here..."
        value={input} onChange={e => setInput(e.target.value)} type="password" />
      <button className="api-save-btn" onClick={() => setApiKey(input)}>Save</button>
    </div>
  );
}

// ─── CHAT VIEW ────────────────────────────────────────────────────────────────
function ChatView({ apiKey }) {
  const [msgs, setMsgs] = useState([
    { role: "ai", text: "Namaste! 🙏 Main Gemini AI hun — Google ka free AI. Kuch bhi poochho — code, sawaal, creative writing, sab kuch!" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef();

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = useCallback(async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    const newMsgs = [...msgs, { role: "user", text: userMsg }];
    setMsgs(newMsgs);
    setLoading(true);
    try {
      // Poori conversation history bhejo taaki context rahe
      const reply = await callGemini(newMsgs, "You are a helpful, smart AI assistant. Be concise and clear.");
      setMsgs(m => [...m, { role: "ai", text: reply }]);
    } catch (e) {
      setMsgs(m => [...m, { role: "ai", text: "⚠️ Error: " + e.message + "\n\nCheck karo ki API key sahi hai!" }]);
    }
    setLoading(false);
  }, [input, loading, msgs]);

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {msgs.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            <div className="msg-avatar">{m.role === "ai" ? "G" : "U"}</div>
            <div className="msg-bubble" style={{ whiteSpace: "pre-wrap" }}>{m.text}</div>
          </div>
        ))}
        {loading && (
          <div className="msg ai">
            <div className="msg-avatar">G</div>
            <div className="msg-bubble">
              <div className="typing-indicator">
                <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="chat-input-area">
        <textarea className="chat-textarea" rows={1}
          placeholder="Message Gemini AI... (Enter to send)"
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} />
        <button className="send-btn" onClick={send} disabled={loading || !input.trim()}>
          {loading ? <div className="spinner" style={{ width: 16, height: 16 }} /> : "↑"}
        </button>
      </div>
    </div>
  );
}

// ─── VOICE VIEW ───────────────────────────────────────────────────────────────
function VoiceView() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [status, setStatus] = useState("Mic icon pe click karo bolna shuru karne ke liye");
  const [loading, setLoading] = useState(false);
  const recogRef = useRef(null);
  const latestTranscript = useRef("");

  const startListen = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setStatus("❌ Yeh browser Speech Recognition support nahi karta. Chrome use karo."); return; }
    const r = new SR();
    r.continuous = false; r.interimResults = true; r.lang = "hi-IN"; // Hindi + English dono
    r.onstart = () => { setListening(true); setStatus("🎙️ Bol raha hu... (Hindi ya English mein)"); setTranscript(""); setResponse(""); latestTranscript.current = ""; };
    r.onresult = e => {
      const t = Array.from(e.results).map(r => r[0].transcript).join("");
      setTranscript(t);
      latestTranscript.current = t;
    };
    r.onend = async () => {
      setListening(false);
      const t = latestTranscript.current;
      if (!t.trim()) { setStatus("Koi awaaz nahi aayi. Dobara try karo."); return; }
      setStatus("🤔 Gemini soch raha hai...");
      setLoading(true);
      try {
        const reply = await callGemini(
          [{ role: "user", text: t }],
          "You are a friendly voice assistant. Reply concisely, naturally, as if speaking. Keep it under 3 sentences."
        );
        setResponse(reply);
        setStatus("✅ Jawab ready! Dobara bolne ke liye click karo.");
        const utt = new SpeechSynthesisUtterance(reply);
        utt.rate = 0.95; utt.pitch = 1.05; utt.lang = "en-US";
        window.speechSynthesis.speak(utt);
      } catch (e) { setStatus("⚠️ Error: " + e.message); }
      setLoading(false);
    };
    recogRef.current = r;
    r.start();
  };

  return (
    <div className="voice-container">
      <div className="voice-orb-wrapper">
        <div className="voice-rings">
          <div className={`voice-ring ${listening ? "active" : ""}`} />
          <div className={`voice-ring ${listening ? "active" : ""}`} />
          <div className={`voice-ring ${listening ? "active" : ""}`} />
        </div>
        <div className={`voice-orb ${listening ? "listening" : ""}`}
          onClick={listening ? () => recogRef.current?.stop() : startListen}>
          {loading ? "⏳" : listening ? "🎙️" : "🎤"}
        </div>
      </div>
      <div className="voice-waveform">
        {Array.from({ length: 20 }, (_, i) => (
          <div key={i} className={`wave-bar ${listening ? "active" : ""}`}
            style={{
              height: listening ? undefined : "4px",
              animationDelay: `${(i * 0.05) % 0.5}s`,
              background: i % 2 === 0 ? "var(--accent)" : "var(--accent2)"
            }} />
        ))}
      </div>
      <div className="voice-transcript" style={{ width: "100%", maxWidth: 600 }}>
        {transcript
          ? <><span style={{ color: "var(--muted)", fontSize: 11 }}>TUMNE KAHA:  </span>{transcript}</>
          : response
          ? <><span style={{ color: "var(--accent)", fontSize: 11 }}>GEMINI BOLA:  </span>{response}</>
          : <span style={{ color: "var(--muted)" }}>Tumhari awaaz aur AI ka jawab yahan dikhega...</span>
        }
      </div>
      <div className="voice-status">{status}</div>
    </div>
  );
}

// ─── ANALYZER VIEW ────────────────────────────────────────────────────────────
const MODES = [
  { id: "summarize", label: "📝 Summarize", prompt: "Summarize this text in bullet points:" },
  { id: "sentiment", label: "❤️ Sentiment", prompt: "Analyze sentiment and emotions in detail:" },
  { id: "translate", label: "🇮🇳 Hindi mein", prompt: "Translate to Hindi:" },
  { id: "keywords", label: "🏷️ Keywords", prompt: "Extract top keywords and key phrases:" },
  { id: "rewrite", label: "✨ Rewrite Pro", prompt: "Rewrite professionally and polished:" },
  { id: "eli5", label: "🧒 Simple karo", prompt: "Explain like I'm 5 years old, very simply:" },
];

function AnalyzerView() {
  const [mode, setMode] = useState(MODES[0]);
  const [text, setText] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!text.trim() || loading) return;
    setLoading(true); setOutput("");
    try {
      const result = await callGemini([{ role: "user", text: `${mode.prompt}\n\n${text}` }]);
      setOutput(result);
    } catch (e) { setOutput("⚠️ Error: " + e.message); }
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="mode-bar">
        {MODES.map(m => (
          <button key={m.id} className={`mode-btn ${mode.id === m.id ? "active" : ""}`} onClick={() => setMode(m)}>
            {m.label}
          </button>
        ))}
      </div>
      <div className="analyzer-layout">
        <div className="analyzer-panel">
          <div className="panel-label">Input Text</div>
          <textarea className="analyzer-textarea" placeholder="Apna text yahan paste karo..."
            value={text} onChange={e => setText(e.target.value)} />
          <button className="run-btn" onClick={run} disabled={loading || !text.trim()}>
            {loading ? <span className="spinner" /> : `Run: ${mode.label}`}
          </button>
        </div>
        <div className="analyzer-panel">
          <div className="panel-label">Gemini Output</div>
          <div className="analyzer-output">
            {output || <span style={{ color: "var(--muted)" }}>Result yahan aayega...</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CODE GEN VIEW ────────────────────────────────────────────────────────────
const LANGS = ["JavaScript", "Python", "TypeScript", "Java", "C++", "Go", "Rust", "SQL", "Bash", "HTML/CSS"];

function CodeGenView() {
  const [prompt, setPrompt] = useState("");
  const [lang, setLang] = useState("JavaScript");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true); setCode("");
    try {
      const result = await callGemini([{
        role: "user",
        text: `Write ${lang} code for: ${prompt}\n\nReturn ONLY clean, well-commented, production-ready code. No explanations outside comments.`
      }]);
      setCode(result);
    } catch (e) { setCode("// Error: " + e.message); }
    setLoading(false);
  };

  const copy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="codegen-container">
      <div className="codegen-prompt">
        <span style={{ fontSize: 18 }}>⚡</span>
        <input className="codegen-input"
          placeholder="Code describe karo... jaise 'User login REST API endpoint'"
          value={prompt} onChange={e => setPrompt(e.target.value)}
          onKeyDown={e => e.key === "Enter" && generate()} />
        <select className="lang-select" value={lang} onChange={e => setLang(e.target.value)}>
          {LANGS.map(l => <option key={l}>{l}</option>)}
        </select>
        <button className="run-btn" style={{ marginTop: 0, padding: "8px 18px" }}
          onClick={generate} disabled={loading || !prompt.trim()}>
          {loading ? <span className="spinner" /> : "Generate"}
        </button>
      </div>
      <div className="code-output">
        <div className="code-header">
          <span className="code-lang-tag">{lang.toLowerCase()} • Gemini 2.0 Flash</span>
          {code && <button className="copy-btn" onClick={copy}>{copied ? "✓ Copied!" : "Copy"}</button>}
        </div>
        <div className="code-body">
          {code || <span style={{ color: "var(--muted)" }}>// Generated code yahan aayega...</span>}
        </div>
      </div>
    </div>
  );
}

// ─── IMAGE ANALYZE VIEW ───────────────────────────────────────────────────────
function ImageAnalyzeView() {
  const [imgBase64, setImgBase64] = useState(null);
  const [imgType, setImgType] = useState("image/jpeg");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragover, setDragover] = useState(false);
  const fileRef = useRef();

  const loadFile = f => {
    if (!f) return;
    setImgType(f.type || "image/jpeg");
    const reader = new FileReader();
    reader.onload = e => setImgBase64(e.target.result.split(",")[1]);
    reader.readAsDataURL(f);
    setOutput("");
  };

  const analyze = async () => {
    if (!imgBase64 || loading) return;
    setLoading(true); setOutput("");
    try {
      // Gemini Vision use kar rahe hain
      const result = await callGeminiVision(
        imgBase64, imgType,
        "Analyze this image in detail. Describe: what you see, objects, colors, mood, any text visible, and interesting insights."
      );
      setOutput(result);
    } catch (e) { setOutput("⚠️ Error: " + e.message); }
    setLoading(false);
  };

  return (
    <div className="imganalyze-container">
      <div className={`drop-zone ${dragover ? "dragover" : ""}`}
        onClick={() => fileRef.current.click()}
        onDragOver={e => { e.preventDefault(); setDragover(true); }}
        onDragLeave={() => setDragover(false)}
        onDrop={e => { e.preventDefault(); setDragover(false); loadFile(e.dataTransfer.files[0]); }}>
        {imgBase64
          ? <img src={`data:${imgType};base64,${imgBase64}`} className="preview-img" alt="preview" />
          : <><div className="drop-icon">🖼️</div><div className="drop-text">Image drop karo ya click karke upload karo<br /><span style={{ fontSize: 12, opacity: 0.6 }}>PNG, JPG, WEBP</span></div></>
        }
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => loadFile(e.target.files[0])} />
      </div>
      {imgBase64 && (
        <button className="run-btn" style={{ alignSelf: "flex-start" }} onClick={analyze} disabled={loading}>
          {loading ? <span className="spinner" /> : "🔍 Gemini Vision se Analyze karo"}
        </button>
      )}
      {output && <div className="analyze-result">{output}</div>}
    </div>
  );
}

// ─── DASHBOARD VIEW ───────────────────────────────────────────────────────────
function DashboardView({ setView }) {
  const stats = [
    { label: "FREE REQUESTS / DAY", value: "1,500", delta: "Gemini 2.0 Flash", color: "var(--accent)" },
    { label: "RATE LIMIT", value: "15/min", delta: "Free tier mein", color: "var(--accent2)" },
    { label: "AI FEATURES", value: "5", delta: "Sab free!", color: "var(--accent3)" },
  ];
  const features = [
    { icon: "💬", id: "chat", title: "AI Chat", sub: "Gemini se baat karo — context memory ke saath" },
    { icon: "🎤", id: "voice", title: "Voice Chat", sub: "Bol ke poochho — Hindi + English" },
    { icon: "🔍", id: "analyzer", title: "Text Analyzer", sub: "Summarize, Translate, Sentiment aur bahut kuch" },
    { icon: "⚡", id: "codegen", title: "Code Generator", sub: "10 languages mein instant code" },
    { icon: "🖼️", id: "image", title: "Image Analyzer", sub: "Gemini Vision se image samjho" },
  ];

  return (
    <div>
      <div className="dash-grid">
        {stats.map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-delta">{s.delta}</div>
          </div>
        ))}
      </div>
      <div style={{ marginBottom: 12, fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--muted)", letterSpacing: 1, textTransform: "uppercase" }}>
        All Features — Powered by Gemini 2.0 Flash (FREE)
      </div>
      <div className="recent-list">
        {features.map((f) => (
          <div key={f.id} className="recent-item" onClick={() => setView(f.id)}>
            <div className="recent-icon">{f.icon}</div>
            <div className="recent-info">
              <div className="recent-title">{f.title}</div>
              <div className="recent-sub">{f.sub}</div>
            </div>
            <div style={{ fontSize: 11, color: "var(--accent)", fontFamily: "var(--font-mono)" }}>Open →</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
const NAV = [
  { id: "dashboard", icon: "◈", label: "Dashboard" },
  { id: "chat", icon: "💬", label: "AI Chat" },
  { id: "voice", icon: "🎤", label: "Voice Chat" },
  { id: "analyzer", icon: "🔍", label: "Analyzer" },
  { id: "codegen", icon: "⚡", label: "Code Gen" },
  { id: "image", icon: "🖼️", label: "Image AI" },
];

const VIEW_META = {
  dashboard: { title: "Gemini AI Dashboard", sub: "Google Gemini 2.0 Flash — Free API" },
  chat: { title: "AI Chat", sub: "Gemini ke saath conversation — full context memory" },
  voice: { title: "Voice Chat", sub: "Hindi/English mein bolo — AI sunta aur bolta hai" },
  analyzer: { title: "Text Analyzer", sub: "Summarize • Translate • Sentiment • Rewrite" },
  codegen: { title: "Code Generator", sub: "Describe karo — Gemini instant code likhega" },
  image: { title: "Image Analyzer", sub: "Koi bhi image upload karo — Gemini Vision analyze karega" },
};

export default function App() {
  const [view, setView] = useState("dashboard");
  // API key runtime mein bhi set kar sakte ho agar upar hardcode nahi ki
  const [runtimeKey, setRuntimeKey] = useState(GEMINI_API_KEY);
  const meta = VIEW_META[view];

  // Runtime key ko global variable mein inject karo
  // (Yeh ek simple approach hai local development ke liye)
  if (runtimeKey && runtimeKey !== "YOUR_GEMINI_API_KEY_HERE") {
    window.__GEMINI_KEY__ = runtimeKey;
  }

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        <div className="sidebar">
          <div className="sidebar-logo">
            <div className="logo-dot" />
            <span>GeminiKit</span>
          </div>
          <nav className="nav">
            {NAV.map(n => (
              <div key={n.id} className={`nav-item ${view === n.id ? "active" : ""}`} onClick={() => setView(n.id)}>
                <span className="nav-icon">{n.icon}</span>
                <span className="nav-label">{n.label}</span>
              </div>
            ))}
          </nav>
          <div className="sidebar-footer">Gemini 2.0 Flash<br />Google AI • Free</div>
        </div>

        <div className="main">
          <div className="header">
            <div>
              <div className="header-title">{meta.title}</div>
              <div className="header-subtitle">{meta.sub}</div>
            </div>
            <div className="status-badge">
              <div className="status-dot" /> Gemini Free Tier
            </div>
          </div>
          <div className="content">
            {/* API Key banner agar key set nahi ki */}
            <ApiKeyBanner apiKey={runtimeKey} setApiKey={setRuntimeKey} />
            {view === "dashboard" && <DashboardView setView={setView} />}
            {view === "chat" && <ChatView apiKey={runtimeKey} />}
            {view === "voice" && <VoiceView />}
            {view === "analyzer" && <AnalyzerView />}
            {view === "codegen" && <CodeGenView />}
            {view === "image" && <ImageAnalyzeView />}
          </div>
        </div>
      </div>
    </>
  );
}