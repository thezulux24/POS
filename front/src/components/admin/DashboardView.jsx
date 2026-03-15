import React, { useEffect, useState } from 'react';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Users, 
  Package, 
  AlertCircle,
  TrendingDown
} from 'lucide-react';
import { reportService } from '../../services/reportService';

const DashboardView = () => {
  const [stats, setStats] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [statsData, topData] = await Promise.all([
          reportService.getStats(),
          reportService.getTopProducts(5)
        ]);
        setStats(statsData);
        setTopProducts(topData);
      } catch (err) {
        console.error('Dashboard Load Error:', err);
        setError('Error al conectar con el servidor. Verifica que el backend esté activo.');
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  const priceFormatter = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' });

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando dashboard profesional...</div>;

  return (
    <div className="view-panel">
      <header className="terminal-header" style={{ border: 'none', background: 'transparent', padding: '0 0 24px', boxShadow: 'none' }}>
        <div className="terminal-header-main">
          <div className="terminal-badge terminal-badge-admin">
            <LayoutDashboard size={24} />
          </div>
          <div className="terminal-meta">
            <span className="terminal-kicker">Administración</span>
            <h1 className="terminal-title">Dashboard</h1>
            <p className="terminal-subtitle">Estado general del negocio y alertas clave.</p>
          </div>
        </div>
      </header>

      {error && <p className="terminal-panel-sub terminal-feedback-error" style={{ marginBottom: '20px' }}>{error}</p>}

      <section className="terminal-kpi-grid">
        <article className="terminal-kpi terminal-kpi-animated" style={{ animationDelay: '0s' }}>
          <span className="terminal-kpi-label">Ventas Hoy</span>
          <div className="terminal-kpi-value">{priceFormatter.format(stats?.totalVentasHoy || 0)}</div>
          <div className="terminal-kpi-note terminal-note-ok font-medium flex items-center gap-1">
             <TrendingUp size={12} /> {stats?.conteoVentasHoy || 0} transacciones
          </div>
        </article>

        <article className="terminal-kpi terminal-kpi-animated" style={{ animationDelay: '0.1s' }}>
          <span className="terminal-kpi-label">Productos Activos</span>
          <div className="terminal-kpi-value">{stats?.totalProductos || 0}</div>
          <div className="terminal-kpi-note terminal-note-neutral">Catálogo disponible</div>
        </article>

        <article className="terminal-kpi terminal-kpi-animated" style={{ animationDelay: '0.2s' }}>
          <span className="terminal-kpi-label">Stock Bajo</span>
          <div className="terminal-kpi-value">{stats?.productosBajoStockCount || 0}</div>
          <div className={`terminal-kpi-note ${stats?.productosBajoStockCount > 0 ? 'terminal-note-alert' : 'terminal-note-ok'}`}>
            {stats?.productosBajoStockCount > 0 ? 'Requiere reposición' : 'Todo en orden'}
          </div>
        </article>

        <article className="terminal-kpi terminal-kpi-animated" style={{ animationDelay: '0.3s' }}>
          <span className="terminal-kpi-label">Nuevos Clientes</span>
          <div className="terminal-kpi-value">{stats?.nuevosClientesMes || 0}</div>
          <div className="terminal-kpi-note terminal-note-neutral">En los últimos 30 días</div>
        </article>
      </section>

      <div className="terminal-admin-grid" style={{ marginTop: '24px' }}>
        <section className="terminal-panel">
          <h2 className="terminal-panel-title">Top 5 Productos</h2>
          <p className="terminal-panel-sub">Productos con mayor volumen de ventas.</p>
          
          <div className="terminal-table">
            <div className="terminal-head" style={{ '--columns': '2fr 1fr 1fr' }}>
              <span>Producto</span>
              <span>Vendidos</span>
              <span>Total</span>
            </div>
            {topProducts.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', opacity: 0.5 }}>No hay datos de ventas</div>
            ) : (
              topProducts.map((item, idx) => (
                <div key={idx} className="terminal-row" style={{ '--columns': '2fr 1fr 1fr' }}>
                  <span className="font-medium">{item.nombre}</span>
                  <span>{item.cantidadVendida} units</span>
                  <span className="terminal-note-ok font-bold">{priceFormatter.format(item.ingresosTotales)}</span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="terminal-panel">
          <h2 className="terminal-panel-title">Alertas de Inventario</h2>
          {stats?.productosBajoStock?.length > 0 ? (
            <div className="terminal-list">
              {stats.productosBajoStock.map((prod, i) => (
                <div key={i} className="terminal-list-item">
                  <div>
                    <strong>{prod.nombre}</strong>
                    <span>Cód: {prod.codigo}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="terminal-pill terminal-pill-alert" style={{ marginBottom: '4px' }}>
                      STOCK: {prod.stock}
                    </span>
                    <span style={{ fontSize: '10px', display: 'block', opacity: 0.6 }}>Mín: {prod.stockMinimo}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <Package size={32} style={{ opacity: 0.2, marginBottom: '12px' }} />
              <p className="terminal-panel-sub">No hay productos en stock bajo actualmente.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default DashboardView;
