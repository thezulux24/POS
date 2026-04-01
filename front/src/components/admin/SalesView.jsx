import React, { useEffect, useState } from 'react';
import { 
  ShoppingCart, 
  Search, 
  Calendar, 
  User, 
  Eye, 
  XCircle,
  Clock,
  ChevronDown
} from 'lucide-react';
import { saleService } from '../../services/saleService';

const SalesView = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  
  // Modal States
  const [selectedSale, setSelectedSale] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const loadSales = async () => {
    try {
      setLoading(true);
      const data = await saleService.getDailyReport({ date: dateFilter });
      setSales(data?.sales || []);
    } catch (err) {
      setError('Error al cargar historial de ventas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, [dateFilter]);

  const priceFormatter = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' });

  const handleCancelSale = async () => {
    setFormLoading(true);
    try {
      await saleService.cancel(selectedSale.id);
      setIsCancelModalOpen(false);
      loadSales();
    } catch (err) {
      alert('Error al anular la venta: ' + (err.response?.data?.message || 'Error desconocido'));
    } finally {
      setFormLoading(false);
    }
  };

  const openDetails = (sale) => {
    setSelectedSale(sale);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="view-panel">
      <header className="terminal-header" style={{ border: 'none', background: 'transparent', padding: '0 0 24px', boxShadow: 'none' }}>
        <div className="terminal-header-main">
          <div className="terminal-badge terminal-badge-admin">
            <ShoppingCart size={24} />
          </div>
          <div className="terminal-meta">
            <span className="terminal-kicker">Historial</span>
            <h1 className="terminal-title">Gestión de Ventas</h1>
            <p className="terminal-subtitle">Consulta y anulación de transacciones registradas.</p>
          </div>
        </div>
      </header>

      <section className="terminal-panel">
        <div className="terminal-toolbar">
          <label className="terminal-field" style={{ flex: 1 }}>
            <Calendar size={15} />
            <input 
              type="date" 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </label>
          <div style={{ flex: 2 }}></div>
        </div>

        <div className="terminal-table">
          <div className="terminal-head" style={{ '--columns': '1.2fr 1fr 1.5fr 1fr 1fr 1.2fr' }}>
            <span>Fecha/Hora</span>
            <span>ID Venta</span>
            <span>Vendedor</span>
            <span>Total</span>
            <span>Estado</span>
            <span className="text-right">Acciones</span>
          </div>
          {loading ? (
             <div style={{ padding: '40px', textAlign: 'center' }}>Cargando ventas...</div>
          ) : sales.length === 0 ? (
             <div style={{ padding: '40px', textAlign: 'center', opacity: 0.5 }}>No hay ventas registradas en esta fecha</div>
          ) : (
            sales.map(sale => (
              <div key={sale.id} className="terminal-row" style={{ '--columns': '1.2fr 1fr 1.5fr 1fr 1fr 1.2fr' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                   <span className="font-medium">{new Date(sale.fecha).toLocaleDateString()}</span>
                   <span style={{ fontSize: '11px', opacity: 0.6 }}>{new Date(sale.fecha).toLocaleTimeString()}</span>
                </div>
                <code>#{sale.id}</code>
                <span>{sale.vendedor?.nombre || 'N/A'}</span>
                <span className="font-bold">{priceFormatter.format(sale.total)}</span>
                <span className={`terminal-pill ${sale.estado === 'ANULADA' ? 'terminal-pill-alert' : 'terminal-pill-ok'}`}>
                   {sale.estado}
                </span>
                <div className="terminal-actions" style={{ justifyContent: 'flex-end' }}>
                  <button className="terminal-icon-btn" onClick={() => openDetails(sale)} title="Ver Detalle"><Eye size={14} /></button>
                  {sale.estado !== 'ANULADA' && (
                    <button className="terminal-icon-btn terminal-icon-btn-danger" onClick={() => { setSelectedSale(sale); setIsCancelModalOpen(true); }} title="Anular"><XCircle size={14} /></button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Detail Modal */}
      {isDetailModalOpen && (
        <div className="terminal-modal-backdrop" onClick={() => setIsDetailModalOpen(false)}>
          <div className="terminal-modal" onClick={e => e.stopPropagation()}>
            <header className="terminal-modal-header">
              <div>
                <h3>Detalle de Venta #{selectedSale?.id}</h3>
                <p>Información completa de la transacción.</p>
              </div>
              <button className="terminal-modal-close" onClick={() => setIsDetailModalOpen(false)}>×</button>
            </header>
            <div className="terminal-modal-body">
              <div className="terminal-summary-strip">
                 <div><User size={14} /> <strong>Vendedor:</strong> {selectedSale?.vendedor?.nombre}</div>
                 <div><Calendar size={14} /> <strong>Cliente:</strong> {selectedSale?.cliente?.nombre || 'Venta Anónima'}</div>
              </div>
              
              <div className="terminal-table" style={{ marginTop: '10px' }}>
                 <div className="terminal-head" style={{ '--columns': '2.5fr 0.8fr 1fr 1fr' }}>
                    <span>Producto</span>
                    <span>Cant</span>
                    <span>P. Unit</span>
                    <span>Subtotal</span>
                 </div>
                 {selectedSale?.items?.map((item, idx) => (
                    <div key={idx} className="terminal-row" style={{ '--columns': '2.5fr 0.8fr 1fr 1fr' }}>
                       <span>{item.producto?.nombre}</span>
                       <span>{item.cantidad}</span>
                       <span>{priceFormatter.format(item.precioUnitario)}</span>
                       <span className="font-bold">{priceFormatter.format(item.precioUnitario * item.cantidad)}</span>
                    </div>
                 ))}
              </div>
              
              <div style={{ alignSelf: 'flex-end', marginTop: '10px', fontSize: '18px', fontWeight: '800' }}>
                 TOTAL: {priceFormatter.format(selectedSale?.total)}
              </div>
            </div>
            <div className="terminal-modal-actions">
              <button className="terminal-primary-btn" onClick={() => setIsDetailModalOpen(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {isCancelModalOpen && (
        <div className="terminal-modal-backdrop" onClick={() => setIsCancelModalOpen(false)}>
          <div className="terminal-modal" style={{ width: '400px' }} onClick={e => e.stopPropagation()}>
            <header className="terminal-modal-header">
               <h3 className="terminal-feedback-error">Confirmar Anulación</h3>
            </header>
            <div className="terminal-modal-body">
               <p className="terminal-panel-sub">¿Estás seguro de anular la venta <strong>#{selectedSale?.id}</strong>?</p>
               <p style={{ fontSize: '12px', opacity: 0.7 }}>El stock de los productos será restaurado automáticamente. Esta acción no se puede revertir.</p>
               <div className="terminal-modal-actions">
                  <button className="terminal-ghost-btn" onClick={() => setIsCancelModalOpen(false)}>Ignorar</button>
                  <button className="terminal-primary-btn" style={{ background: '#ef4444', border: 'none' }} onClick={handleCancelSale} disabled={formLoading}>
                    {formLoading ? 'Procesando...' : 'Anular Venta'}
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesView;
