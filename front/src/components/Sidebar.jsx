import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  BarChart3, 
  Package, 
  Users, 
  Truck, 
  ShoppingCart, 
  UserCircle2, 
  Settings, 
  ChevronRight,
  LogOut,
  LayoutDashboard
} from 'lucide-react';
import { authService } from '../services/authService';
import { useNavigate } from 'react-router-dom';

const Sidebar = () => {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Panel Principal', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Inventario', path: '/admin/inventory', icon: Package },
    { name: 'Ventas', path: '/admin/sales', icon: ShoppingCart },
    { name: 'Clientes', path: '/admin/customers', icon: Users },
    { name: 'Vendedores', path: '/admin/users', icon: UserCircle2 },
    { name: 'Proveedores', path: '/admin/suppliers', icon: Truck },
    { name: 'Reportes', path: '/admin/reports', icon: BarChart3 },
  ];

  return (
    <aside className="terminal-sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">POS</div>
        <div className="brand-meta">
          <span className="brand-name">Sistema POS</span>
          <span className="brand-version">v2.0 Beta</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path} 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <item.icon size={20} className="link-icon" />
            <span className="link-text">{item.name}</span>
            <ChevronRight size={14} className="link-arrow" />
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar">{user?.nombre?.charAt(0) || 'A'}</div>
          <div className="user-info">
            <span className="u-name">{user?.nombre}</span>
            <span className="u-role">Administrador</span>
          </div>
        </div>
        <button onClick={handleLogout} className="logout-btn" title="Cerrar Sesión">
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
