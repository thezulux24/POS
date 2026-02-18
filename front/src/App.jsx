import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import AdminTerminal from './components/AdminTerminal';
import VendorTerminal from './components/VendorTerminal';
import ProductManager from './components/ProductManager';
import { AuthGuard } from './guards/AuthGuard';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/admin"
          element={
            <AuthGuard allowedRoles={['ADMIN']}>
              <AdminTerminal />
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

        <Route path="/admin/products" element={<ProductManager />} />

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
