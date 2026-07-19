import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { api, AuthResponse, User } from '../lib/api';
type AuthContextValue={ user:User|null; token:string|null; login:(email:string,password:string)=>Promise<void>; register:(email:string,password:string)=>Promise<void>; logout:()=>void };
const AuthContext=createContext<AuthContextValue|null>(null);
const storedUser=()=>{ const raw=localStorage.getItem('user'); return raw ? JSON.parse(raw) as User : null; };
export function AuthProvider({children}:{children:ReactNode}){ const [token,setToken]=useState(localStorage.getItem('token')); const [user,setUser]=useState<User|null>(storedUser());
 const persist=(data:AuthResponse)=>{ localStorage.setItem('token',data.token); localStorage.setItem('user',JSON.stringify(data.user)); setToken(data.token); setUser(data.user); };
 const value=useMemo(()=>({user,token,login:async(email:string,password:string)=>persist((await api.post<AuthResponse>('/auth/login',{email,password})).data),register:async(email:string,password:string)=>persist((await api.post<AuthResponse>('/auth/register',{email,password})).data),logout:()=>{localStorage.removeItem('token');localStorage.removeItem('user');setToken(null);setUser(null);}}),[user,token]);
 return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export const useAuth=()=>{ const ctx=useContext(AuthContext); if(!ctx) throw new Error('useAuth must be used inside AuthProvider'); return ctx; };
