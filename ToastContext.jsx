import React, { createContext, useState, useCallback } from 'react';

export const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((msg, opts = {}) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2,7);
    const toast = { id, msg, type: opts.type || 'info', ttl: opts.ttl || 4000 };
    setToasts(t => [...t, toast]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), toast.ttl);
  }, []);

  const remove = useCallback(id => setToasts(t => t.filter(x => x.id !== id)), []);

  return (
    <ToastContext.Provider value={{ push, remove }}>
      {children}
      <div style={{ position:'fixed', right:16, bottom:16, zIndex:9999, display:'flex', flexDirection:'column', gap:8 }}>
        {toasts.map(t => <Toast key={t.id} toast={t} onClose={() => remove(t.id)} />)}
      </div>
    </ToastContext.Provider>
  );
}

function Toast({ toast, onClose }) {
  const color = toast.type === 'error' ? '#ff6b6b' : (toast.type === 'success' ? '#56d364' : '#0f6ed4');
  return (
    <div style={{
      minWidth:220,
      background:'rgba(12,24,40,0.95)',
      color:'#fff',
      padding:'10px 12px',
      borderRadius:8,
      boxShadow:'0 8px 20px rgba(0,0,0,0.45)',
      border:`1px solid ${color}`
    }}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8}}>
        <div style={{fontWeight:700}}>{toast.type.toUpperCase()}</div>
        <button onClick={onClose} style={{background:'transparent',border:0,color:'#fff',cursor:'pointer'}}>✕</button>
      </div>
      <div style={{marginTop:6,fontSize:13}}>{toast.msg}</div>
    </div>
  );
}
