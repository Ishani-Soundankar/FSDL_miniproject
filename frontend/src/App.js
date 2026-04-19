import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import "./App.css";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";
let _tid = 0;

/* ─── Toast System ─────────────────────────────────────────────────────── */
function Toasts({ list, remove }) {
  return (
    <div className="toast-container">
      {list.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`} onClick={() => remove(t.id)}>
          <span className="toast-icon">
            {t.type === "success" ? "✓" : t.type === "error" ? "✕" : "ℹ"}
          </span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Auth Page ─────────────────────────────────────────────────────────── */
function AuthPage({ onAuth, addToast }) {
  const [mode, setMode] = useState("login");
  const [busy, setBusy]   = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [err, setErr] = useState("");
  const [form, setForm] = useState({ name:"", email:"", password:"", cgpa:"", branch:"", skills:"" });

  const set = e => { setForm(p => ({ ...p, [e.target.name]: e.target.value })); setErr(""); };

  const submit = async e => {
    e.preventDefault(); setBusy(true); setErr("");
    try {
      const path = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body = mode === "login" ? { email: form.email, password: form.password } : form;
      const { data } = await axios.post(`${API}${path}`, body);
      localStorage.setItem("token", data.token);
      localStorage.setItem("studentId", data.student.id);
      localStorage.setItem("userInfo", JSON.stringify(data.student));
      onAuth(data.student, data.token);
    } catch (e) { setErr(e.response?.data?.message || "Something went wrong"); }
    finally { setBusy(false); }
  };

  const switchMode = m => { setMode(m); setErr(""); };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-logo"><span className="logo-diamond"></span>PlaceTrack</div>
          <p className="auth-tagline">Your intelligent placement management platform</p>
        </div>
        <div className="auth-features">
          {[["📋","Track placement opportunities"],["📊","Monitor application status"],["🗓️","Visualize your journey"],["📧","Parse placement emails instantly"]].map(([icon,txt]) => (
            <div className="auth-feat" key={txt}><span>{icon}</span><span>{txt}</span></div>
          ))}
        </div>
        <div className="auth-deco"><div className="deco-c1"/><div className="deco-c2"/></div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <h2 className="auth-heading">{mode === "login" ? "Welcome back 👋" : "Create account"}</h2>
          <p className="auth-sub">{mode === "login" ? "Sign in to continue" : "Join PlaceTrack today"}</p>

          <div className="auth-tabs">
            <button className={`atab${mode==="login"?" atab-active":""}`} onClick={() => switchMode("login")}>Sign In</button>
            <button className={`atab${mode==="register"?" atab-active":""}`} onClick={() => switchMode("register")}>Register</button>
          </div>

          <form onSubmit={submit} className="auth-form">
            {mode === "register" && (
              <div className="fg"><label>Full Name</label><input name="name" placeholder="Rahul Agarwal" value={form.name} onChange={set} required /></div>
            )}
            <div className="fg"><label>Email Address</label><input name="email" type="email" placeholder="you@college.edu" value={form.email} onChange={set} required /></div>
            <div className="fg">
              <label>Password</label>
              <div className="pwd-wrap">
                <input name="password" type={showPwd?"text":"password"} placeholder="••••••••" value={form.password} onChange={set} required />
                <button type="button" className="pwd-eye" onClick={() => setShowPwd(p=>!p)}>{showPwd?"🙈":"👁️"}</button>
              </div>
            </div>
            {mode === "register" && (<>
              <div className="fg-row">
                <div className="fg"><label>CGPA</label><input name="cgpa" type="number" step="0.01" min="0" max="10" placeholder="8.5" value={form.cgpa} onChange={set}/></div>
                <div className="fg"><label>Branch</label><input name="branch" placeholder="CSE" value={form.branch} onChange={set}/></div>
              </div>
              <div className="fg"><label>Skills <span className="hint">(comma-separated)</span></label><input name="skills" placeholder="React, Node.js, Python" value={form.skills} onChange={set}/></div>
            </>)}
            {err && <div className="auth-err">{err}</div>}
            <button type="submit" className="auth-btn" disabled={busy}>
              {busy ? <span className="spin-sm"/> : (mode==="login"?"Sign In →":"Create Account →")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ─── Main App ──────────────────────────────────────────────────────────── */
export default function App() {
  const [user, setUser]               = useState(null);
  const [token, setToken]             = useState(null);
  const [opportunities, setOpps]      = useState([]);
  const [applications, setApps]       = useState([]);
  const [activeTab, setTab]           = useState("opportunities");
  const [rawData, setRaw]             = useState("");
  const [editing, setEditing]         = useState(false);
  const [loadingOpps, setLoadOpps]    = useState(false);
  const [toasts, setToasts]           = useState([]);
  const [sidebarOpen, setSidebar]     = useState(false);
  const [profile, setProfile]         = useState({ name:"", email:"", cgpa:"", branch:"", skills:"" });

  /* toasts */
  const toast = useCallback((message, type="info") => {
    const id = ++_tid;
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4500);
  }, []);
  const removeToast = id => setToasts(p => p.filter(t => t.id !== id));

  /* restore session */
  useEffect(() => {
    const t = localStorage.getItem("token");
    const u = localStorage.getItem("userInfo");
    if (t && u) { const parsed = JSON.parse(u); setToken(t); setUser(parsed); syncProfile(parsed); }
  }, []);

  const syncProfile = u => setProfile({
    name: u.name||"", email: u.email||"", cgpa: u.cgpa||"", branch: u.branch||"",
    skills: Array.isArray(u.skills) ? u.skills.join(", ") : (u.skills||"")
  });

  const onAuth = (u, t) => { setUser(u); setToken(t); syncProfile(u); };

  const logout = () => {
    ["token","studentId","userInfo"].forEach(k => localStorage.removeItem(k));
    setUser(null); setToken(null); setOpps([]); setApps([]);
    toast("Logged out successfully", "success");
  };

  const hdr = () => token ? { Authorization: `Bearer ${token}` } : {};

  /* fetch data */
  const fetchOpps = useCallback(async () => {
    setLoadOpps(true);
    try { const r = await axios.get(`${API}/api/opportunities`); setOpps(r.data); }
    catch { toast("Failed to load opportunities","error"); }
    finally { setLoadOpps(false); }
  }, [toast]);

  const fetchApps = useCallback(async () => {
    const sid = localStorage.getItem("studentId"); if (!sid) return;
    try { const r = await axios.get(`${API}/api/applications/${sid}`, { headers: hdr() }); setApps(r.data); }
    catch (e) { console.error(e); }
  }, [token]);

  useEffect(() => { if (user) { fetchOpps(); fetchApps(); } }, [user]);

  /* handlers */
  const deleteOpp = async id => {
    if (!window.confirm("Remove this opportunity?")) return;
    try { await axios.delete(`${API}/api/opportunities/${id}`); setOpps(p => p.filter(o => o._id !== id)); toast("Opportunity removed","success"); }
    catch (e) { toast(e.response?.data?.message||"Delete failed","error"); }
  };

  const handleParse = async () => {
    if (!rawData.trim()) { toast("Please paste email text first","error"); return; }
    try {
      const r = await axios.post(`${API}/api/parser/parse`, { email: rawData });
      toast(`✓ Parsed: ${r.data.data.companyName}`,"success");
      setRaw(""); fetchOpps(); setTab("opportunities");
    } catch (e) { toast(e.response?.data?.message||"Parsing failed — check format","error"); }
  };

  const saveProfile = async () => {
    try {
      await axios.put(`${API}/api/auth/profile`, profile, { headers: hdr() });
      const updated = { ...user, ...profile };
      localStorage.setItem("userInfo", JSON.stringify(updated));
      setUser(updated); toast("Profile saved!","success");
    } catch (e) { toast(e.response?.data?.message||"Save failed","error"); }
  };

  /* helpers */
  const eligible = opp => {
    const cgpa = parseFloat(profile.cgpa)||0;
    return (!opp.eligibilityCGPA || cgpa >= opp.eligibilityCGPA) &&
           (!opp.branchAllowed?.length || opp.branchAllowed.includes(profile.branch));
  };

  const avgStip = () => {
    const nums = opportunities.map(o => parseInt((o.stipend||"").replace(/[^0-9]/g,""))).filter(n => !isNaN(n)&&n>0);
    if (!nums.length) return "N/A";
    return `₹${(Math.round(nums.reduce((a,b)=>a+b,0)/nums.length)/1000).toFixed(0)}K`;
  };

  const pillFor = s => ({ Shortlisted:"pill-green", Selected:"pill-green", "Under Review":"pill-purple", Applied:"pill-gray", Rejected:"pill-red" }[s]||"pill-gray");

  /* ── if not logged in ── */
  if (!user) return <><Toasts list={toasts} remove={removeToast}/><AuthPage onAuth={onAuth} addToast={toast}/></>;

  /* ── nav items ── */
  const nav = [
    { id:"opportunities", label:"Opportunities", icon:"📋", sec:"MAIN" },
    { id:"tracker",       label:"Applications",  icon:"📊", sec:"MAIN" },
    { id:"timeline",      label:"Timeline",      icon:"🗓️", sec:"MAIN" },
    { id:"parser",        label:"Email Parser",  icon:"📧", sec:"ADMIN" },
    { id:"profile",       label:"My Profile",    icon:"👤", sec:"ACCOUNT" },
  ];

  /* ── renderers ── */
  const Tab_Opps = () => (
    <div className="content-fade">
      <div className="metric-grid">
        {[["📋","Open Roles",opportunities.length],["💰","Avg Stipend",avgStip()],["✅","Eligible",opportunities.filter(eligible).length],["📨","Applied",applications.length]].map(([icon,label,val]) => (
          <div className="metric-card" key={label}><div className="metric-icon">{icon}</div><div><div className="metric-label">{label}</div><div className="metric-value">{val}</div></div></div>
        ))}
      </div>
      {loadingOpps && <div className="loading-box"><div className="spinner"/><p>Loading…</p></div>}
      {!loadingOpps && opportunities.length === 0 && (
        <div className="empty-state"><div className="empty-icon">📭</div><h3>No opportunities yet</h3><p>Use the Email Parser to add some.</p><button className="btn-primary" onClick={()=>setTab("parser")}>Open Parser</button></div>
      )}
      {opportunities.map(item => (
        <div className={`opp-card ${eligible(item)?"":"opp-dim"}`} key={item._id}>
          <div className="opp-logo">{(item.companyName?.[0]||"C").toUpperCase()}</div>
          <div className="opp-info">
            <div className="opp-top">
              <span className="opp-company">{item.companyName}</span>
              <span className="pill pill-purple">{item.role||"Intern"}</span>
              <span className={`pill ${eligible(item)?"pill-green":"pill-red"}`}>{eligible(item)?"Eligible":"Not Eligible"}</span>
            </div>
            <div className="opp-tags">
              <span className="pill pill-gray">💰 {item.stipend||"TBD"}</span>
              <span className="pill pill-gray">📅 {item.deadline ? new Date(item.deadline).toDateString() : "Open"}</span>
              {item.eligibilityCGPA && <span className="pill pill-gray">Min CGPA: {item.eligibilityCGPA}</span>}
            </div>
          </div>
          <div className="opp-right">
            <a href={item.registrationLink||"#"} target="_blank" rel="noreferrer" className="btn-primary">Apply Now</a>
            <button onClick={()=>deleteOpp(item._id)} className="btn-delete-link">Remove</button>
          </div>
        </div>
      ))}
    </div>
  );

  const Tab_Apps = () => (
    <div className="content-fade">
      <div className="section-hdr"><h2 className="section-title">My Applications</h2><span className="badge">{applications.length}</span></div>
      <div className="table-container">
        <table className="custom-table">
          <thead><tr><th>Company</th><th>Role</th><th>Status</th><th>Applied On</th></tr></thead>
          <tbody>
            {applications.length === 0
              ? <tr><td colSpan={4} className="table-empty">No applications yet.</td></tr>
              : applications.map(a => {
                  const co  = a.company||a.opportunityId?.companyName||"—";
                  const ro  = a.role||a.opportunityId?.role||"—";
                  const st  = a.status||"Applied";
                  const dt  = a.appliedAt ? new Date(a.appliedAt).toLocaleDateString() : "—";
                  return <tr key={a._id}><td><strong>{co}</strong></td><td>{ro}</td><td><span className={`pill ${pillFor(st)}`}>{st}</span></td><td className="text-muted">{dt}</td></tr>;
                })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const Tab_Timeline = () => (
    <div className="content-fade">
      <h2 className="section-title">Placement Journey</h2>
      {applications.length === 0
        ? <div className="empty-state"><div className="empty-icon">🗓️</div><h3>No events yet</h3><p>Your timeline appears once you apply.</p></div>
        : <div className="simple-timeline">{applications.map((a,i) => {
            const co = a.company||a.opportunityId?.companyName||"Company";
            const ro = a.role||a.opportunityId?.role||"Role";
            const st = a.status||"Applied";
            const dt = a.appliedAt ? new Date(a.appliedAt).toDateString() : "—";
            return (
              <div className="timeline-row" key={a._id}>
                <div className="timeline-marker">
                  <div className={`dot ${i===0?"dot-active":["Selected","Shortlisted"].includes(st)?"dot-past":""}`}/>
                  {i < applications.length-1 && <div className="line"/>}
                </div>
                <div className="timeline-details"><span className="time-tag">{dt}</span><h4>{co} — {ro}</h4><span className={`pill ${pillFor(st)}`}>{st}</span></div>
              </div>
            );
          })}</div>}
    </div>
  );

  const Tab_Parser = () => (
    <div className="content-fade">
      <h2 className="section-title">Email Parser</h2>
      <div className="parser-hint">
        <div className="hint-title">📌 Supported Format</div>
        <code>Company: Infosys{"\n"}Role: SDE Intern{"\n"}Stipend: 50000{"\n"}Deadline: 30 June 2025{"\n"}https://apply.infosys.com</code>
      </div>
      <textarea className="parser-textarea" value={rawData} onChange={e=>setRaw(e.target.value)} placeholder="Paste the placement email text here…"/>
      <div className="parser-actions">
        <button className="btn-primary" onClick={handleParse} style={{flex:1}}>Parse &amp; Add Opportunity</button>
        {rawData && <button className="btn-secondary" onClick={()=>setRaw("")}>Clear</button>}
      </div>
    </div>
  );

  const Tab_Profile = () => (
    <div className="content-fade">
      <h2 className="section-title">Student Profile</h2>
      <div className="profile-card">
        <div className="profile-header">
          <div className="large-avatar">{(profile.name||"U")[0].toUpperCase()}</div>
          <div className="profile-titles">
            {editing ? <input name="name" className="edit-input header-input" value={profile.name} onChange={e=>setProfile(p=>({...p,[e.target.name]:e.target.value}))} placeholder="Full Name"/> : <h3>{profile.name||"—"}</h3>}
            {editing ? <input name="branch" className="edit-input sub-input" value={profile.branch} onChange={e=>setProfile(p=>({...p,[e.target.name]:e.target.value}))} placeholder="Branch"/> : <p className="text-muted">{profile.branch||"—"}</p>}
          </div>
        </div>
        <div className="profile-details">
          {[["email","Email","email"],["cgpa","CGPA","number"],["skills","Skills","text"]].map(([name,label,type]) => (
            <div className="detail-row" key={name}>
              <strong>{label}</strong>
              {editing
                ? (name==="skills" ? <textarea name={name} className="edit-input" rows={2} value={profile[name]} onChange={e=>setProfile(p=>({...p,[e.target.name]:e.target.value}))}/> : <input name={name} type={type} className="edit-input" value={profile[name]} onChange={e=>setProfile(p=>({...p,[e.target.name]:e.target.value}))}/>)
                : <span>{profile[name]||"—"}</span>}
            </div>
          ))}
        </div>
        <div className="profile-actions">
          <button className={editing?"btn-primary":"btn-secondary"} onClick={()=>{ if(editing) saveProfile(); setEditing(e=>!e); }}>
            {editing?"💾 Save Changes":"✏️ Edit Profile"}
          </button>
          {editing && <button className="btn-secondary" onClick={()=>setEditing(false)}>Cancel</button>}
          <button className="btn-danger" onClick={logout}>Sign Out</button>
        </div>
      </div>
    </div>
  );

  const renderers = { opportunities:<Tab_Opps/>, tracker:<Tab_Apps/>, timeline:<Tab_Timeline/>, parser:<Tab_Parser/>, profile:<Tab_Profile/> };

  /* ── Layout ── */
  return (
    <>
      <Toasts list={toasts} remove={removeToast}/>
      {sidebarOpen && <div className="sidebar-overlay" onClick={()=>setSidebar(false)}/>}
      <div className="app">
        <aside className={`sidebar${sidebarOpen?" sidebar-open":""}`}>
          <div className="logo"><div className="logo-dot"/><span>PlaceTrack</span></div>
          {["MAIN","ADMIN","ACCOUNT"].map(sec => (
            <div key={sec}>
              <div className="nav-section">{sec}</div>
              {nav.filter(n=>n.sec===sec).map(n => (
                <div key={n.id} className={`nav-item${activeTab===n.id?" active":""}`} onClick={()=>{ setTab(n.id); setSidebar(false); }}>
                  <span className="nav-icon">{n.icon}</span>{n.label}
                </div>
              ))}
            </div>
          ))}
          <div className="sidebar-user-chip">
            <div className="chip-avatar">{(user?.name||"U")[0].toUpperCase()}</div>
            <div><div className="chip-name">{user?.name||"Student"}</div><div className="chip-role">{user?.role||"student"}</div></div>
          </div>
        </aside>

        <main className="main">
          <header className="topbar">
            <div className="topbar-left">
              <button className="hamburger" onClick={()=>setSidebar(p=>!p)}>☰</button>
              <div className="topbar-title">{nav.find(n=>n.id===activeTab)?.icon} {nav.find(n=>n.id===activeTab)?.label}</div>
            </div>
            <div className="topbar-right">
              <button className="refresh-btn" onClick={fetchOpps} title="Refresh">↻</button>
              <div className="user-chip" onClick={()=>setTab("profile")}>
                <div className="chip-avatar sm">{(user?.name||"U")[0].toUpperCase()}</div>
                <span className="user-name">{user?.name?.split(" ")[0]||"User"}</span>
              </div>
            </div>
          </header>
          <div className="content">{renderers[activeTab]}</div>
        </main>
      </div>
    </>
  );
}