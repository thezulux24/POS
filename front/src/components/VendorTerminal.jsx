import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  FileDown,
  LogOut,
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
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { authService } from '../services/authService';
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
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
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
      customerName.trim() ? `Cliente: ${customerName.trim()}` : null,
      customerPhone.trim() ? `Telefono: ${customerPhone.trim()}` : null,
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
      };

      const response = await saleService.create(payload);
      const saleId = response?.id;
      const preview = response?.ticketPreview || buildLocalTicket(saleId ? String(saleId) : 'OK');

      setTicketPreview(preview);
      setLastSaleId(saleId ?? null);
      setCartItems([]);
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

  const handleLoadReport = async () => {
    try {
      setReportLoading(true);
      setReportError('');
      const data = await saleService.getDailyReport({ date: reportDate });
      setReportData(data);
    } catch (err) {
      const message = err.response?.data?.message || 'Error al cargar reporte diario.';
      setReportError(Array.isArray(message) ? message.join(', ') : message);
      setReportData(null);
    } finally {
      setReportLoading(false);
    }
  };

  const handleDownloadReportPdf = () => {
    if (!reportData) {
      setReportError('Genera el reporte antes de descargar el PDF.');
      return;
    }

    const printableDate = reportData.date || reportDate;
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text('Reporte Diario de Ventas', 14, 16);
    doc.setFontSize(10);
    doc.text(`Fecha: ${printableDate}`, 14, 24);
    doc.text(`Vendedor: ${user?.nombre ?? 'Vendedor'}`, 14, 30);
    doc.text(`Total ventas (conteo): ${Number(reportData.totalSales ?? 0)}`, 14, 36);
    doc.text(`Suma total del dia: ${priceFormatter.format(Number(reportData.totalAmount ?? 0))}`, 14, 42);

    const rows = Array.isArray(reportData.sales)
      ? reportData.sales.map((sale) => [
          dateTimeFormatter.format(new Date(sale.fecha)),
          String(sale.id),
          sale.vendedor?.nombre || user?.nombre || 'N/A',
          priceFormatter.format(Number(sale.total ?? 0)),
        ])
      : [];

    autoTable(doc, {
      startY: 48,
      head: [['Hora y fecha', 'ID venta', 'Vendedor', 'Total']],
      body: rows,
      styles: {
        fontSize: 9,
      },
      headStyles: {
        fillColor: [31, 41, 55],
      },
    });

    doc.save(`reporte-ventas-${printableDate}.pdf`);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSearch();
    }
  };

  React.useEffect(() => {
    void handleLoadReport();
  }, []);

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

            <div className="terminal-form-grid">
              <div className="terminal-field-group">
                <label className="terminal-mini-label">Cliente</label>
                <label className="terminal-field">
                  <UserRound size={15} />
                  <input
                    type="text"
                    placeholder="Nombre del cliente"
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                  />
                </label>
              </div>

              <div className="terminal-field-group">
                <label className="terminal-mini-label">Telefono</label>
                <label className="terminal-field">
                  <Phone size={15} />
                  <input
                    type="text"
                    placeholder="Telefono"
                    value={customerPhone}
                    onChange={(event) => setCustomerPhone(event.target.value)}
                  />
                </label>
              </div>
            </div>
          </section>

          <aside className="terminal-panel">
            <div className="terminal-panel-header">
              <div>
                <h2 className="terminal-panel-title">Carrito</h2>
                <p className="terminal-panel-sub">Detalle de productos y total de la venta.</p>
              </div>
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

            <section className="terminal-panel" style={{ marginTop: '16px' }}>
              <div className="terminal-panel-header">
                <div>
                  <h2 className="terminal-panel-title">Reporte Diario</h2>
                  <p className="terminal-panel-sub">Consulta tus ventas del dia y descarga PDF.</p>
                </div>
              </div>

              <div className="terminal-toolbar terminal-toolbar-vendor">
                <label className="terminal-field">
                  <CalendarDays size={15} />
                  <input type="date" value={reportDate} onChange={(event) => setReportDate(event.target.value)} />
                </label>
                <button
                  type="button"
                  className="terminal-primary-btn terminal-primary-btn-sm"
                  onClick={handleLoadReport}
                  disabled={reportLoading}
                >
                  {reportLoading ? 'Consultando...' : 'Consultar'}
                </button>
              </div>

              {reportError && <p className="terminal-panel-sub terminal-feedback-error">{reportError}</p>}

              <div className="terminal-actions-bar" style={{ marginTop: '12px' }}>
                <button type="button" className="terminal-ghost-btn" onClick={handleDownloadReportPdf}>
                  <FileDown size={15} />
                  Descargar PDF
                </button>
              </div>

              <div className="terminal-summary-strip" style={{ marginTop: '12px' }}>
                <div>
                  <span>
                    Ventas: {Number(reportData?.totalSales ?? 0)}
                  </span>
                </div>
                <div>
                  <span>
                    Total dia: {priceFormatter.format(Number(reportData?.totalAmount ?? 0))}
                  </span>
                </div>
              </div>

              <div className="terminal-table terminal-table-scroll" style={{ marginTop: '12px' }}>
                <div className="terminal-head" style={{ '--columns': '1.3fr 0.6fr 1.1fr 0.8fr' }}>
                  <span>Hora y fecha</span>
                  <span>ID</span>
                  <span>Vendedor</span>
                  <span>Total</span>
                </div>

                {(reportData?.sales ?? []).map((sale) => (
                  <div key={sale.id} className="terminal-row" style={{ '--columns': '1.3fr 0.6fr 1.1fr 0.8fr' }}>
                    <span>{dateTimeFormatter.format(new Date(sale.fecha))}</span>
                    <span>{sale.id}</span>
                    <span>{sale.vendedor?.nombre ?? user?.nombre ?? 'N/A'}</span>
                    <span>{priceFormatter.format(Number(sale.total))}</span>
                  </div>
                ))}
              </div>
            </section>

            <div className="terminal-summary-strip">
              <div>
                <Wallet size={16} />
                <span>
                  Caja activa - {cartItems.length} item{cartItems.length === 1 ? '' : 's'} en carrito
                </span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default VendorTerminal;
