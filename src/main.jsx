import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import { Heart, CalendarDays, Users, Download, Search, LogOut, CheckCircle2, Sparkles, LockKeyhole, ArrowLeft, LoaderCircle } from 'lucide-react';
import RsvpDialog from './RsvpDialog.jsx';
import './styles.css';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
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
  const [rsvpOpen, setRsvpOpen] = useState(false);
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
    {!supabase ? <div className="setup-warning">RSVPs are not available yet. Please check back soon.</div> : <div className="rsvp-cta"><p className="muted">Kindly let us know if you can make it.</p><button type="button" className="primary rsvp-button" onClick={()=>setRsvpOpen(true)}>RSVP <Heart size={15}/></button></div>}
    <div className="bottom-note">WITH LOVE, ANANT & VIBHUTI</div><div className="ornament">✿　❀　✿</div>
  </div>{supabase&&<RsvpDialog open={rsvpOpen} onClose={()=>setRsvpOpen(false)} supabase={supabase} eventIds={EVENTS.map(e=>e.id)}/>}<footer className="site-footer"><a href="#admin">Admin access</a><span>Made with love</span></footer></main>;
}
function Stat({label,value,tone}) { return <div className="stat-card"><span>{label}</span><strong className={tone||''}>{value}</strong></div>; }

createRoot(document.getElementById('root')).render(<App/>);
