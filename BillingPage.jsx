import React, { useContext, useState } from 'react';
import API from '../api';
import { CartContext } from '../contexts/CartContext';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function BillingPage(){
  const { items, clear } = useContext(CartContext);
  const { token } = useContext(AuthContext);
  const nav = useNavigate();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(false);

  if(!items.length) return <div className="card">No items in cart. <button className="btn" onClick={()=>nav('/products')}>Shop</button></div>;

  async function checkout(){
    if(!token){
      // redirect to login and then come back to billing
      nav('/auth', { state: { from: '/billing' } });
      return;
    }
    try{
      setLoading(true);
      const res = await API.post('/cart/bill',{ items });
      setBill(res.data);
      clear();
    }catch(e){ alert(e?.response?.data?.error || e?.response?.data?.errors?.[0]?.msg || e.message); }
    finally{ setLoading(false); }
  }

  return (
    <div className="card">
      <h3>Billing</h3>
      <div className="small">Items: {items.length}</div>

      {!bill ? (
        <>
          <div style={{marginTop:12}}>Subtotal: <strong>${items.reduce((s,i)=>s+i.price*i.qty,0).toFixed(2)}</strong></div>

          {!token && (
            <div style={{marginTop:12}} className="notice">
              Please <button className="btn" onClick={()=>nav('/auth', { state: { from: '/billing' } })}>Log in / Sign up</button> to complete the purchase.
            </div>
          )}

          <div style={{display:'flex',gap:8,marginTop:12}}>
            <button className="btn" onClick={checkout} disabled={loading}>{loading ? 'Processing...' : 'Calculate & Checkout'}</button>
            <button className="btn" onClick={()=>nav('/products')}>Continue shopping</button>
          </div>
        </>
      ) : (
        <div>
          <div className="small">Subtotal: ${bill.subtotal}</div>
          <div className="small">Shipping: ${bill.shipping}</div>
          <div className="small">Tax: ${bill.tax}</div>
          <h3>Total: ${bill.total}</h3>
          <div className="small">Receipt saved in activities</div>
        </div>
      )}
    </div>
  );
}
