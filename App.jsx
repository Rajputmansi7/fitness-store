import React, { useContext } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import ProductsPage from './pages/ProductsPage';
import CartPage from './pages/CartPage';
import BillingPage from './pages/BillingPage';
import AdminPage from './pages/AdminPage';
import { AuthContext } from './contexts/AuthContext';
import { IconHome, IconProducts, IconCart, IconUser } from './icons';
import bgFitness from './assets/bg-fitness.png';
import Hero from './components/Hero';

export default function App(){
  const { user, logout } = useContext(AuthContext);
  const nav = useNavigate();
  return (
    <div className="container">
      <div className="header">
        <div style={{display:'flex',gap:12,alignItems:'center'}}>
          <div className="brand">🏋️ Fitness MVP Store</div>
        </div>

        <div style={{display:'flex',gap:12,alignItems:'center'}}>
          <Link to="/" className="small"><IconHome /> <span>Home</span></Link>
          <Link to="/products" className="small"><IconProducts /> <span>Products</span></Link>
          <Link to="/cart" className="small"><IconCart /> <span>Cart</span></Link>

          {user ? (
            <>
              <span className="small"><IconUser /> <span>{user.name || user.email}</span></span>
              <button className="btn" onClick={()=>{ logout(); nav('/'); }}>Logout</button>
              {user.admin && <Link to="/admin"><button className="btn">Admin</button></Link>}
            </>
          ) : <Link to="/auth"><button className="btn">Login / SignUp</button></Link>}
        </div>
      </div>

      <div className="main">
        <Routes>
          <Route path="/" element={<Hero/>} />
          <Route path="/auth" element={<AuthPage/>} />
          <Route path="/profile" element={<ProfilePage/>} />
          <Route path="/products" element={<ProductsPage/>} />
          <Route path="/cart" element={<CartPage/>} />
          <Route path="/billing" element={<BillingPage/>} />
          <Route path="/admin" element={<AdminPage/>} />
        </Routes>
      </div>

      <div className="footer">Built as MVP</div>
    </div>
  );
}
