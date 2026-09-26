import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';

import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { OwnerDashboardPage } from './pages/OwnerDashboardPage';
import { NewRestaurantPage } from './pages/NewRestaurantPage';
import { EditRestaurantPage } from './pages/EditRestaurantPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-slate-50 flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              
              {/* Owner Protected Routes */}
              <Route
                path="/owner"
                element={
                  <ProtectedRoute requiredRole="owner">
                    <OwnerDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/owner/restaurant/new"
                element={
                  <ProtectedRoute requiredRole="owner">
                    <NewRestaurantPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/owner/restaurant"
                element={
                  <ProtectedRoute requiredRole="owner">
                    <EditRestaurantPage />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
