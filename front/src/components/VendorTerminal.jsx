import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  History,
  LogOut,
  Minus,
  Plus,
  Printer,
  ReceiptText,
  Search,
  ShoppingCart,
  Store,
  Trash2,
  UserRound,
  Wallet,
  X,
} from 'lucide-react';
import { authService } from '../services/authService';
import { customerService } from '../services/customerService';
import { productService } from '../services/productService';
import { saleService } from '../services/saleService';
import './terminal-templates.css';

const IVA_RATE = 0.19;
const MAX_SEARCH_RESULTS = 20;

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

  // --- cliente ---
  const [customerQuery, setCustomerQuery] = useState('');
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearching, setCustomerSearching] = useState(false);
  const [customerSearchError, setCustomerSearchError] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const customerDebounceRef = useRef(null);

  // --- historial ---
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');

  const [ticketPreview, setTicketPreview] = useState('Aun no hay ticket para mostrar.');
  const [lastSaleId, setLastSaleId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [saleError, setSaleError] = useState('');
  const [saleSuccess, setSaleSuccess] = useState('');
  const [saleLoading, setSaleLoading] = useState(false);

  const priceFormatter = useMemo(
    () => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }),
    [],
  );

  const totals = useMemo(() => {
    const subtotal = cartItems.reduce(
      (accumulator, item) => accumulator + Number(item.precio) * item.quantity,
      0,
    );
    const iva = subtotal * IVA_RATE;
    const total = subtotal + iva;

    return {
      subtotal,
      iva,
      total,
    };
  }, [cartItems]);

  const buildLocalTicket = (saleIdLabel = 'PREVIEW') => {
    if (cartItems.length === 0) {
      return 'No hay productos en el carrito para generar ticket.';
    }

    const header = [
      'POS - TIQUETE',
      `Venta #${saleIdLabel}`,
      `Fecha: ${new Date().toLocaleString('es-CO')}`,
      selectedCustomer ? `Cliente: ${selectedCustomer.nombre}` : null,
      selectedCustomer?.telefono ? `Telefono: ${selectedCustomer.telefono}` : null,
      '-----------------------------',
    ].filter(Boolean);

    const detail = cartItems.map(
      (item) => `${item.nombre} x${item.quantity}  ${priceFormatter.format(Number(item.precio) * item.quantity)}`,
    );

    const footer = [
      '-----------------------------',
      `SUBTOTAL: ${priceFormatter.format(totals.subtotal)}`,
      `IVA (19%): ${priceFormatter.format(totals.iva)}`,
      `TOTAL: ${priceFormatter.format(totals.total)}`,
    ];

    return [...header, ...detail, ...footer].join('\n');
  };

  // --- handlers cliente ---
  const handleCustomerSearch = useCallback((value) => {
    setCustomerQuery(value);
    setCustomerSearchError('');
    if (customerDebounceRef.current) clearTimeout(customerDebounceRef.current);

    if (!value.trim()) {
      setCustomerSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    customerDebounceRef.current = setTimeout(async () => {
      try {
        setCustomerSearching(true);
        const data = await customerService.search(value.trim());
        setCustomerSuggestions(Array.isArray(data) ? data.slice(0, 8) : []);
        setShowSuggestions(true);
      } catch {
        setCustomerSearchError('Error al buscar clientes.');
        setCustomerSuggestions([]);
      } finally {
        setCustomerSearching(false);
      }
    }, 320);
  }, []);

  const selectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setCustomerQuery('');
    setCustomerSuggestions([]);
    setShowSuggestions(false);
  };

  const clearCustomer = () => {
    setSelectedCustomer(null);
    setCustomerQuery('');
    setCustomerSuggestions([]);
    setShowSuggestions(false);
    setCustomerSearchError('');
  };

  // --- handlers historial ---
  const handleViewHistory = async () => {
    if (!selectedCustomer) return;
    setHistoryOpen(true);
    setHistoryError('');
    setHistoryData([]);
    try {
      setHistoryLoading(true);
      const data = await saleService.getByCustomer(selectedCustomer.id);
      setHistoryData(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al cargar historial.';
      setHistoryError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setHistoryLoading(false);
    }
  };

  const closeHistory = () => {
    setHistoryOpen(false);
    setHistoryData([]);
    setHistoryError('');
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const handleSearch = async () => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) {
      setResults([]);
      setSearchError('Ingresa un codigo o nombre para buscar.');
      return;
    }

    try {
      setLoading(true);
      setSearchError('');
      const data = await productService.search(trimmedQuery, MAX_SEARCH_RESULTS);
      setResults(Array.isArray(data) ? data : []);
      if (!data || data.length === 0) {
        setSearchError('No se encontraron productos.');
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Error al buscar productos.';
      setSearchError(message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product) => {
    setSaleError('');
    setSaleSuccess('');

    setCartItems((previous) => {
      const existing = previous.find((item) => item.productId === product.id);
      const maxStock = Number(product.stock);
      if (existing && existing.quantity >= maxStock) {
        setSaleError('No hay mas stock disponible para este producto.');
        return previous;
      }

      if (existing) {
        return previous.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                stock: maxStock,
              }
            : item,
        );
      }

      if (maxStock < 1) {
        setSaleError('El producto no tiene stock disponible.');
        return previous;
      }

      return [
        ...previous,
        {
          productId: product.id,
          codigo: product.codigo,
          nombre: product.nombre,
          precio: Number(product.precio),
          stock: maxStock,
          quantity: 1,
        },
      ];
    });
  };

  const incrementItem = (productId) => {
    setCartItems((previous) =>
      previous.map((item) => {
        if (item.productId !== productId) {
          return item;
        }

        if (item.quantity >= item.stock) {
          setSaleError('No hay mas stock disponible para este producto.');
          return item;
        }

        return { ...item, quantity: item.quantity + 1 };
      }),
    );
  };

  const decrementItem = (productId) => {
    setCartItems((previous) =>
      previous
        .map((item) =>
          item.productId === productId ? { ...item, quantity: Math.max(0, item.quantity - 1) } : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const removeItem = (productId) => {
    setCartItems((previous) => previous.filter((item) => item.productId !== productId));
  };

  const handleRegisterSale = async () => {
    if (cartItems.length === 0) {
      setSaleError('Agrega productos al carrito antes de registrar la venta.');
      return;
    }

    try {
      setSaleLoading(true);
      setSaleError('');
      setSaleSuccess('');

      const payload = {
        items: cartItems.map((item) => ({
          productId: item.productId,
          cantidad: item.quantity,
        })),
        estado: 'COMPLETED',
        ...(selectedCustomer ? { clienteId: selectedCustomer.id } : {}),
      };

      const response = await saleService.create(payload);
      const saleId = response?.id;
      const preview = response?.ticketPreview || buildLocalTicket(saleId ? String(saleId) : 'OK');

      setTicketPreview(preview);
      setLastSaleId(saleId ?? null);
      setCartItems([]);
      clearCustomer();
      setSaleSuccess(`Venta registrada correctamente${saleId ? ` (#${saleId})` : ''}.`);
    } catch (err) {
      const message = err.response?.data?.message || 'Error al registrar la venta.';
      setSaleError(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setSaleLoading(false);
    }
  };

  const handleGenerateTicket = async () => {
    if (lastSaleId) {
      try {
        setSaleError('');
        const response = await saleService.getTicket(lastSaleId);
        const printableText = response?.printableText;
        if (printableText) {
          setTicketPreview(printableText);
          return;
        }
      } catch (err) {
        const message = err.response?.data?.message || 'No fue posible obtener el ticket del backend.';
        setSaleError(Array.isArray(message) ? message.join(', ') : message);
      }
    }

    setTicketPreview(buildLocalTicket(lastSaleId ? String(lastSaleId) : 'PREVIEW'));
  };

  const handlePrintTicket = () => {
    if (!ticketPreview || ticketPreview === 'Aun no hay ticket para mostrar.') {
      setSaleError('Genera un ticket antes de imprimir.');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=420,height=720');
    if (!printWindow) {
      setSaleError('No se pudo abrir la vista de impresion. Verifica bloqueadores de ventanas.');
      return;
    }

    const content = escapeHtml(ticketPreview).replaceAll('\n', '<br/>');

    printWindow.document.write(`
      <!doctype html>
      <html lang="es">
        <head>
          <meta charset="UTF-8" />
          <title>Tiquete POS</title>
          <style>
            body {
              font-family: Consolas, 'Courier New', monospace;
              padding: 16px;
              font-size: 12px;
              color: #111827;
            }
            .ticket {
              border: 1px dashed #9ca3af;
              border-radius: 8px;
              padding: 12px;
              line-height: 1.45;
              white-space: normal;
            }
            @media print {
              body { margin: 0; padding: 0; }
              .ticket { border: none; }
            }
          </style>
        </head>
        <body>
          <div class="ticket">${content}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="terminal-page">
      <div className="terminal-shell terminal-shell-animated">
        <header className="terminal-header">
          <div className="terminal-header-main">
            <div className="terminal-badge terminal-badge-vendor">
              <Store size={24} />
            </div>
            <div className="terminal-meta">
              <span className="terminal-kicker">Terminal POS</span>
              <h1 className="terminal-title">Registro de Ventas</h1>
              <p className="terminal-subtitle">Busqueda de productos, carrito, cierre de venta y ticket.</p>
            </div>
          </div>

          <div className="terminal-user">
            <div className="terminal-user-chip">
              <strong>{user?.nombre ?? 'Vendedor'}</strong>
              <span>{user?.email ?? 'vendedor@pos.com'}</span>
            </div>
            <button type="button" onClick={handleLogout} className="terminal-logout">
              <LogOut size={16} />
              Cerrar sesion
            </button>
          </div>
        </header>

        <div className="terminal-vendor-grid">
          <section className="terminal-panel">
            <div className="terminal-panel-header">
              <div>
                <h2 className="terminal-panel-title">Busqueda de Productos</h2>
                <p className="terminal-panel-sub">Consulta por codigo o nombre y agrega al carrito.</p>
              </div>
            </div>

            <div className="terminal-toolbar terminal-toolbar-vendor">
              <label className="terminal-field">
                <button type="button" className="terminal-input-action" onClick={handleSearch} aria-label="Buscar">
                  <Search size={15} />
                </button>
                <input
                  type="text"
                  placeholder="Buscar producto"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </label>
              <button
                type="button"
                className="terminal-primary-btn terminal-primary-btn-sm"
                onClick={handleSearch}
                disabled={loading}
              >
                {loading ? 'Buscando...' : 'Buscar'}
              </button>
            </div>

            {searchError && <p className="terminal-panel-sub">{searchError}</p>}

            <div className="terminal-table terminal-table-scroll">
              <div className="terminal-head" style={{ '--columns': '0.9fr 1.6fr 0.7fr 0.8fr 0.8fr' }}>
                <span>Codigo</span>
                <span>Producto</span>
                <span>Stock</span>
                <span>Precio</span>
                <span>Agregar</span>
              </div>

              {results.map((product) => (
                <div key={product.id} className="terminal-row" style={{ '--columns': '0.9fr 1.6fr 0.7fr 0.8fr 0.8fr' }}>
                  <span>{product.codigo}</span>
                  <span>{product.nombre}</span>
                  <span>{product.stock}</span>
                  <span>{priceFormatter.format(Number(product.precio))}</span>
                  <div className="terminal-actions">
                    <button
                      type="button"
                      className="terminal-icon-btn terminal-icon-btn-fill"
                      aria-label="Agregar producto"
                      onClick={() => addToCart(product)}
                      disabled={Number(product.stock) < 1}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Sección cliente (US006b) ── */}
            <div className="terminal-field-group">
              <div className="terminal-customer-label-row">
                <label className="terminal-mini-label">Cliente (opcional)</label>
                {selectedCustomer && (
                  <button
                    type="button"
                    className="terminal-customer-history-btn"
                    onClick={handleViewHistory}
                    title="Ver historial de compras"
                  >
                    <History size={13} />
                    Historial
                  </button>
                )}
              </div>

              {selectedCustomer ? (
                <div className="terminal-customer-chip">
                  <UserRound size={15} />
                  <div className="terminal-customer-chip-info">
                    <strong>{selectedCustomer.nombre}</strong>
                    {selectedCustomer.telefono && <span>{selectedCustomer.telefono}</span>}
                  </div>
                  <button
                    type="button"
                    className="terminal-icon-btn"
                    aria-label="Quitar cliente"
                    onClick={clearCustomer}
                  >
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <div className="terminal-customer-search-wrap">
                  <label className="terminal-field">
                    {customerSearching ? <ChevronDown size={15} className="terminal-spin" /> : <UserRound size={15} />}
                    <input
                      type="text"
                      placeholder="Buscar cliente por nombre o telefono"
                      value={customerQuery}
                      onChange={(e) => handleCustomerSearch(e.target.value)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 180)}
                      onFocus={() => customerSuggestions.length > 0 && setShowSuggestions(true)}
                      autoComplete="off"
                    />
                  </label>

                  {showSuggestions && customerSuggestions.length > 0 && (
                    <ul className="terminal-customer-dropdown">
                      {customerSuggestions.map((c) => (
                        <li key={c.id}>
                          <button
                            type="button"
                            className="terminal-customer-option"
                            onMouseDown={() => selectCustomer(c)}
                          >
                            <strong>{c.nombre}</strong>
                            {c.telefono && <span>{c.telefono}</span>}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {customerSearchError && (
                    <p className="terminal-panel-sub terminal-feedback-error">{customerSearchError}</p>
                  )}
                </div>
              )}
            </div>
          </section>

          <aside className="terminal-panel">
            <div className="terminal-panel-header">
              <div>
                <h2 className="terminal-panel-title">
                  Carrito
                  {cartItems.length > 0 && (
                    <span className="terminal-cart-badge">{cartItems.length}</span>
                  )}
                </h2>
                <p className="terminal-panel-sub">
                  {cartItems.length === 0
                    ? 'Agrega productos desde la busqueda.'
                    : `${cartItems.reduce((a, i) => a + i.quantity, 0)} unidades · ${cartItems.length} ${cartItems.length === 1 ? 'producto' : 'productos'}`}
                </p>
              </div>
              {cartItems.length > 0 && (
                <button
                  type="button"
                  className="terminal-ghost-btn terminal-ghost-btn-sm terminal-ghost-btn-danger"
                  onClick={() => { setCartItems([]); setSaleError(''); setSaleSuccess(''); }}
                  title="Vaciar carrito"
                >
                  <Trash2 size={13} />
                  Vaciar
                </button>
              )}
            </div>

            <div className="terminal-cart-list">
              {cartItems.length === 0 && (
                <article className="terminal-cart-item">
                  <div>
                    <strong>Carrito vacio</strong>
                    <span>Agrega productos desde la busqueda.</span>
                  </div>
                </article>
              )}

              {cartItems.map((item) => (
                <article key={item.productId} className="terminal-cart-item">
                  <div>
                    <strong>{item.nombre}</strong>
                    <span>
                      {item.quantity} x {priceFormatter.format(Number(item.precio))}
                    </span>
                  </div>
                  <div className="terminal-cart-actions">
                    <button
                      type="button"
                      className="terminal-icon-btn"
                      aria-label="Disminuir cantidad"
                      onClick={() => decrementItem(item.productId)}
                    >
                      <Minus size={14} />
                    </button>
                    <button
                      type="button"
                      className="terminal-icon-btn"
                      aria-label="Aumentar cantidad"
                      onClick={() => incrementItem(item.productId)}
                    >
                      <Plus size={14} />
                    </button>
                    <strong>{priceFormatter.format(Number(item.precio) * item.quantity)}</strong>
                    <button
                      type="button"
                      className="terminal-icon-btn terminal-icon-btn-danger"
                      aria-label="Eliminar item"
                      onClick={() => removeItem(item.productId)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div className="terminal-cart-total">
              <div>
                <span>Subtotal</span>
                <strong>{priceFormatter.format(totals.subtotal)}</strong>
              </div>
              <div>
                <span>IVA (19%)</span>
                <strong>{priceFormatter.format(totals.iva)}</strong>
              </div>
              <div className="terminal-final">
                <span>Total</span>
                <strong>{priceFormatter.format(totals.total)}</strong>
              </div>
            </div>

            {(saleError || saleSuccess) && (
              <p className={`terminal-panel-sub ${saleError ? 'terminal-feedback-error' : 'terminal-feedback-success'}`}>
                {saleError || saleSuccess}
              </p>
            )}

            <div className="terminal-actions-bar">
              <button
                type="button"
                className="terminal-primary-btn terminal-primary-btn-full"
                onClick={handleRegisterSale}
                disabled={saleLoading || cartItems.length === 0}
              >
                <ShoppingCart size={15} />
                {saleLoading ? 'Registrando...' : 'Registrar venta'}
              </button>
              <button type="button" className="terminal-ghost-btn" onClick={handleGenerateTicket}>
                <ReceiptText size={15} />
                Generar ticket
              </button>
              <button type="button" className="terminal-ghost-btn" onClick={handlePrintTicket}>
                <Printer size={15} />
                Imprimir
              </button>
            </div>

            <div className="terminal-ticket">{ticketPreview}</div>

            <div className="terminal-summary-strip">
              <div>
                <Wallet size={16} />
                <span>
                  Caja activa
                  {selectedCustomer && (
                    <> &mdash; <strong>{selectedCustomer.nombre}</strong></>
                  )}
                  {cartItems.length > 0 && (
                    <> &mdash; {cartItems.reduce((a, i) => a + i.quantity, 0)} unid.
                      ({priceFormatter.format(totals.total)})</>
                  )}
                </span>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ── Modal historial de compras (US014) ── */}
      {historyOpen && (
        <div className="terminal-modal-backdrop" role="dialog" aria-modal="true" aria-label="Historial de compras">
          <div className="terminal-modal terminal-modal-wide">
            <div className="terminal-modal-header">
              <div>
                <h3>Historial de compras</h3>
                {selectedCustomer && (
                  <p>{selectedCustomer.nombre}{selectedCustomer.telefono ? ` · ${selectedCustomer.telefono}` : ''}</p>
                )}
              </div>
              <button type="button" className="terminal-modal-close" onClick={closeHistory} aria-label="Cerrar">
                &times;
              </button>
            </div>

            <div className="terminal-modal-body">
              {historyLoading && <p className="terminal-panel-sub">Cargando historial...</p>}
              {historyError && <p className="terminal-modal-error">{historyError}</p>}
              {!historyLoading && !historyError && historyData.length === 0 && (
                <p className="terminal-panel-sub">Este cliente no tiene ventas registradas.</p>
              )}

              {historyData.length > 0 && (
                <div className="terminal-history-list">
                  {historyData.map((sale) => (
                    <details key={sale.id} className="terminal-history-item">
                      <summary className="terminal-history-summary">
                        <span className="terminal-history-id">#{sale.id}</span>
                        <span className="terminal-history-date">
                          {new Date(sale.fecha).toLocaleString('es-CO', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </span>
                        <span className="terminal-history-total">
                          {priceFormatter.format(Number(sale.total))}
                        </span>
                        <span className={`terminal-pill ${
                          sale.estado === 'COMPLETED' ? 'terminal-pill-ok' :
                          sale.estado === 'CANCELLED' ? 'terminal-pill-alert' :
                          'terminal-pill-muted'
                        }`}>{sale.estado}</span>
                        <ChevronDown size={14} className="terminal-history-chevron" />
                      </summary>
                      <ul className="terminal-history-items">
                        {sale.items.map((item) => (
                          <li key={item.id}>
                            <span>{item.nombre}</span>
                            <span>{item.cantidad} x {priceFormatter.format(Number(item.precio_unitario))}</span>
                            <span>{priceFormatter.format(Number(item.subtotal))}</span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  ))}
                </div>
              )}
            </div>

            <div className="terminal-modal-actions">
              <button type="button" className="terminal-ghost-btn" onClick={closeHistory}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorTerminal;
