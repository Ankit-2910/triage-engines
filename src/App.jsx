import {useState} from 'react';
import './App.css';
function App(){
  const [queue,setQueue]=useState('');
  const [tickets,setTickets]=useState(0);
  return <div className="app-container">
    <header style={{padding:'30px',background:'#1a1a1a',borderBottom:'1px solid #333'}}>
      <h1 style={{fontSize:'28px',color:'#84cc16',marginBottom:'5px'}}>Triage Engine</h1>
      <p style={{fontSize:'12px',color:'#888'}}>AI OPERATIONS INBOX INTELLIGENCE</p>
    </header>
    <main style={{maxWidth:'1200px',margin:'0 auto',padding:'40px'}}>
      <label style={{display:'block',marginBottom:'15px',fontSize:'12px',color:'#888',textTransform:'uppercase'}}>RAW QUEUE</label>
      <textarea className="queue-textarea" value={queue} onChange={(e)=>setQueue(e.target.value)} placeholder="Paste support tickets..."/>
      <div style={{display:'flex',gap:'12px',marginBottom:'40px',flexWrap:'wrap'}}>
        <button className="btn btn-primary" onClick={()=>setTickets(queue.split('\n').filter(l=>l.trim()).length)}>▶ Run Triage</button>
        <button className="btn btn-secondary" onClick={()=>setQueue('Sample ticket 1\n---\nSample ticket 2\n---\nSample ticket 3')}>Load Sample</button>
        <button className="btn btn-secondary" onClick={()=>alert('File upload coming soon!')}>➕ Add Files</button>
        <button className="btn btn-tertiary" onClick={()=>{setQueue('');setTickets(0);}}>Clear</button>
        <span style={{marginLeft:'auto',color:'#888'}}>{tickets} tickets detected</span>
      </div>
    </main>
  </div>;
}
export default App;
