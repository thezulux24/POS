import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import AdminTerminal from './components/AdminTerminal'; // We will refactor this
import VendorTerminal from './components/VendorTerminal';
import AdminLayout from './components/AdminLayout';
import { AuthGuard } from './guards/AuthGuard';
import './App.css';

// Placeholder views while refactoring AdminTerminal
const DashboardPlaceholder = () => <AdminTerminal defaultView="dashboard" />;
const InventoryPlaceholder = () => <AdminTerminal defaultView="inventory" />;
const SalesPlaceholder = () => <AdminTerminal defaultView="sales" />;
const CustomersPlaceholder = () => <AdminTerminal defaultView="customers" />;
const UsersPlaceholder = () => <AdminTerminal defaultView="users" />;
const SuppliersPlaceholder = () => <AdminTerminal defaultView="suppliers" />;
const ReportsPlaceholder = () => <AdminTerminal defaultView="reports" />;

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/admin/*"
          element={
            <AuthGuard allowedRoles={['ADMIN']}>
              <AdminLayout>
                <Routes>
                  <Route path="dashboard" element={<DashboardPlaceholder />} />
                  <Route path="inventory" element={<InventoryPlaceholder />} />
                  <Route path="sales" element={<SalesPlaceholder />} />
                  <Route path="customers" element={<CustomersPlaceholder />} />
                  <Route path="users" element={<UsersPlaceholder />} />
                  <Route path="suppliers" element={<SuppliersPlaceholder />} />
                  <Route path="reports" element={<ReportsPlaceholder />} />
                  <Route path="" element={<Navigate to="dashboard" replace />} />
                </Routes>
              </AdminLayout>
            </AuthGuard>
          }
        />

        <Route
          path="/vendor"
          element={
            <AuthGuard allowedRoles={['VENDEDOR']}>
              <VendorTerminal />
            </AuthGuard>
          }
        />

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
