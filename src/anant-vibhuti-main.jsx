import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import { Heart, CalendarDays, Users, Download, Search, LogOut, CheckCircle2, Sparkles, LockKeyhole, ArrowLeft, LoaderCircle } from 'lucide-react';
import './styles.css';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
const EVENTS = [
  { id: 'event_8', label: '8 March 2027', detail: 'First function' },
  { id: 'event_9', label: '9 March 2027', detail: 'Second function' },
  { id: 'event_10', label: '10 March 2027', detail: 'Wedding' },
];

function App() {
  const [page, setPage] = useState(location.hash === '#admin' ? 'admin' : 'rsvp');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ full_name:'', phone:'', family_name:'', attendance:'yes', adults:'2', children:'0', events:['event_8','event_9','event_10'], dietary:'', notes:'' });
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const onHash = () => setPage(location.hash === '#admin' ? 'admin' : 'rsvp');
    window.addEventListener('hashchange', onHash);
    if (supabase) {
      supabase.auth.getSession().then(({data}) => setSession(data.session));
      const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
      return () => { window.removeEventListener('hashchange', onHash); listener.subscription.unsubscribe(); };
    }
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => { if (session && page === 'admin') loadRows(); }, [session, page]);
  const setField = (key, value) => setForm(old => ({...old, [key]: value}));
  const toggleEvent = id => setForm(old => ({...old, events: old.events.includes(id) ? old.events.filter(x=>x!==id) : [...old.events,id]}));

  async function submitRSVP(e) {
    e.preventDefault();
    if (!supabase) return setStatus('App setup is incomplete. Please configure the database before accepting responses.');
    if (form.attendance === 'yes' && form.events.length === 0) return setStatus('Please select at least one event.');
    setLoading(true); setStatus('');
    const payload = {
      full_name: form.full_name.trim(), phone: form.phone.trim(), family_name: form.family_name.trim() || null,
      attendance: form.attendance, adults: form.attendance === 'yes' ? Number(form.adults) : 0,
      children: form.attendance === 'yes' ? Number(form.children) : 0,
      events: form.attendance === 'yes' ? form.events : [], dietary: form.dietary || null, notes: form.notes.trim() || null
    };
    const { error } = await supabase.from('wedding_rsvps').insert(payload);
    setLoading(false);
    if (error) setStatus(error.message.includes('Failed to fetch') ? 'Network error. Please try again.' : 'We could not save your response. Please try again or contact the hosts.');
    else setSubmitted(true);
  }

  async function signIn(e) {
    e.preventDefault(); setLoading(true); setStatus('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false); if (error) setStatus('Unable to sign in. Check your admin email and password.');
  }
  async function loadRows() {
    const { data, error } = await supabase.from('wedding_rsvps').select('*').order('created_at', {ascending:false});
    if (error) setStatus('Could not load responses. Check the database policies.'); else { setRows(data || []); setStatus(''); }
  }
  async function signOut() { await supabase.auth.signOut(); setRows([]); }
  async function updateAttendance(id, attendance) {
    const { error } = await supabase.from('wedding_rsvps').update({attendance, adults: attendance === 'yes' ? 1 : 0, children: 0, events: attendance === 'yes' ? EVENTS.map(x=>x.id) : []}).eq('id', id);
    if (error) setStatus('Could not update this response.'); else loadRows();
  }
  const filtered = useMemo(() => rows.filter(r => (filter === 'all' || r.attendance === filter) && `${r.full_name} ${r.family_name||''} ${r.phone}`.toLowerCase().includes(query.toLowerCase())), [rows,filter,query]);
  const yes = rows.filter(r=>r.attendance==='yes');
  const no = rows.filter(r=>r.attendance==='no');
  const maybe = rows.filter(r=>r.attendance==='maybe');
  const headcount = yes.reduce((s,r)=>s+(r.adults||0)+(r.children||0),0);
  const exportCSV = () => {
    const headers = ['Name','Phone','Family','Status','Adults','Children','Events','Dietary','Notes','Submitted'];
    const values = filtered.map(r=>[r.full_name,r.phone,r.family_name,r.attendance,r.adults,r.children,(r.events||[]).map(id=>EVENTS.find(e=>e.id===id)?.label||id).join('; '),r.dietary,r.notes,r.created_at]);
    const csv = [headers,...values].map(row=>row.map(v=>`"${String(v??'').replaceAll('"','""')}"`).join(',')).join('\n');
    const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'})); a.download='wedding-rsvp-guest-list.csv'; a.click(); URL.revokeObjectURL(a.href);
  };

  if (page === 'admin') return <main className="admin-shell">
    <header className="admin-top"><button className="text-button" onClick={()=>location.hash=''}><ArrowLeft size={16}/> Guest page</button><span className="mini-brand">A <Heart size={13}/> V</span></header>
    {!supabase ? <div className="panel narrow"><h2>Setup required</h2><p>Configure your Supabase project using the deployment guide before using the admin dashboard.</p></div> : !session ? <form className="panel narrow login" onSubmit={signIn}><div className="icon-circle"><LockKeyhole/></div><p className="eyebrow">PRIVATE ACCESS</p><h1>Admin login</h1><p className="muted">Sign in to view and manage wedding responses.</p><label>Admin email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label><label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required/></label>{status&&<p className="error">{status}</p>}<button className="primary full" disabled={loading}>{loading?'Signing in…':'Sign in'}</button></form> : <section className="dashboard">
      <div className="dash-heading"><div><p className="eyebrow">WEDDING MANAGEMENT</p><h1>Guest dashboard</h1><p className="muted">Anant & Vibhuti · 8–10 March 2027 · Live RSVP responses</p></div><button className="outline" onClick={signOut}><LogOut size={15}/> Sign out</button></div>
      {status&&<p className="error">{status}</p>}
      <div className="stats"><Stat label="Total responses" value={rows.length}/><Stat label="Attending" value={yes.length} tone="green"/><Stat label="Not attending" value={no.length} tone="red"/><Stat label="Maybe" value={maybe.length} tone="gold"/><Stat label="Expected headcount" value={headcount} tone="green"/></div>
      <div className="panel event-panel"><h3>Event-wise confirmed headcount</h3><div className="event-stats">{EVENTS.map(ev=><div key={ev.id}><span>{ev.label}</span><strong>{yes.filter(r=>(r.events||[]).includes(ev.id)).reduce((s,r)=>s+(r.adults||0)+(r.children||0),0)}</strong></div>)}</div></div>
      <div className="list-head"><div><h2>Guest responses</h2><p className="muted">Search, filter and export your guest list.</p></div><button className="outline" onClick={exportCSV}><Download size={16}/> Export CSV</button></div>
      <div className="toolbar"><div className="search"><Search size={16}/><input placeholder="Search name, family or phone" value={query} onChange={e=>setQuery(e.target.value)}/></div><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All responses</option><option value="yes">Attending</option><option value="no">Not attending</option><option value="maybe">Maybe</option></select><button className="outline" onClick={loadRows}>Refresh</button></div>
      <div className="table-wrap"><table><thead><tr><th>Guest</th><th>Contact</th><th>Status</th><th>Headcount</th><th>Events</th><th>Notes</th></tr></thead><tbody>{filtered.map(r=><tr key={r.id}><td><strong>{r.full_name}</strong><small>{r.family_name||'—'}</small></td><td>{r.phone}</td><td><span className={`status ${r.attendance}`}>{r.attendance}</span><select className="tiny-select" value={r.attendance} onChange={e=>updateAttendance(r.id,e.target.value)}><option value="yes">Attending</option><option value="no">Not attending</option><option value="maybe">Maybe</option></select></td><td>{(r.adults||0)} adults · {(r.children||0)} children</td><td>{(r.events||[]).map(id=>EVENTS.find(x=>x.id===id)?.label||id).join(', ')||'—'}</td><td>{[r.dietary,r.notes].filter(Boolean).join(' · ')||'—'}</td></tr>)}{filtered.length===0&&<tr><td colSpan="6" className="empty">No responses found.</td></tr>}</tbody></table></div>
      <p className="footnote">For privacy, only signed-in administrators can view the guest list. Guest submissions are stored securely in your Supabase database.</p>
    </section>}
  </main>;

  return <main className="page-shell"><div className="invite-card">
    <div className="floral-corner floral-left" aria-hidden="true">❀</div><div className="floral-corner floral-right" aria-hidden="true">✿</div><div className="ornament top-ornament">✿　❀　✿</div><div className="monogram">A <Heart size={17}/> V</div><p className="eyebrow">TOGETHER WITH THEIR FAMILIES</p><h1>Anant <span>&</span><br/>Vibhuti</h1><div className="flourish">— ✧ —</div><p className="invite-line">Joyfully invite you to celebrate<br/>their wedding festivities</p><div className="date-pill"><CalendarDays size={16}/> 8 – 10 March 2027</div><p className="event-intro">Three days of love, laughter & celebration</p>
    <div className="form-divider"><span>❀</span></div>
    {!supabase ? <div className="setup-warning">The RSVP app is ready for configuration. Follow the included setup guide to connect the database and publish it.</div> : submitted ? <div className="success-state"><div className="success-icon"><CheckCircle2 size={30}/></div><h2>Thank you!</h2><p>Your response has been received. We look forward to celebrating with you.</p><button className="outline" onClick={()=>{setSubmitted(false);setForm({full_name:'',phone:'',family_name:'',attendance:'yes',adults:'2',children:'0',events:['event_8','event_9','event_10'],dietary:'',notes:''});}}>Submit another response</button></div> : <form className="rsvp-form" onSubmit={submitRSVP}>
      <div className="form-title"><Sparkles size={15}/><span>KINDLY RESPOND</span><Sparkles size={15}/></div>
      <label>Full name <b>*</b><input value={form.full_name} onChange={e=>setField('full_name',e.target.value)} placeholder="Enter your name" required maxLength="100"/></label>
      <label>Mobile number <b>*</b><input type="tel" value={form.phone} onChange={e=>setField('phone',e.target.value)} placeholder="Your contact number" required maxLength="20"/></label>
      <label>Family / group name <span className="optional">Optional</span><input value={form.family_name} onChange={e=>setField('family_name',e.target.value)} placeholder="e.g. Sharma Family" maxLength="100"/></label>
      <fieldset><legend>Will you be joining us? <b>*</b></legend><div className="choice-row">{[['yes','Joyfully accept'],['no','Regretfully decline'],['maybe','Not sure yet']].map(([v,l])=><button type="button" key={v} className={`choice ${form.attendance===v?'selected':''}`} onClick={()=>setField('attendance',v)}>{form.attendance===v&&<CheckCircle2 size={14}/>} {l}</button>)}</div></fieldset>
      {form.attendance==='yes'&&<><fieldset><legend>Which celebrations will you attend? <b>*</b></legend><div className="event-choices">{EVENTS.map(ev=><label className="check-option" key={ev.id}><input type="checkbox" checked={form.events.includes(ev.id)} onChange={()=>toggleEvent(ev.id)}/><span><strong>{ev.label}</strong><small>{ev.detail}</small></span></label>)}</div></fieldset>
      <div className="two-fields"><label>Adults<input type="number" min="1" max="30" value={form.adults} onChange={e=>setField('adults',e.target.value)}/></label><label>Children<input type="number" min="0" max="30" value={form.children} onChange={e=>setField('children',e.target.value)}/></label></div>
      <label>Dietary preferences <span className="optional">Optional</span><select value={form.dietary} onChange={e=>setField('dietary',e.target.value)}><option value="">Select if applicable</option><option>Vegetarian</option><option>Vegan</option><option>Jain</option><option>No preference</option><option>Other – mention in notes</option></select></label></>}
      <label>Additional notes <span className="optional">Optional</span><textarea rows="2" value={form.notes} onChange={e=>setField('notes',e.target.value)} placeholder="Any message or special requirements?" maxLength="500"/></label>
      {status&&<p className="error">{status}</p>}<button className="primary full submit" disabled={loading}>{loading?<><LoaderCircle className="spin" size={17}/> Submitting…</>:'Submit RSVP'} <Heart size={15}/></button>
    </form>}
    <div className="bottom-note">WITH LOVE, ANANT & VIBHUTI</div><div className="ornament">✿　❀　✿</div>
  </div><footer className="site-footer"><a href="#admin">Admin access</a><span>Made with love</span></footer></main>;
}
function Stat({label,value,tone}) { return <div className="stat-card"><span>{label}</span><strong className={tone||''}>{value}</strong></div>; }

createRoot(document.getElementById('root')).render(<App/>);
