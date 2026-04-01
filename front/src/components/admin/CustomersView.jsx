import React, { useEffect, useState } from 'react';
import { 
  UserCircle, 
  Plus, 
  Search, 
  History, 
  Pencil, 
  Mail, 
  Phone,
  FileText
} from 'lucide-react';
import { customerService } from '../../services/customerService';
import { saleService } from '../../services/saleService';

const CustomersView = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // History Modal
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await customerService.getAll();
      setCustomers(data);
    } catch (err) {
      setError('Error al cargar la base de datos de clientes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const filteredCustomers = customers.filter(c => 
    c.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.documento?.includes(searchQuery)
  );

  const openHistory = async (customer) => {
    setSelectedCustomer(customer);
    setIsHistoryModalOpen(true);
    setHistoryLoading(true);
    try {
      const data = await saleService.getCustomerHistory(customer.id);
      setHistory(data);
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const priceFormatter = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' });

  return (
    <div className="view-panel">
      <header className="terminal-header" style={{ border: 'none', background: 'transparent', padding: '0 0 24px', boxShadow: 'none' }}>
        <div className="terminal-header-main">
          <div className="terminal-badge terminal-badge-admin">
            <UserCircle size={24} />
          </div>
          <div className="terminal-meta">
            <span className="terminal-kicker">CRM</span>
            <h1 className="terminal-title">Clientes</h1>
            <p className="terminal-subtitle">Gestión de lealtad y seguimiento comercial.</p>
          </div>
        </div>
      </header>

      <section className="terminal-panel">
        <div className="terminal-toolbar">
          <label className="terminal-field" style={{ flex: 1 }}>
            <Search size={15} />
            <input 
              type="text" 
              placeholder="Buscar por nombre o documento..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </label>
        </div>

        <div className="terminal-table">
          <div className="terminal-head" style={{ '--columns': '1.2fr 2fr 1.2fr 1fr 1fr' }}>
            <span>Documento</span>
            <span>Nombre Completo</span>
            <span>Teléfono</span>
            <span>Email</span>
            <span className="text-right">Acciones</span>
          </div>
          {loading ? (
             <div style={{ padding: '40px', textAlign: 'center' }}>Cargando clientes...</div>
          ) : (
            filteredCustomers.map(c => (
              <div key={c.id} className="terminal-row" style={{ '--columns': '1.2fr 2fr 1.2fr 1fr 1fr' }}>
                <code>{c.documento}</code>
                <span className="font-medium">{c.nombre}</span>
                <span>{c.telefono}</span>
                <span style={{ fontSize: '11px' }}>{c.email}</span>
                <div className="terminal-actions" style={{ justifyContent: 'flex-end' }}>
                  <button className="terminal-icon-btn" onClick={() => openHistory(c)} title="Ver Historial (US014)"><History size={14} /></button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* History Modal */}
      {isHistoryModalOpen && (
        <div className="terminal-modal-backdrop" onClick={() => setIsHistoryModalOpen(false)}>
          <div className="terminal-modal" style={{ width: '600px' }} onClick={e => e.stopPropagation()}>
            <header className="terminal-modal-header">
               <div>
                  <h3>Historial de Compras</h3>
                  <p>{selectedCustomer?.nombre}</p>
               </div>
               <button className="terminal-modal-close" onClick={() => setIsHistoryModalOpen(false)}>×</button>
            </header>
            <div className="terminal-modal-body">
               {historyLoading ? (
                  <p style={{ textAlign: 'center', padding: '20px' }}>Consultando transacciones...</p>
               ) : history.length === 0 ? (
                  <p style={{ textAlign: 'center', opacity: 0.5, padding: '20px' }}>Este cliente no tiene compras registradas.</p>
               ) : (
                  <div className="terminal-table">
                     <div className="terminal-head" style={{ '--columns': '1.5fr 1fr 1fr' }}>
                        <span>Fecha</span>
                        <span>Venta ID</span>
                        <span>Total</span>
                     </div>
                     <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {history.map(sale => (
                           <div key={sale.id} className="terminal-row" style={{ '--columns': '1.5fr 1fr 1fr' }}>
                              <span>{new Date(sale.createdAt).toLocaleDateString()}</span>
                              <code>#{sale.id}</code>
                              <span className="font-bold">{priceFormatter.format(sale.total)}</span>
                           </div>
                        ))}
                     </div>
                  </div>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersView;
