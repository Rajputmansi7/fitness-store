import React, { createContext, useState, useEffect } from 'react';
import API from '../api';
export const AuthContext = createContext();

export function AuthProvider({children}){
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);

  useEffect(()=>{
    if(token){ API.setToken(token); localStorage.setItem('token', token); }
    else { API.setToken(null); localStorage.removeItem('token'); setUser(null); }
  },[token]);

  const login = async (email,password) => {
    const res = await API.post('/login',{email,password});
    const { token, user: u, admin } = res.data;
    if(token) setToken(token);
    const profileUser = admin ? { email, admin: true } : u;
    setUser(profileUser);
    return res.data;
  };
  const signup = async (name,email,password) => {
    const res = await API.post('/signup',{name,email,password});
    if(res.data.token) setToken(res.data.token);
    setUser(res.data.user);
    return res.data;
  };
  const logout = ()=> { setUser(null); setToken(null); };

  // allow external update of token & user (used when profile save returns new token)
  const replaceAuth = (newToken, newUser) => {
    if(newToken) setToken(newToken);
    if(newUser) setUser(newUser);
  };

  return <AuthContext.Provider value={{user,token,login,signup,logout,replaceAuth}}>{children}</AuthContext.Provider>;
}
