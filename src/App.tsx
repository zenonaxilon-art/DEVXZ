import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Verify } from './pages/Verify';
import { AdminPanel } from './pages/Admin';
import { Messages } from './pages/Messages';
import { CreateListing } from './pages/CreateListing';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoutes';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-[#0A0A0A] text-[#E5E5E5] font-sans flex flex-col overflow-x-hidden">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            <Route element={<ProtectedRoute />}>
              <Route path="/verify" element={<Verify />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/create" element={<CreateListing />} />
            </Route>
            
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminPanel />} />
            </Route>
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
