import React, { useState, useEffect, useContext } from 'react';
import API from '../api';
import { AuthContext } from '../contexts/AuthContext';
import { ToastContext } from '../contexts/ToastContext';

function EditUserModal({ user, onClose, onSave }) {
  const [form, setForm] = useState({ name: user.name, email: user.email });
  function change(k,v){ setForm(s=>({...s,[k]:v})); }
  return (
    <div className="card" style={{position:'fixed',left:'50%',top:'50%',transform:'translate(-50%,-50%)',zIndex:2000,width:500}}>
      <h4>Edit user</h4>
      <div style={{display:'grid',gap:8}}>
        <input className="input" value={form.name} onChange={e=>change('name',e.target.value)} />
        <input className="input" value={form.email} onChange={e=>change('email',e.target.value)} />
        <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={()=>onSave(form)}>Save</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage(){
  const { user, token } = useContext(AuthContext);
  const { push } = useContext(ToastContext);
  const [users,setUsers]=useState([]);
  const [activities,setActivities]=useState([]);
  const [q, setQ] = useState('');
  const [actQ, setActQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [editUser, setEditUser] = useState(null);

  async function loadUsers(search=''){
    try{
      const res = await API.get('/admin/users', { params: { q: search } });
      setUsers(res.data);
    }catch(e){ push(e?.response?.data?.error || e.message, { type:'error' }); }
  }
  async function loadActivities(search=''){
    try{
      const res = await API.get('/admin/activities', { params: { q: search } });
      setActivities(res.data);
    }catch(e){ push(e?.response?.data?.error || e.message, { type:'error' }); }
  }

  useEffect(()=>{ if(user?.admin) { loadUsers(); loadActivities(); } },[user]);

  if(!token) return <div className="card">Please login as admin.</div>;
  if(!user?.admin) return <div className="card">You are not admin.</div>;

  async function handleDelete(id){
    if(!confirm('Delete user? This cannot be undone.')) return;
    try{
      await API.delete(`/admin/user/${id}`);
      push('User deleted', { type: 'success' });
      loadUsers();
    }catch(e){ push(e?.response?.data?.error || e.message, { type:'error' }); }
  }

  async function handleSaveEdit(form){
    try{
      await API.put(`/admin/user/${editUser.id}`, form);
      push('User updated', { type:'success' });
      setEditUser(null);
      loadUsers();
    }catch(e){ push(e?.response?.data?.error || e.message, { type:'error' }); }
  }

  async function handleExport(){
    try{
      const res = await API.get('/admin/activities/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url; a.download = 'activities.json'; document.body.appendChild(a); a.click(); a.remove();
      push('Activities exported', { type: 'success' });
    }catch(e){ push(e?.response?.data?.error || e.message, { type:'error' }); }
  }

  return (
    <div className="card">
      <h3>Admin Dashboard</h3>

      <div style={{display:'flex',gap:12,marginTop:12,alignItems:'center'}}>
        <div style={{flex:1}}>
          <input placeholder="Search users by name or email" className="input" value={q} onChange={e=>setQ(e.target.value)} />
          <div style={{display:'flex',gap:8,marginTop:8}}>
            <button className="btn" onClick={()=>loadUsers(q)}>Search</button>
            <button className="btn" onClick={()=>{ setQ(''); loadUsers(); }}>Reset</button>
          </div>
        </div>

        <div style={{minWidth:200}}>
          <div style={{display:'flex',gap:8}}>
            <input placeholder="Filter activities" className="input" value={actQ} onChange={e=>setActQ(e.target.value)} />
            <button className="btn" onClick={()=>loadActivities(actQ)}>Filter</button>
            <button className="btn" onClick={()=>{ setActQ(''); loadActivities(); }}>Reset</button>
            <button className="btn btn-primary" onClick={handleExport}>Export Activities</button>
          </div>
        </div>
      </div>

      <div style={{display:'flex',gap:12,marginTop:16}}>
        <div style={{flex:1}}>
          <h4>Users</h4>
          {users.map(u=>(
            <div key={u.id} className="card" style={{marginBottom:8,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div><strong>{u.name}</strong> — <span className="small">{u.email}</span></div>
                <div className="small">{u.profile ? `BMI: ${u.profile.bmi} • Fitness age: ${u.profile.fitness_age}` : 'No profile'}</div>
              </div>
              <div style={{display:'flex',gap:8}}>
                <button className="btn" onClick={()=>setEditUser(u)}>Edit</button>
                <button className="btn" onClick={()=>handleDelete(u.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>

        <div style={{flex:1}}>
          <h4>Recent Activity</h4>
          <div className="activity" style={{maxHeight:400,overflow:'auto'}}>
            {activities.map(a=>(
              <div key={a.id} className="card" style={{marginBottom:8}}>
                <div className="small">{a.time} • {a.type} • {a.email}</div>
                <div className="small" style={{whiteSpace:'pre-wrap'}}>{JSON.stringify(a.details)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {editUser && <EditUserModal user={editUser} onClose={()=>setEditUser(null)} onSave={handleSaveEdit} />}
    </div>
  );
}
