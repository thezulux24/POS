import React from 'react';
import Sidebar from './Sidebar';
import './admin-layout.css';

const AdminLayout = ({ children }) => {
  return (
    <div className="admin-app">
      <Sidebar />
      <main className="admin-content">
        <div className="content-inner">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
