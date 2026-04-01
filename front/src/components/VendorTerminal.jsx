import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  FileDown,
  LogOut,
  Mail,
  Minus,
  Phone,
  Plus,
  Printer,
  ReceiptText,
  Search,
  ShoppingCart,
  Store,
  Trash2,
  UserRound,
  Wallet,
  UserPlus,
  History
} from 'lucide-react';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { authService } from '../services/authService';
import { customerService } from '../services/customerService';
import { productService } from '../services/productService';
import { saleService } from '../services/saleService';
import './terminal-templates.css';

const IVA_RATE = 0.19;
const MAX_SEARCH_RESULTS = 20;
const getTodayDate = () => new Date().toISOString().slice(0, 10);

const escapeHtml = (value) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

const VendorTerminal = () => {
  const user = authService.getCurrentUser();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  
  // Customer State
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customerResults, setCustomerResults] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  
  const [customerForm, setCustomerForm] = useState({
    documento: '',
    nombre: '',
    telefono: '',
    email: '',
  });

  const [ticketPreview, setTicketPreview] = useState('Aun no hay ticket para mostrar.');
  const [lastSaleId, setLastSaleId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [saleError, setSaleError] = useState('');
  const [saleSuccess, setSaleSuccess] = useState('');
  const [saleLoading, setSaleLoading] = useState(false);
  const [reportDate, setReportDate] = useState(getTodayDate);
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState('');

  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedCustomerHistory, setSelectedCustomerHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const priceFormatter = useMemo(
    () => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }),
    [],
  );
  const dateTimeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat('es-CO', {
        dateStyle: 'short',
        timeStyle: 'short',
      }),
    [],
  );

  const totals = useMemo(() => {
    const subtotal = cartItems.reduce(
      (accumulator, item) => accumulator + Number(item.precio) * item.quantity,
      0,
    );
    const iva = subtotal * IVA_RATE;
    const total = subtotal + iva;

    return { subtotal, iva, total };
  }, [cartItems]);

  const buildLocalTicket = (saleIdLabel = 'PREVIEW') => {
    if (cartItems.length === 0) return 'No hay productos en el carrito.';
    const customerDisplayName = selectedCustomer?.nombre || 'Anónimo';
    const header = [
      'POS - TIQUETE',
      `Venta #${saleIdLabel}`,
      `Fecha: ${new Date().toLocaleString('es-CO')}`,
      `Cliente: ${customerDisplayName}`,
      '-----------------------------',
    ];
    const detail = cartItems.map(i => `${i.nombre} x${i.quantity} ${priceFormatter.format(i.precio * i.quantity)}`);
    const footer = [
      '-----------------------------',
      `TOTAL: ${priceFormatter.format(totals.total)}`,
    ];
    return [...header, ...detail, ...footer].join('\n');
  };

  const handleCustomerSearch = async (query) => {
    setCustomerSearchQuery(query);
    if (!query.trim()) {
      setCustomerResults([]);
      setShowCustomerDropdown(false);
      return;
    }
    try {
      const data = await customerService.search(query);
      setCustomerResults(Array.isArray(data) ? data : []);
      setShowCustomerDropdown(true);
    } catch (err) {
      setCustomerResults([]);
    }
  };

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setCustomerSearchQuery(customer.nombre);
    setShowCustomerDropdown(false);
    setCustomerResults([]);
  };

  const handleClearCustomer = () => {
    setSelectedCustomer(null);
    setCustomerSearchQuery('');
    setCustomerResults([]);
    setShowCustomerDropdown(false);
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const newCustomer = await customerService.create({ ...customerForm, activo: true });
      setSelectedCustomer(newCustomer);
      setCustomerSearchQuery(newCustomer.nombre);
      setIsCustomerModalOpen(false);
    } catch (err) {
      alert('Error al crear cliente');
    } finally {
      setLoading(false);
    }
  };

  const openNewCustomerModal = () => {
    setCustomerForm({ documento: '', nombre: '', telefono: '', email: '' });
    setIsCustomerModalOpen(true);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      setLoading(true);
      const data = await productService.search(searchQuery.trim(), MAX_SEARCH_RESULTS);
      setResults(Array.isArray(data) ? data : []);
    } catch (err) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { productId: product.id, nombre: product.nombre, codigo: product.codigo, precio: Number(product.precio), stock: product.stock, quantity: 1 }];
    });
  };

  const incrementItem = (id) => setCartItems(prev => prev.map(i => i.productId === id ? { ...i, quantity: Math.min(i.quantity + 1, i.stock) } : i));
  const decrementItem = (id) => setCartItems(prev => prev.map(i => i.productId === id ? { ...i, quantity: i.quantity - 1 } : i).filter(i => i.quantity > 0));
  const removeItem = (id) => setCartItems(prev => prev.filter(i => i.productId !== id));

  const handleRegisterSale = async () => {
    if (cartItems.length === 0) return;
    setSaleLoading(true);
    try {
      const response = await saleService.create({
        items: cartItems.map(i => ({ productId: i.productId, cantidad: i.quantity })),
        clienteId: selectedCustomer?.id || null,
        estado: 'COMPLETED'
      });
      setLastSaleId(response.id);
      setTicketPreview(response.ticketPreview || buildLocalTicket(String(response.id)));
      setCartItems([]);
      setSaleSuccess('Venta registrada!');
    } catch (err) {
      setSaleError('Error al registrar venta');
    } finally {
      setSaleLoading(false);
    }
  };

  const handlePrintTicket = () => {
    const printWindow = window.open('', '_blank', 'width=420,height=720');
    printWindow.document.write(`<pre style="font-family:monospace;padding:20px">${escapeHtml(ticketPreview)}</pre>`);
    printWindow.document.close();
    printWindow.print();
  };

  const handleLoadReport = async () => {
    try {
      setReportLoading(true);
      const data = await saleService.getDailyReport({ date: reportDate });
      setReportData(data);
    } catch (err) {
      setReportData(null);
    } finally {
      setReportLoading(false);
    }
  };

  const handleShowHistory = async () => {
    if (!selectedCustomer) return;
    setHistoryLoading(true);
    setHistoryModalOpen(true);
    try {
      const data = await saleService.getCustomerHistory(selectedCustomer.id);
      setSelectedCustomerHistory(data);
    } catch (err) { } finally { setHistoryLoading(false); }
  };

  const handleLogout = () => { authService.logout(); navigate('/login'); };

  return (
    <div className="terminal-page">
      <div className="terminal-shell terminal-shell-animated">
        <header className="terminal-header">
           <div className="terminal-header-main">
              <div className="terminal-badge terminal-badge-vendor"><Store size={24} /></div>
              <div className="terminal-meta">
                 <span className="terminal-kicker">Terminal de Venta</span>
                 <h1 className="terminal-title">POS Express</h1>
                 <p className="terminal-subtitle">Punto de atención para clientes y facturación.</p>
              </div>
           </div>
           <div className="terminal-user">
              <div className="terminal-user-chip">
                 <strong>{user?.nombre}</strong>
                 <span>{user?.rol}</span>
              </div>
              <button className="terminal-logout" onClick={handleLogout}><LogOut size={16} /> Salir</button>
           </div>
        </header>

        <div className="terminal-vendor-grid">
           <main className="terminal-stack">
              <section className="terminal-panel">
                 <div className="terminal-panel-header">
                    <div>
                       <h2 className="terminal-panel-title">Buscador</h2>
                       <p className="terminal-panel-sub">Productos activos y en stock.</p>
                    </div>
                 </div>
                 <div className="terminal-toolbar terminal-toolbar-vendor">
                    <label className="terminal-field">
                       <Search size={15} />
                       <input placeholder="Cod o Nombre..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} />
                    </label>
                    <button className="terminal-primary-btn" onClick={handleSearch}>{loading ? '...' : 'Buscar'}</button>
                 </div>
                 <div className="terminal-table">
                    <div className="terminal-head" style={{ '--columns': '1fr 2fr 1fr 1fr 0.8fr' }}>
                       <span>Cód</span><span>Producto</span><span>Stock</span><span>Precio</span><span></span>
                    </div>
                    {results.map(p => (
                       <div key={p.id} className="terminal-row" style={{ '--columns': '1fr 2fr 1fr 1fr 0.8fr' }}>
                          <code>{p.codigo}</code><span>{p.nombre}</span><span>{p.stock}</span><span>{priceFormatter.format(p.precio)}</span>
                          <button className="terminal-icon-btn terminal-icon-btn-fill" onClick={() => addToCart(p)} disabled={p.stock < 1}><Plus size={14} /></button>
                       </div>
                    ))}
                 </div>
              </section>

              <section className="terminal-panel">
                 <div className="terminal-panel-header">
                    <div>
                       <h2 className="terminal-panel-title">Cliente</h2>
                       <p className="terminal-panel-sub">Vincular venta a un cliente (US006b).</p>
                    </div>
                    {!selectedCustomer && (
                       <button className="terminal-ghost-btn" style={{ fontSize: '11px' }} onClick={openNewCustomerModal}>
                          <UserPlus size={14} /> Registrar Nuevo
                       </button>
                    )}
                 </div>
                 <div style={{ position: 'relative' }}>
                    <label className="terminal-field">
                       <UserRound size={15} />
                       <input 
                          placeholder="Buscar cliente..." 
                          value={customerSearchQuery} 
                          onChange={e => !selectedCustomer && handleCustomerSearch(e.target.value)} 
                          readOnly={!!selectedCustomer}
                       />
                       {selectedCustomer && <button onClick={handleClearCustomer} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>✕</button>}
                    </label>
                    {showCustomerDropdown && customerResults.length > 0 && (
                       <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #ddd', borderRadius: '8px', zIndex: 50, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                          {customerResults.map(c => (
                             <div key={c.id} className="terminal-row" style={{ cursor: 'pointer', '--columns': '1fr' }} onClick={() => handleSelectCustomer(c)}>
                                <strong>{c.nombre}</strong> <span style={{ fontSize: '11px', opacity: 0.6 }}>{c.telefono || 'Sin tel'}</span>
                             </div>
                          ))}
                       </div>
                    )}
                 </div>
                 {selectedCustomer && (
                    <button className="terminal-ghost-btn" style={{ width: 'fit-content' }} onClick={handleShowHistory}>
                       <History size={14} /> Ver Historial
                    </button>
                 )}
              </section>
           </main>

           <aside className="terminal-stack">
              <section className="terminal-panel">
                 <h2 className="terminal-panel-title">Carrito ({cartItems.length})</h2>
                 <div className="terminal-cart-list">
                    {cartItems.map(i => (
                       <article key={i.productId} className="terminal-cart-item">
                          <div><strong>{i.nombre}</strong><span>{priceFormatter.format(i.precio)}</span></div>
                          <div className="terminal-cart-actions">
                             <button className="terminal-icon-btn" onClick={() => decrementItem(i.productId)}><Minus size={12} /></button>
                             <span>{i.quantity}</span>
                             <button className="terminal-icon-btn" onClick={() => incrementItem(i.productId)}><Plus size={12} /></button>
                             <button className="terminal-icon-btn terminal-icon-btn-danger" onClick={() => removeItem(i.productId)}><Trash2 size={12} /></button>
                          </div>
                       </article>
                    ))}
                 </div>
                 <div className="terminal-cart-total">
                    <div><span>Subtotal</span><strong>{priceFormatter.format(totals.subtotal)}</strong></div>
                    <div className="terminal-final"><span>Total</span><strong>{priceFormatter.format(totals.total)}</strong></div>
                 </div>
                 <div className="terminal-actions-bar">
                    <button className="terminal-primary-btn terminal-primary-btn-full" onClick={handleRegisterSale} disabled={cartItems.length === 0 || saleLoading}>
                       <ShoppingCart size={16} /> {saleLoading ? '...' : 'Pagar'}
                    </button>
                    {lastSaleId && <button className="terminal-ghost-btn" onClick={handlePrintTicket}><Printer size={16} /> Ticket</button>}
                 </div>
                 {saleSuccess && <p className="terminal-feedback-success text-center">{saleSuccess}</p>}
                 {saleError && <p className="terminal-feedback-error text-center">{saleError}</p>}
              </section>
           </aside>
        </div>
      </div>

      {/* Customer Create Modal */}
      {isCustomerModalOpen && (
         <div className="terminal-modal-backdrop" onClick={() => setIsCustomerModalOpen(false)}>
            <div className="terminal-modal" style={{ width: '400px' }} onClick={e => e.stopPropagation()}>
               <header className="terminal-modal-header">
                  <h3>Nuevo Cliente</h3>
                  <button className="terminal-modal-close" onClick={() => setIsCustomerModalOpen(false)}>×</button>
               </header>
               <form onSubmit={handleCreateCustomer} className="terminal-modal-body">
                  <div className="terminal-field-group">
                     <span className="terminal-mini-label">Documento</span>
                     <div className="terminal-field"><input required value={customerForm.documento} onChange={e => setCustomerForm({...customerForm, documento: e.target.value})} /></div>
                  </div>
                  <div className="terminal-field-group">
                     <span className="terminal-mini-label">Nombre</span>
                     <div className="terminal-field"><input required value={customerForm.nombre} onChange={e => setCustomerForm({...customerForm, nombre: e.target.value})} /></div>
                  </div>
                  <div className="terminal-field-group">
                     <span className="terminal-mini-label">Teléfono</span>
                     <div className="terminal-field"><input value={customerForm.telefono} onChange={e => setCustomerForm({...customerForm, telefono: e.target.value})} /></div>
                  </div>
                  <div className="terminal-modal-actions">
                     <button type="submit" className="terminal-primary-btn" disabled={loading}>Guardar Cliente</button>
                  </div>
               </form>
            </div>
         </div>
      )}

      {/* History Modal */}
      {historyModalOpen && (
         <div className="terminal-modal-backdrop" onClick={() => setHistoryModalOpen(false)}>
            <div className="terminal-modal" onClick={e => e.stopPropagation()}>
               <header className="terminal-modal-header">
                  <h3>Historial de {selectedCustomer?.nombre}</h3>
                  <button className="terminal-modal-close" onClick={() => setHistoryModalOpen(false)}>×</button>
               </header>
               <div className="terminal-modal-body">
                  <div className="terminal-table">
                     <div className="terminal-head" style={{ '--columns': '2fr 1fr 1fr' }}>
                        <span>Fecha</span><span>Venta</span><span>Total</span>
                     </div>
                     {selectedCustomerHistory.map(h => (
                        <div key={h.id} className="terminal-row" style={{ '--columns': '2fr 1fr 1fr' }}>
                           <span>{new Date(h.fecha).toLocaleDateString()}</span><span>#{h.id}</span><strong>{priceFormatter.format(h.total)}</strong>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default VendorTerminal;
