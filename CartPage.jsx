import React, { useContext } from 'react';
import { CartContext } from '../contexts/CartContext';
import { Link, useNavigate } from 'react-router-dom';

export default function CartPage(){
  const { items, remove, clear } = useContext(CartContext);
  const nav = useNavigate();
  const subtotal = items.reduce((s,i)=>s+i.price*i.qty,0);
  return (
    <div className="card">
      <h3>Your Cart</h3>
      {!items.length && <div className="small">Cart empty — <Link to="/products">shop products</Link></div>}
      {items.length>0 && (
        <>
          <table className="table">
            <thead><tr><th>Name</th><th>Qty</th><th>Price</th><th></th></tr></thead>
            <tbody>
              {items.map(it=>(
                <tr key={it.id}>
                  <td>{it.name}</td><td>{it.qty}</td><td>${(it.price*it.qty).toFixed(2)}</td>
                  <td><button className="btn" onClick={()=>remove(it.id)}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{marginTop:12}}>Subtotal: <strong>${subtotal.toFixed(2)}</strong></div>
          <div style={{display:'flex',gap:8,marginTop:8}}>
            <button className="btn" onClick={()=>nav('/billing')}>Proceed to Billing</button>
            <button className="btn" onClick={()=>clear()}>Clear</button>
          </div>
        </>
      )}
    </div>
  );
}
