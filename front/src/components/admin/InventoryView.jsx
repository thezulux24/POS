import React, { useEffect, useState, useMemo } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Tags, 
  Filter, 
  Pencil, 
  Trash2, 
  History,
  AlertTriangle,
  Blocks
} from 'lucide-react';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';
import { supplierService } from '../../services/supplierService';
import { stockService } from '../../services/stockService';

const InventoryView = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortFilter, setSortFilter] = useState('nombre-asc');

  // Modal States
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const [productForm, setProductForm] = useState({
    codigo: '',
    nombre: '',
    precio: '',
    stock: '0',
    stockMinimo: '5',
    categoryId: '',
    supplierId: '',
    activo: true,
  });

  const [stockForm, setStockForm] = useState({
    cantidad: '',
    tipo: 'ENTRADA',
    motivo: 'REABASTECIMIENTO'
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodData, catData, supData] = await Promise.all([
        productService.list({ includeInactive: 'false' }),
        categoryService.list({ includeInactive: 'false' }),
        supplierService.list({ includeInactive: 'false' })
      ]);
      setProducts(Array.isArray(prodData) ? prodData : []);
      setCategories(Array.isArray(catData) ? catData : []);
      setSuppliers(Array.isArray(supData) ? supData : []);
    } catch (err) {
      setError('Error al cargar datos de inventario. Verifica la conexión.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const priceFormatter = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' });

  const filteredProducts = useMemo(() => {
    let result = [...products];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => p.nombre.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q));
    }
    if (categoryFilter) {
      result = result.filter(p => String(p.categoryId) === categoryFilter);
    }
    result.sort((a, b) => {
      switch (sortFilter) {
        case 'precio-asc': return a.precio - b.precio;
        case 'precio-desc': return b.precio - a.precio;
        case 'stock-asc': return a.stock - b.stock;
        default: return a.nombre.localeCompare(b.nombre);
      }
    });
    return result;
  }, [products, searchQuery, categoryFilter, sortFilter]);

  // Handlers
  const openCreateModal = () => {
    setSelectedProduct(null);
    setProductForm({
      codigo: '',
      nombre: '',
      precio: '',
      stock: '0',
      stockMinimo: '5',
      categoryId: '',
      supplierId: '',
      activo: true,
    });
    setFormError('');
    setFormSuccess('');
    setIsProductModalOpen(true);
  };

  const openEditModal = (product) => {
    setSelectedProduct(product);
    setProductForm({
      codigo: product.codigo,
      nombre: product.nombre,
      precio: String(product.precio),
      stock: String(product.stock),
      stockMinimo: String(product.stockMinimo || 5),
      categoryId: String(product.categoryId),
      supplierId: product.supplierId ? String(product.supplierId) : '',
      activo: product.activo,
    });
    setFormError('');
    setFormSuccess('');
    setIsProductModalOpen(true);
  };

  const openStockModal = (product) => {
    setSelectedProduct(product);
    setStockForm({ cantidad: '', tipo: 'ENTRADA', motivo: 'REABASTECIMIENTO' });
    setFormError('');
    setIsStockModalOpen(true);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    try {
      const payload = {
        ...productForm,
        precio: Number(productForm.precio),
        stock: Number(productForm.stock),
        stockMinimo: Number(productForm.stockMinimo),
        categoryId: Number(productForm.categoryId),
        supplierId: productForm.supplierId ? Number(productForm.supplierId) : null,
      };

      if (selectedProduct) {
        await productService.update(selectedProduct.id, payload);
        setFormSuccess('Producto actualizado correctamente');
      } else {
        await productService.create(payload);
        setFormSuccess('Producto creado correctamente');
      }
      setTimeout(() => {
        setIsProductModalOpen(false);
        loadData();
      }, 1000);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error al guardar producto');
    } finally {
      setFormLoading(false);
    }
  };

  const handleStockSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await stockService.adjust({
        productId: selectedProduct.id,
        cantidad: Number(stockForm.cantidad),
        tipo: stockForm.tipo,
        motivo: stockForm.motivo
      });
      setIsStockModalOpen(false);
      loadData();
    } catch (err) {
      setFormError('Error al ajustar stock');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    setFormLoading(true);
    try {
      await productService.remove(selectedProduct.id);
      setIsDeleteModalOpen(false);
      loadData();
    } catch (err) {
      setFormError('Error al eliminar producto');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="view-panel">
      <header className="terminal-header" style={{ border: 'none', background: 'transparent', padding: '0 0 24px', boxShadow: 'none' }}>
        <div className="terminal-header-main">
          <div className="terminal-badge terminal-badge-admin">
            <Package size={24} />
          </div>
          <div className="terminal-meta">
            <span className="terminal-kicker">Catálogo & Stock</span>
            <h1 className="terminal-title">Gestión de Inventario</h1>
            <p className="terminal-subtitle">Administra productos, niveles de stock y categorías.</p>
          </div>
        </div>
      </header>

      <section className="terminal-panel">
        <div className="terminal-panel-header">
           <div>
              <h2 className="terminal-panel-title">Lista de Productos</h2>
              <p className="terminal-panel-sub">Control central de existencias.</p>
           </div>
           <button className="terminal-primary-btn" onClick={openCreateModal}>
              <Plus size={15} /> Nuevo Producto
           </button>
        </div>

        <div className="terminal-toolbar">
          <label className="terminal-field" style={{ flex: 2 }}>
            <Search size={15} />
            <input 
              type="text" 
              placeholder="Buscar por código o nombre..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </label>
          <label className="terminal-field">
            <Tags size={15} />
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="">Todas las categorías</option>
              {categories.map(c => <option key={c.id} value={String(c.id)}>{c.nombre}</option>)}
            </select>
          </label>
          <label className="terminal-field">
            <Filter size={15} />
            <select value={sortFilter} onChange={(e) => setSortFilter(e.target.value)}>
              <option value="nombre-asc">Nombre A-Z</option>
              <option value="precio-asc">Precio menor</option>
              <option value="precio-desc">Precio mayor</option>
              <option value="stock-asc">Stock crítico primero</option>
            </select>
          </label>
        </div>

        <div className="terminal-table terminal-table-scroll">
          <div className="terminal-head" style={{ '--columns': '0.8fr 1.8fr 1fr 0.9fr 0.8fr 1.2fr' }}>
            <span>Cód</span>
            <span>Nombre</span>
            <span>Categoría</span>
            <span>Precio</span>
            <span>Stock</span>
            <span>Acciones</span>
          </div>
          {loading ? (
             <div style={{ padding: '40px', textAlign: 'center' }}>Cargando inventario...</div>
          ) : filteredProducts.length === 0 ? (
             <div style={{ padding: '40px', textAlign: 'center', opacity: 0.5 }}>No hay productos</div>
          ) : (
            filteredProducts.map(p => (
              <div key={p.id} className="terminal-row" style={{ '--columns': '0.8fr 1.8fr 1fr 0.9fr 0.8fr 1.2fr' }}>
                <code style={{ fontSize: '11px', background: '#f1f5f9', padding: '2px 4px', borderRadius: '4px' }}>{p.codigo}</code>
                <span className="font-medium">{p.nombre}</span>
                <span>{p.category?.nombre}</span>
                <span>{priceFormatter.format(p.precio)}</span>
                <span className={`terminal-pill ${p.stock <= (p.stockMinimo || 5) ? 'terminal-pill-alert' : 'terminal-pill-ok'}`}>
                   {p.stock}
                </span>
                <div className="terminal-actions">
                  <button className="terminal-icon-btn" onClick={() => openStockModal(p)} title="Ajuste de Stock"><History size={14} /></button>
                  <button className="terminal-icon-btn" onClick={() => openEditModal(p)} title="Editar"><Pencil size={14} /></button>
                  <button className="terminal-icon-btn terminal-icon-btn-danger" onClick={() => { setSelectedProduct(p); setIsDeleteModalOpen(true); }} title="Eliminar"><Trash2 size={14} /></button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Product Modal */}
      {isProductModalOpen && (
        <div className="terminal-modal-backdrop" onClick={() => setIsProductModalOpen(false)}>
          <div className="terminal-modal" onClick={e => e.stopPropagation()}>
            <header className="terminal-modal-header">
              <div>
                <h3>{selectedProduct ? 'Editar Producto' : 'Nuevo Producto'}</h3>
                <p>Ingresa los detalles técnicos del artículo.</p>
              </div>
              <button className="terminal-modal-close" onClick={() => setIsProductModalOpen(false)}>×</button>
            </header>
            <form onSubmit={handleProductSubmit} className="terminal-modal-body">
              <div className="terminal-form-grid">
                <label className="terminal-field-group">
                  <span className="terminal-mini-label">Código</span>
                  <div className="terminal-field"><input required value={productForm.codigo} onChange={e => setProductForm({...productForm, codigo: e.target.value})} /></div>
                </label>
                <label className="terminal-field-group">
                  <span className="terminal-mini-label">Nombre</span>
                  <div className="terminal-field"><input required value={productForm.nombre} onChange={e => setProductForm({...productForm, nombre: e.target.value})} /></div>
                </label>
                <label className="terminal-field-group">
                  <span className="terminal-mini-label">Precio</span>
                  <div className="terminal-field"><input type="number" required value={productForm.precio} onChange={e => setProductForm({...productForm, precio: e.target.value})} /></div>
                </label>
                <label className="terminal-field-group">
                  <span className="terminal-mini-label">Stock Inicial</span>
                  <div className="terminal-field"><input type="number" required disabled={!!selectedProduct} value={productForm.stock} onChange={e => setProductForm({...productForm, stock: e.target.value})} /></div>
                </label>
                <label className="terminal-field-group">
                  <span className="terminal-mini-label">Stock Mínimo</span>
                  <div className="terminal-field"><input type="number" required value={productForm.stockMinimo} onChange={e => setProductForm({...productForm, stockMinimo: e.target.value})} /></div>
                </label>
                <label className="terminal-field-group">
                  <span className="terminal-mini-label">Categoría</span>
                  <div className="terminal-field">
                    <select required value={productForm.categoryId} onChange={e => setProductForm({...productForm, categoryId: e.target.value})}>
                      <option value="">Seleccionar...</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>
                  </div>
                </label>
                <label className="terminal-field-group">
                   <span className="terminal-mini-label">Proveedor</span>
                   <div className="terminal-field">
                      <select required value={productForm.supplierId} onChange={e => setProductForm({...productForm, supplierId: e.target.value})}>
                         <option value="">Seleccionar...</option>
                         {suppliers.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                      </select>
                   </div>
                </label>
              </div>
              {formError && <p className="terminal-modal-error">{formError}</p>}
              {formSuccess && <p className="terminal-modal-success">{formSuccess}</p>}
              <div className="terminal-modal-actions">
                <button type="button" className="terminal-ghost-btn" onClick={() => setIsProductModalOpen(false)}>Cancelar</button>
                <button type="submit" className="terminal-primary-btn" disabled={formLoading}>{formLoading ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {isStockModalOpen && (
        <div className="terminal-modal-backdrop" onClick={() => setIsStockModalOpen(false)}>
          <div className="terminal-modal" style={{ width: '400px' }} onClick={e => e.stopPropagation()}>
             <header className="terminal-modal-header">
                <div><h3>Ajustar Stock</h3><p>{selectedProduct?.nombre}</p></div>
                <button className="terminal-modal-close" onClick={() => setIsStockModalOpen(false)}>×</button>
             </header>
             <form onSubmit={handleStockSubmit} className="terminal-modal-body">
                <div className="terminal-field-group">
                   <span className="terminal-mini-label">Cantidad</span>
                   <div className="terminal-field"><input type="number" required value={stockForm.cantidad} onChange={e => setStockForm({...stockForm, cantidad: e.target.value})} /></div>
                </div>
                <div className="terminal-field-group">
                   <span className="terminal-mini-label">Tipo</span>
                   <div className="terminal-field">
                      <select value={stockForm.tipo} onChange={e => setStockForm({...stockForm, tipo: e.target.value})}>
                         <option value="ENTRADA">Entrada (+)</option>
                         <option value="SALIDA">Salida (-)</option>
                      </select>
                   </div>
                </div>
                <div className="terminal-field-group">
                   <span className="terminal-mini-label">Motivo</span>
                   <div className="terminal-field"><input value={stockForm.motivo} onChange={e => setStockForm({...stockForm, motivo: e.target.value})} /></div>
                </div>
                <div className="terminal-modal-actions">
                   <button type="submit" className="terminal-primary-btn" disabled={formLoading}>Confirmar Ajuste</button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="terminal-modal-backdrop" onClick={() => setIsDeleteModalOpen(false)}>
          <div className="terminal-modal" style={{ width: '400px' }} onClick={e => e.stopPropagation()}>
            <header className="terminal-modal-header">
               <h3>Confirmar Eliminación</h3>
            </header>
            <div className="terminal-modal-body">
               <p className="terminal-panel-sub">¿Estás seguro de eliminar el producto <strong>{selectedProduct?.nombre}</strong>? Esta acción no se puede deshacer.</p>
               <div className="terminal-modal-actions">
                  <button className="terminal-ghost-btn" onClick={() => setIsDeleteModalOpen(false)}>Cancelar</button>
                  <button className="terminal-primary-btn" style={{ background: '#ef4444', border: 'none' }} onClick={handleDelete}>Eliminar Definitivamente</button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryView;
