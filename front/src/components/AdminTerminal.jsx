import React, { useEffect, useState } from 'react';
import DashboardView from './admin/DashboardView';
import InventoryView from './admin/InventoryView';
import SalesView from './admin/SalesView';
import CustomersView from './admin/CustomersView';
import UsersView from './admin/UsersView';
import SuppliersView from './admin/SuppliersView';
import ReportsView from './admin/ReportsView';
import CategoriesView from './admin/CategoriesView';
import './terminal-templates.css';

const AdminTerminal = ({ defaultView = 'dashboard' }) => {
  const [currentView, setCurrentView] = useState(defaultView);

  useEffect(() => {
    setCurrentView(defaultView);
  }, [defaultView]);

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />;
      case 'inventory':
        return <InventoryView />;
      case 'sales':
        return <SalesView />;
      case 'customers':
        return <CustomersView />;
      case 'users':
        return <UsersView />;
      case 'suppliers':
        return <SuppliersView />;
      case 'categories':
        return <CategoriesView />;
      case 'reports':
        return <ReportsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="admin-terminal-wrapper">
      {renderContent()}
    </div>
  );
};

export default AdminTerminal;
