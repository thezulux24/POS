import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
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
import { authService } from '../services/authService';
import { productService } from '../services/productService';
import './terminal-templates.css';

const CART_ITEMS = [
  { name: 'Audifonos Bluetooth', qty: 1, price: '$150,000', subtotal: '$150,000' },
  { name: 'Caja de Chocolates', qty: 2, price: '$25,000', subtotal: '$50,000' },
  { name: 'Cable USB-C', qty: 1, price: '$18,000', subtotal: '$18,000' },
];

const TICKET_PREVIEW = `POS - TIQUETE\nVenta #000145\n-----------------------------\nAudifonos Bluetooth  x1\nCaja de Chocolates   x2\nCable USB-C          x1\n-----------------------------\nSUBTOTAL: $218,000\nIVA (19%): $41,420\nTOTAL: $259,420`;

const VendorTerminal = () => {
  const user = authService.getCurrentUser();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const priceFormatter = useMemo(
    () => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }),
    [],
  );

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const handleSearch = async () => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) {
      setResults([]);
      setError('Ingresa un codigo o nombre para buscar.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const data = await productService.search(trimmedQuery, 20);
      setResults(Array.isArray(data) ? data : []);
      if (!data || data.length === 0) {
        setError('No se encontraron productos.');
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Error al buscar productos.';
      setError(message);
      setResults([]);
    } finally {
      setLoading(false);
    }
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

            {error && <p className="terminal-panel-sub">{error}</p>}

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
                    <button type="button" className="terminal-icon-btn terminal-icon-btn-fill" aria-label="Agregar producto">
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
                  <input type="text" placeholder="Nombre del cliente" readOnly value="" />
                </label>
              </div>

              <div className="terminal-field-group">
                <label className="terminal-mini-label">Telefono</label>
                <label className="terminal-field">
                  <Phone size={15} />
                  <input type="text" placeholder="Telefono" readOnly value="" />
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
              {CART_ITEMS.map((item) => (
                <article key={item.name} className="terminal-cart-item">
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.qty} x {item.price}</span>
                  </div>
                  <div className="terminal-cart-actions">
                    <button type="button" className="terminal-icon-btn" aria-label="Disminuir cantidad">
                      <Minus size={14} />
                    </button>
                    <strong>{item.subtotal}</strong>
                    <button type="button" className="terminal-icon-btn terminal-icon-btn-danger" aria-label="Eliminar item">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div className="terminal-cart-total">
              <div>
                <span>Subtotal</span>
                <strong>$218,000</strong>
              </div>
              <div>
                <span>IVA (19%)</span>
                <strong>$41,420</strong>
              </div>
              <div className="terminal-final">
                <span>Total</span>
                <strong>$259,420</strong>
              </div>
            </div>

            <div className="terminal-actions-bar">
              <button type="button" className="terminal-primary-btn terminal-primary-btn-full">
                <ShoppingCart size={15} />
                Registrar venta
              </button>
              <button type="button" className="terminal-ghost-btn">
                <ReceiptText size={15} />
                Generar ticket
              </button>
              <button type="button" className="terminal-ghost-btn">
                <Printer size={15} />
                Imprimir
              </button>
            </div>

            <div className="terminal-ticket">{TICKET_PREVIEW}</div>

            <div className="terminal-summary-strip">
              <div>
                <Wallet size={16} />
                <span>Caja activa - Turno de ventas habilitado</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default VendorTerminal;
