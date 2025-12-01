import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

export default function AuthPage(){
  const { login, signup } = useContext(AuthContext);
  const [mode,setMode] = useState('login');
  const [email,setEmail]=useState(''), [password,setPassword]=useState(''), [name,setName]=useState('');
  const nav = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || '/profile';

  async function submit(e){
    e.preventDefault();
    try{
      if(mode==='login'){
        const res = await login(email,password);
        if(res.admin) nav('/admin'); else nav(redirectTo);
      } else {
        await signup(name,email,password);
        nav(redirectTo);
      }
    }catch(err){ alert(err?.response?.data?.error || err?.response?.data?.errors?.[0]?.msg || err.message); }
  }
  return (
    <div className="card" style={{maxWidth:520, margin:'0 auto'}}>
      <h3>{mode==='login'?'Login':'Sign Up'}</h3>
      <form onSubmit={submit} style={{display:'grid',gap:8}}>
        {mode==='signup' && <input required className="input" placeholder="Full name" value={name} onChange={e=>setName(e.target.value)} />}
        <input required className="input" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input required className="input" placeholder="Password (min 6 chars)" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <div style={{display:'flex',gap:8}}>
          <button className="btn" type="submit">{mode==='login'?'Login':'Create'}</button>
          <button type="button" className="btn" onClick={()=>setMode(mode==='login'?'signup':'login')}>Switch</button>
        </div>
      </form>
      <p className="small notice" style={{marginTop:12}}>Admin: login with admin@fitnessmvp.com and admin password (set in server/.env)</p>
    </div>
  );
}
