import React, { createContext, useState } from 'react';
export const CartContext = createContext();
export function CartProvider({children}){
  const [items, setItems] = useState([]);
  function add(item){
    setItems(prev=>{
      const found = prev.find(p=>p.id===item.id);
      if(found) return prev.map(p=>p.id===item.id?{...p,qty:p.qty+item.qty}:p);
      return [...prev,{...item}];
    });
  }
  function remove(id){ setItems(prev=>prev.filter(i=>i.id!==id)); }
  function clear(){ setItems([]); }
  return <CartContext.Provider value={{items,add,remove,clear}}>{children}</CartContext.Provider>;
}
