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
import { OwnerMenuPage } from './pages/OwnerMenuPage';
import { OwnerSettingsPage } from './pages/OwnerSettingsPage';
import { PublicRestaurantPage } from './pages/PublicRestaurantPage';
import { SearchPage } from './pages/SearchPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminRestaurantsPage } from './pages/AdminRestaurantsPage';
import { AdminReportsPage } from './pages/AdminReportsPage';
import { AdminAuditLogsPage } from './pages/AdminAuditLogsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';
import { Footer } from './components/Footer';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-slate-50 flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/restaurant/:slug" element={<PublicRestaurantPage />} />
              
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
              <Route
                path="/owner/menu"
                element={
                  <ProtectedRoute requiredRole="owner">
                    <OwnerMenuPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/owner/settings"
                element={
                  <ProtectedRoute requiredRole="owner">
                    <OwnerSettingsPage />
                  </ProtectedRoute>
                }
              />

              {/* Admin Protected Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/restaurants"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminRestaurantsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/reports"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminReportsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/audit"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminAuditLogsPage />
                  </ProtectedRoute>
                }
              />

              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
