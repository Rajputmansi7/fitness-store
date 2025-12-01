import React, { useEffect, useState, useContext } from 'react';
import API from '../api';
import { CartContext } from '../contexts/CartContext';

export default function ProductsPage(){
  const [products,setProducts]=useState([]);
  const [filter,setFilter]=useState('all');
  const { add } = useContext(CartContext);

  useEffect(()=>{ API.get('/products').then(r=>setProducts(r.data)).catch(()=>setProducts([])); },[]);

  function imgUrl(fileName){
    // dynamic import compatible with Vite dev + build
    try {
      return new URL(`../assets/${fileName}`, import.meta.url).href;
    } catch(e){
      return new URL('../assets/placeholder.png', import.meta.url).href;
    }
  }

  const visible = products.filter(p=> filter==='all' ? true : p.type===filter);

  function addToCart(p, qtyInput){
    const qty = Number(qtyInput.value) || 1;
    add({ id:p.id, name:p.name, price:p.price, qty });
    qtyInput.value = 1;
    // small UI feedback
    alert(`${p.name} x${qty} added to cart`);
  }

  return (
    <div>
      <div className="card" style={{marginBottom:12}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <h3>Products</h3>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <label className="small">Filter</label>
            <select className="input" style={{width:160}} value={filter} onChange={e=>setFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="equipment">Equipment</option>
              <option value="supplement">Supplement</option>
            </select>
          </div>
        </div>
      </div>

      <div className="product-grid">
        {visible.map(p=>(
          <div key={p.id} className="card">
            <img className="product-img" src={imgUrl(p.img || 'placeholder.png')} alt={p.name} />
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <strong>{p.name}</strong>
              <div style={{background:'rgba(255,255,255,0.06)',padding:'6px 10px',borderRadius:10,fontSize:12}}>{p.company}</div>
            </div>
            <div className="small" style={{marginTop:6}}>Type: {p.type} • Weight: {p.weight}</div>
            <div style={{marginTop:10,display:'flex',gap:8,alignItems:'center'}}>
              <div style={{fontWeight:800}}>${p.price}</div>
              <input defaultValue={1} className="input quantity" type="number" min="1" id={`q-${p.id}`} />
              <button className="btn" onClick={()=>addToCart(p, document.getElementById(`q-${p.id}`))}>Add</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
