
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { DataProvider } from '@/contexts/DataContext';
import LoginPage from '@/pages/LoginPage';
import Dashboard from '@/pages/Dashboard';
import ResidentSearch from '@/pages/ResidentSearch';
import ResidentDetail from '@/pages/ResidentDetail';
import ResidentManagement from '@/pages/ResidentManagement';
import UserManagement from '@/pages/UserManagement';
import MedicationStock from '@/pages/MedicationStock';
import Layout from '@/components/Layout';


function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <Layout title="Carregando..."><div className="text-center">Aguarde um momento...</div></Layout>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (allowedRoles && user.profile && !allowedRoles.includes(user.profile.role)) {
    return <Navigate to="/" />;
  }
  
  return children;
}

function App() {
  const { user, loading } = useAuth();
  
  return (
    <>
      <Helmet>
        <title>Prontuário Eletrônico - Arte e Cuidar</title>
        <meta name="description" content="Sistema de prontuário eletrônico para casa de cuidados de idosos Arte e Cuidar" />
        <meta property="og:title" content="Prontuário Eletrônico - Arte e Cuidar" />
        <meta property="og:description" content="Sistema de prontuário eletrônico para casa de cuidados de idosos Arte e Cuidar" />
      </Helmet>
      
      <DataProvider>
          <Router>
            <div className="min-h-screen">
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/residentes" element={
                  <ProtectedRoute>
                    <ResidentSearch />
                  </ProtectedRoute>
                } />
                <Route path="/residente/:id/:tab?" element={
                  <ProtectedRoute>
                    <ResidentDetail />
                  </ProtectedRoute>
                } />
                <Route path="/gerenciar-residentes" element={
                  <ProtectedRoute allowedRoles={['supervisor', 'administrador']}>
                    <ResidentManagement />
                  </ProtectedRoute>
                } />
                <Route path="/gerenciar-usuarios" element={
                  <ProtectedRoute allowedRoles={['supervisor', 'administrador']}>
                    <UserManagement />
                  </ProtectedRoute>
                } />
                <Route path="/estoque-medicamentos/:residentId" element={
                  <ProtectedRoute allowedRoles={['supervisor', 'administrador']}>
                    <MedicationStock />
                  </ProtectedRoute>
                } />
              </Routes>
            </div>
          </Router>
        </DataProvider>
    </>
  );
}

export default App;
