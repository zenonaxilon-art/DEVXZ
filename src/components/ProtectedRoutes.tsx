import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const ProtectedRoute = () => {
  const { session, loading } = useAuth();

  if (loading) return <div className="h-screen flex items-center justify-center text-white">Loading...</div>;

  return session ? <Outlet /> : <Navigate to="/login" replace />;
};

export const AdminRoute = () => {
  const { session, profile, loading } = useAuth();

  if (loading) return <div className="h-screen flex items-center justify-center text-white">Loading...</div>;

  return session && profile?.role === 'admin' ? <Outlet /> : <Navigate to="/" replace />;
};
