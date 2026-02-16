"use client";

import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Calendar } from './pages/Calendar';
import { Finance } from './pages/Finance';
import { AdminUsers } from './pages/AdminUsers';
import { Patients } from './pages/Patients';
import { Login } from './pages/Login';
import { UserRole } from './types';

// Simulating Middleware with a Client-Side Guard
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: UserRole[] }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex h-screen items-center justify-center text-slate-500">Chargement...</div>;
  if (!user) return <Navigate to="/login" />;
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'secretaire' || user.role === 'therapeute') {
      return <Navigate to="/calendar" />;
    }
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            {/* Dashboard: Admin Only */}
            <Route index element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Dashboard />
              </ProtectedRoute>
            } />
            
            <Route path="calendar" element={<Calendar />} />
            <Route path="patients" element={<Patients />} />
            
            {/* Finance: Admin & Secretary Only */}
            <Route path="finance" element={
              <ProtectedRoute allowedRoles={['admin', 'secretaire']}>
                <Finance />
              </ProtectedRoute>
            } />

            {/* Admin Users: Admin Only */}
            <Route path="admin/users" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminUsers />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;