import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Crown,
  Filter,
  LogOut,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Tags,
  Trash2,
  Warehouse,
} from 'lucide-react';
import { authService } from '../services/authService';
import './terminal-templates.css';

const DASHBOARD_STATS = [
  { label: 'Productos activos', value: '286', note: 'Catalogo disponible', tone: 'ok' },
  { label: 'Categorias', value: '8', note: 'Todas operativas', tone: 'ok' },
  { label: 'Stock bajo', value: '14', note: 'Requiere reposicion', tone: 'alert' },
  { label: 'Actualizaciones hoy', value: '21', note: 'Cambios en inventario', tone: 'neutral' },
];

const PRODUCTS = [
  { code: 'PROD-001', name: 'Audifonos Bluetooth', category: 'Electronica', price: '$150,000', stock: 50, status: 'Disponible' },
  { code: 'PROD-004', name: 'Cafe Instantaneo 200g', category: 'Alimentos', price: '$18,000', stock: 9, status: 'Stock bajo' },
  { code: 'PROD-010', name: 'Cable USB-C', category: 'Accesorios', price: '$18,000', stock: 32, status: 'Disponible' },
  { code: 'PROD-022', name: 'Termo Acero 1L', category: 'Hogar', price: '$42,000', stock: 2, status: 'Critico' },
];

const CATEGORIES = [
  { name: 'Electronica', products: 92, active: true },
  { name: 'Alimentos', products: 64, active: true },
  { name: 'Accesorios', products: 48, active: true },
  { name: 'Hogar', products: 32, active: true },
];

const INVENTORY_UPDATES = [
  { action: 'Actualizacion de precio', target: 'PROD-010 - Cable USB-C', user: 'admin@pos.com', time: '08:40' },
  { action: 'Ajuste de stock', target: 'PROD-022 - Termo Acero 1L', user: 'admin@pos.com', time: '08:25' },
  { action: 'Nuevo producto', target: 'PROD-033 - Organizador Cajon', user: 'admin@pos.com', time: '08:10' },
];

const AdminTerminal = () => {
  const user = authService.getCurrentUser();
  const navigate = useNavigate();

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

  return (
    <div className="terminal-page">
      <div className="terminal-shell terminal-shell-animated">
        <header className="terminal-header">
          <div className="terminal-header-main">
            <div className="terminal-badge terminal-badge-admin">
              <Crown size={24} />
            </div>
            <div className="terminal-meta">
              <span className="terminal-kicker">Administracion</span>
              <h1 className="terminal-title">Gestion de Inventario POS</h1>
              <p className="terminal-subtitle">Categorias y productos centralizados para operacion diaria.</p>
            </div>
          </div>

          <div className="terminal-user">
            <div className="terminal-user-chip">
              <strong>{user?.nombre ?? 'Administrador'}</strong>
              <span>{user?.email ?? 'admin@pos.com'}</span>
            </div>
            <button type="button" onClick={handleLogout} className="terminal-logout">
              <LogOut size={16} />
              Cerrar sesion
            </button>
          </div>
        </header>

        <section className="terminal-kpi-grid">
          {DASHBOARD_STATS.map((item, index) => (
            <article
              key={item.label}
              className="terminal-kpi terminal-kpi-animated"
              style={{ animationDelay: `${0.12 + index * 0.06}s` }}
            >
              <span className="terminal-kpi-label">{item.label}</span>
              <div className="terminal-kpi-value">{item.value}</div>
              <div className={`terminal-kpi-note terminal-note-${item.tone}`}>{item.note}</div>
            </article>
          ))}
        </section>

        <div className="terminal-admin-grid">
          <section className="terminal-panel">
            <div className="terminal-panel-header">
              <div>
                <h2 className="terminal-panel-title">Productos</h2>
                <p className="terminal-panel-sub">Consulta, creacion, edicion y baja logica de inventario.</p>
              </div>
              <button type="button" className="terminal-primary-btn">
                <Plus size={15} />
                Nuevo producto
              </button>
            </div>

            <div className="terminal-toolbar">
              <label className="terminal-field">
                <Search size={15} />
                <input type="text" placeholder="Buscar por codigo o nombre" readOnly value="" />
              </label>

              <label className="terminal-field">
                <Tags size={15} />
                <select defaultValue="Todas" disabled>
                  <option>Todas</option>
                  <option>Electronica</option>
                  <option>Alimentos</option>
                  <option>Accesorios</option>
                  <option>Hogar</option>
                </select>
              </label>

              <label className="terminal-field">
                <Filter size={15} />
                <select defaultValue="Todos" disabled>
                  <option>Todos</option>
                  <option>Disponibles</option>
                  <option>Stock bajo</option>
                  <option>Inactivos</option>
                </select>
              </label>
            </div>

            <div className="terminal-table terminal-table-scroll">
              <div className="terminal-head" style={{ '--columns': '0.95fr 1.6fr 1fr 0.9fr 0.8fr 1fr' }}>
                <span>Codigo</span>
                <span>Producto</span>
                <span>Categoria</span>
                <span>Precio</span>
                <span>Stock</span>
                <span>Acciones</span>
              </div>

              {PRODUCTS.map((product) => (
                <div key={product.code} className="terminal-row" style={{ '--columns': '0.95fr 1.6fr 1fr 0.9fr 0.8fr 1fr' }}>
                  <span>{product.code}</span>
                  <span>{product.name}</span>
                  <span>{product.category}</span>
                  <span>{product.price}</span>
                  <div>
                    <span className={`terminal-pill ${product.stock <= 2 ? 'terminal-pill-alert' : product.stock <= 10 ? 'terminal-pill-warn' : 'terminal-pill-ok'}`}>
                      {product.stock}
                    </span>
                  </div>
                  <div className="terminal-actions">
                    <button type="button" className="terminal-icon-btn" aria-label="Editar producto">
                      <Pencil size={14} />
                    </button>
                    <button type="button" className="terminal-icon-btn terminal-icon-btn-danger" aria-label="Eliminar producto">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="terminal-stack">
            <section className="terminal-panel">
              <div className="terminal-panel-header">
                <div>
                  <h2 className="terminal-panel-title">Categorias</h2>
                  <p className="terminal-panel-sub">Control de categorias del catalogo.</p>
                </div>
                <button type="button" className="terminal-primary-btn terminal-primary-btn-sm">
                  <Plus size={14} />
                  Crear
                </button>
            </div>
        </div>
    );
};

export default AdminTerminal;
