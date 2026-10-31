import React, { useEffect, useMemo, useState } from 'react';
import { supabase, isConfigured } from './supabase';
import {
  ArrowUpRight, Github, Linkedin, Mail, Menu, X, Plus, LockKeyhole,
  LogOut, Pencil, Trash2, ExternalLink, Sparkles, Code2, GraduationCap,
  BriefcaseBusiness, Award, FolderGit2, ShieldCheck, Eye, UploadCloud,
  ChevronRight, Download, FileText
} from 'lucide-react';

const profile = {
  name: 'Satyam Pratap',
  role: 'Computer Science Student · Developer · Technology Enthusiast',
  intro: 'I build practical digital experiences and explore how software, data and AI can solve real-world problems.',
  location: 'Gorakhpur, India',
  degree: 'B.Sc. (Honors) Computer Science',
  university: 'Deen Dayal Upadhyaya Gorakhpur University',
  period: '2024 — 2028',
  github: 'https://github.com/spsingh2311',
  portfolio: 'https://spsingh2311.github.io/portfolio-website/'
};

const categories = [
  ['certificates','Certificates'],['internships','Internships & Offer Letters'],
  ['education','Education & Academic Records'],['projects','Projects'],
  ['achievements','Achievements'],['skills','Skills & Certifications'],
  ['experience','Experience'],['other','Other Documents']
];
const icons = {projects:FolderGit2, certificates:Award, internships:BriefcaseBusiness, education:GraduationCap, achievements:Sparkles, skills:Code2, experience:BriefcaseBusiness, other:FileText};
const demoItems = [
  {id:'demo1',title:'Spam Email Detection',category:'projects',organization:'Machine Learning Project',date:'2026',description:'A machine learning project using TF-IDF and Logistic Regression to classify spam and legitimate emails. Add the live demo, repository and project screenshots from the admin panel.',tags:['Python','Machine Learning','TF-IDF'],link:'https://spsingh2311.github.io/spam-email-detection/'},
  {id:'demo2',title:'Advanced Scientific Calculator',category:'projects',organization:'Web Development Project',date:'2026',description:'A JavaScript-based scientific calculator featuring a broad set of mathematical operations and a responsive interface.',tags:['HTML','CSS','JavaScript'],link:'https://github.com/spsingh2311/Advanced-Scientific-Calculator-Web-App'},
  {id:'demo3',title:'Smart Water Leakage Detection & Monitoring System',category:'projects',organization:'Sustainability · Applied AI',date:'2026',description:'A campus-focused concept to monitor water flow, detect unusual patterns and alert maintenance teams so potential leakage can be checked quickly.',tags:['IoT Concept','Anomaly Detection','Sustainability']},
  {id:'demo4',title:'Web Development',category:'skills',organization:'Technical Skills',date:'',description:'HTML · CSS · JavaScript · React fundamentals · Responsive UI development',tags:['Frontend','Web']},
  {id:'demo5',title:'Programming & Data',category:'skills',organization:'Technical Skills',date:'',description:'C · C++ · Java · Python fundamentals · SQL · MySQL · Problem Solving',tags:['Programming','Database']}
];

function App(){
  const [items,setItems]=useState(demoItems), [session,setSession]=useState(null), [adminOpen,setAdminOpen]=useState(false);
  const [loginOpen,setLoginOpen]=useState(false), [active,setActive]=useState('all'), [mobile,setMobile]=useState(false);
  const [editing,setEditing]=useState(null), [toast,setToast]=useState(''), [loading,setLoading]=useState(false);
  const [search,setSearch]=useState('');
  const admin=!!session?.user;
  useEffect(()=>{
    if(!isConfigured) return;
    supabase.auth.getSession().then(({data})=>setSession(data.session));
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_e,s)=>setSession(s));
    return ()=>subscription.unsubscribe();
  },[]);
  useEffect(()=>{if(isConfigured) loadItems();},[]);
  async function loadItems(){
    const {data,error}=await supabase.from('portfolio_items').select('*').eq('published',true).order('created_at',{ascending:false});
    if(!error && data) setItems(data.length ? data : demoItems);
  }
  function notify(msg){setToast(msg);setTimeout(()=>setToast(''),3200);}
  async function login(e){
    e.preventDefault(); setLoading(true);
    const fd=new FormData(e.currentTarget);
    const {error}=await supabase.auth.signInWithPassword({email:fd.get('email'),password:fd.get('password')});
    setLoading(false); if(error) notify(error.message); else {setLoginOpen(false);setAdminOpen(true);notify('Admin login successful.');}
  }
  async function logout(){await supabase.auth.signOut();setAdminOpen(false);notify('Logged out.');}
  async function saveItem(e){
    e.preventDefault(); if(!admin)return;
    setLoading(true);
    const fd=new FormData(e.currentTarget), file=fd.get('file');
    const payload={title:fd.get('title'),category:fd.get('category'),organization:fd.get('organization'),date:fd.get('date')||null,description:fd.get('description'),link:fd.get('link')||null,tags:String(fd.get('tags')||'').split(',').map(x=>x.trim()).filter(Boolean),published:true};
    if(file && file.size){
      const ext=file.name.split('.').pop().toLowerCase();
      const path=`${session.user.id}/${crypto.randomUUID()}.${ext}`;
      const {error:upErr}=await supabase.storage.from('portfolio-private').upload(path,file,{upsert:false});
      if(upErr){setLoading(false);notify(upErr.message);return;}
      payload.file_path=path; payload.file_name=file.name; payload.file_type=file.type;
    }
    let result;
    if(editing?.id && !String(editing.id).startsWith('demo')) result=await supabase.from('portfolio_items').update(payload).eq('id',editing.id);
    else result=await supabase.from('portfolio_items').insert({...payload,owner_id:session.user.id});
    setLoading(false);
    if(result.error){notify(result.error.message);return;}
    setEditing(null);await loadItems();notify('Your portfolio item has been published.');
  }
  async function removeItem(item){
    if(!admin || !confirm(`Delete “${item.title}”?`))return;
    if(item.file_path) await supabase.storage.from('portfolio-private').remove([item.file_path]);
    const {error}=await supabase.from('portfolio_items').delete().eq('id',item.id);
    if(error)notify(error.message);else{await loadItems();notify('Item deleted.');}
  }
  async function preview(item){
    if(!item.file_path){notify('No document attached to this item yet.');return;}
    const {data,error}=await supabase.functions.invoke('create-preview',{body:{path:item.file_path}});
    if(error || !data?.url){notify('Preview function is not deployed yet. See README setup steps.');return;}
    window.open(data.url,'_blank','noopener,noreferrer');
  }
  const filtered=useMemo(()=>items.filter(x=>(active==='all'||x.category===active)&&(`${x.title} ${x.description||''} ${x.organization||''}`).toLowerCase().includes(search.toLowerCase())),[items,active,search]);
  const counts=useMemo(()=>Object.fromEntries(categories.map(([k])=>[k,items.filter(i=>i.category===k).length])),[items]);
  return <div className="app">
    <header className="topbar"><a className="brand" href="#home"><span className="brand-mark">SP</span><span>SATYAM<span className="brand-dot">.</span></span></a>
      <nav className={mobile?'nav open':'nav'}>{[['Home','#home'],['About','#about'],['Portfolio','#portfolio'],['Contact','#contact']].map(([t,h])=><a key={t} href={h} onClick={()=>setMobile(false)}>{t}</a>)}</nav>
      <div className="top-actions"><button className="admin-trigger" onClick={()=>admin?setAdminOpen(!adminOpen):setLoginOpen(true)}>{admin?<><LockKeyhole size={15}/> Admin</>:<><LockKeyhole size={15}/> Admin Login</>}</button><button className="menu-btn" onClick={()=>setMobile(!mobile)} aria-label="Toggle menu">{mobile?<X/>:<Menu/>}</button></div>
    </header>
    <main>
      <section className="hero section-wrap" id="home">
        <div className="hero-copy"><div className="eyebrow"><span className="pulse"/> PERSONAL PORTFOLIO · 2026</div><h1>Building ideas<br/>into <em>impact.</em></h1>
          <p className="hero-role">{profile.role}</p><p className="hero-intro">{profile.intro}</p>
          <div className="hero-buttons"><a className="btn primary" href="#portfolio">Explore my work <ArrowUpRight size={17}/></a><a className="btn secondary" href="#contact">Get in touch</a></div>
          <div className="social-row"><a href={profile.github} target="_blank" rel="noreferrer"><Github size={17}/> GitHub</a><span>·</span><a href="#contact"><Mail size={17}/> Contact</a></div>
        </div>
        <div className="hero-visual"><div className="orbit orbit-one"></div><div className="orbit orbit-two"></div><div className="profile-card"><div className="avatar">SP</div><div className="profile-caption"><span className="online-dot"></span> Open to learning & opportunities</div><div className="profile-lines"><i/><i/><i/></div></div><div className="float-chip chip-top"><Code2 size={16}/> Code · Create · Learn</div><div className="float-chip chip-bottom"><Sparkles size={16}/> Curious by nature</div></div>
        <div className="hero-foot"><span>SCROLL TO EXPLORE</span><span className="scroll-line"></span><span>01 / 04</span></div>
      </section>
      <section className="about section-wrap" id="about"><div className="section-label">01 — ABOUT ME</div><div className="about-grid"><div><h2>Curious mind.<br/><em>Practical builder.</em></h2></div><div className="about-text"><p>I’m a Computer Science undergraduate at Deen Dayal Upadhyaya Gorakhpur University. I enjoy learning how technology works and turning that knowledge into useful projects. My interests include web development, programming, databases and applied AI.</p><div className="facts"><div><span>EDUCATION</span><b>{profile.degree}</b></div><div><span>UNIVERSITY</span><b>{profile.university}</b></div><div><span>DURATION</span><b>{profile.period}</b></div><div><span>LOCATION</span><b>{profile.location}</b></div></div></div></div></section>
      <section className="portfolio section-wrap" id="portfolio"><div className="section-label">02 — THE PORTFOLIO</div><div className="portfolio-heading"><div><h2>My journey,<br/><em>all in one place.</em></h2><p>Projects, credentials, milestones and everything I’m building along the way.</p></div>{admin&&<button className="btn primary add-main" onClick={()=>setEditing({})}><Plus size={17}/> Add new item</button>}</div>
        <div className="portfolio-layout"><aside className="filters"><button className={active==='all'?'filter active':'filter'} onClick={()=>setActive('all')}>All items <span>{items.length}</span></button>{categories.map(([k,label])=><button key={k} className={active===k?'filter active':'filter'} onClick={()=>setActive(k)}>{label}<span>{counts[k]||0}</span></button>)}</aside>
          <div className="items-area"><div className="items-toolbar"><span>{filtered.length} ITEMS</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search portfolio..." aria-label="Search portfolio"/></div>
            <div className="cards">{filtered.map(item=>{const Icon=icons[item.category]||FileText;return <article className="item-card" key={item.id}><div className="card-top"><span className="item-icon"><Icon size={19}/></span><span className="category-label">{categories.find(c=>c[0]===item.category)?.[1]||item.category}</span>{admin&&<div className="card-admin"><button title="Edit" onClick={()=>setEditing(item)}><Pencil size={15}/></button><button title="Delete" onClick={()=>removeItem(item)}><Trash2 size={15}/></button></div>}</div><h3>{item.title}</h3><div className="organization">{item.organization||'Personal portfolio'} {item.date&&`· ${item.date}`}</div><p>{item.description}</p>{item.tags?.length>0&&<div className="tags">{item.tags.map(t=><span key={t}>{t}</span>)}</div>}<div className="card-bottom">{item.file_path&&<button className="text-link" onClick={()=>preview(item)}><Eye size={15}/> View document</button>}{item.link&&<a className="text-link" href={item.link} target="_blank" rel="noreferrer">Open link <ArrowUpRight size={15}/></a>}{!item.file_path&&!item.link&&<span className="text-muted">Portfolio entry</span>}</div></article>})}
            {filtered.length===0&&<div className="empty-state"><FileText size={30}/><h3>Nothing here yet</h3><p>New items will appear in this section when published.</p>{admin&&<button className="btn primary" onClick={()=>setEditing({category:active==='all'?'certificates':active})}><Plus size={16}/> Add first item</button>}</div>}</div>
          </div>
        </div>
      </section>
      <section className="contact section-wrap" id="contact"><div className="section-label">03 — CONTACT</div><div className="contact-panel"><div><div className="eyebrow">HAVE A PROJECT OR OPPORTUNITY?</div><h2>Let’s make<br/><em>something meaningful.</em></h2></div><div className="contact-links"><a href="mailto:hello@example.com"><Mail size={18}/> Email me <ArrowUpRight size={17}/></a><a href={profile.github} target="_blank" rel="noreferrer"><Github size={18}/> GitHub <ArrowUpRight size={17}/></a></div></div></section>
    </main>
    <footer><a className="brand" href="#home"><span className="brand-mark">SP</span><span>SATYAM<span className="brand-dot">.</span></span></a><span>Designed to grow with the journey. © {new Date().getFullYear()} Satyam Pratap</span><a href="#home">Back to top ↑</a></footer>
    {adminOpen&&admin&&<div className="admin-banner"><div><ShieldCheck size={18}/><b>Admin mode is active</b><span>You can add, edit and remove portfolio entries.</span></div><button onClick={logout}><LogOut size={16}/> Sign out</button><button className="banner-close" onClick={()=>setAdminOpen(false)}><X size={16}/></button></div>}
    {loginOpen&&<div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&setLoginOpen(false)}><form className="modal login-modal" onSubmit={login}><button type="button" className="modal-close" onClick={()=>setLoginOpen(false)}><X/></button><div className="modal-icon"><LockKeyhole/></div><div className="section-label">PRIVATE AREA</div><h2>Admin sign in</h2><p>Only the portfolio owner can manage content.</p>{!isConfigured&&<div className="notice">Connect your Supabase project first. Follow the README setup guide.</div>}<label>Email address<input name="email" type="email" required placeholder="admin@example.com"/></label><label>Password<input name="password" type="password" required placeholder="Your password"/></label><button className="btn primary full" disabled={!isConfigured||loading}>{loading?'Signing in…':'Sign in securely'} <ArrowUpRight size={16}/></button></form></div>}
    {editing&&admin&&<div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&setEditing(null)}><form className="modal edit-modal" onSubmit={saveItem}><button type="button" className="modal-close" onClick={()=>setEditing(null)}><X/></button><div className="section-label">PORTFOLIO MANAGER</div><h2>{editing.id?'Edit item':'Add to your portfolio'}</h2><p>Publish a certificate, project, academic record, internship or any milestone.</p><label>Title *<input name="title" required defaultValue={editing.title||''} placeholder="e.g. Microsoft AI Fundamentals"/></label><div className="form-row"><label>Section *<select name="category" defaultValue={editing.category||'certificates'}>{categories.map(([k,l])=><option key={k} value={k}>{l}</option>)}</select></label><label>Issue / completion date<input name="date" type="text" defaultValue={editing.date||''} placeholder="e.g. May 2026"/></label></div><label>Organization / Institution<input name="organization" defaultValue={editing.organization||''} placeholder="e.g. Microsoft, DDU Gorakhpur University"/></label><label>Description / About<textarea name="description" rows="4" defaultValue={editing.description||''} placeholder="Write a short description of this achievement..."/></label><label>Tags (comma separated)<input name="tags" defaultValue={(editing.tags||[]).join(', ')} placeholder="AI, Cloud, Beginner"/></label><label>External link<input name="link" type="url" defaultValue={editing.link||''} placeholder="https://..."/></label><label className="upload-box"><UploadCloud size={21}/><b>Attach certificate or document</b><span>PDF, JPG or PNG · Keep files under 10 MB</span><input name="file" type="file" accept=".pdf,.png,.jpg,.jpeg" /></label>{editing.file_name&&<div className="attached"><FileText size={16}/> Existing file: {editing.file_name}</div>}<div className="form-actions"><button type="button" className="btn secondary" onClick={()=>setEditing(null)}>Cancel</button><button className="btn primary" disabled={loading}>{loading?'Saving…':'Publish item'} <ArrowUpRight size={16}/></button></div></form></div>}
    {toast&&<div className="toast">{toast}</div>}
    <div className="security-note">Document previews are access-controlled where configured. No website can guarantee prevention of screenshots or screen recording.</div>
  </div>
}
export default App;
