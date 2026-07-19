import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Shell } from './components/Shell';
import { Dashboard } from './pages/Dashboard';
import { Upload } from './pages/Upload';
import { Reconciliation } from './pages/Reconciliation';
import { Settings } from './pages/Settings';
const queryClient=new QueryClient();
function Protected(){ const {token}=useAuth(); return token ? <Shell/> : <Navigate to="/login" replace/>; }
export function App(){ return <QueryClientProvider client={queryClient}><AuthProvider><Router><Routes><Route path="/login" element={<Login/>}/><Route path="/register" element={<Register/>}/><Route element={<Protected/>}><Route path="/" element={<Dashboard/>}/><Route path="/upload" element={<Upload/>}/><Route path="/reconciliation" element={<Reconciliation/>}/><Route path="/settings" element={<Settings/>}/></Route><Route path="*" element={<Navigate to="/" replace/>}/></Routes></Router><Toaster richColors position="top-right"/></AuthProvider></QueryClientProvider>; }
