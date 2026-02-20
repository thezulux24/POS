import React, { useEffect, useMemo, useState } from 'react';
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
import { categoryService } from '../services/categoryService';
import { productService } from '../services/productService';
import { providerService } from '../services/providerService';
import './terminal-templates.css';

const DASHBOARD_STATS = [
  { label: 'Productos activos', value: '286', note: 'Catalogo disponible', tone: 'ok' },
  { label: 'Categorias', value: '8', note: 'Todas operativas', tone: 'ok' },
  { label: 'Stock bajo', value: '14', note: 'Requiere reposicion', tone: 'alert' },
  { label: 'Actualizaciones hoy', value: '21', note: 'Cambios en inventario', tone: 'neutral' },
];

const INVENTORY_UPDATES = [
  { action: 'Actualizacion de precio', target: 'PROD-010 - Cable USB-C', user: 'admin@pos.com', time: '08:40' },
  { action: 'Ajuste de stock', target: 'PROD-022 - Termo Acero 1L', user: 'admin@pos.com', time: '08:25' },
  { action: 'Nuevo producto', target: 'PROD-033 - Organizador Cajon', user: 'admin@pos.com', time: '08:10' },
];

const AdminTerminal = () => {
  const user = authService.getCurrentUser();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');
  const [categories, setCategories] = useState([]);
  const [providers, setProviders] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortFilter, setSortFilter] = useState('nombre-asc');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [productToDelete, setProductToDelete] = useState(null);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [isCategoryCreateOpen, setIsCategoryCreateOpen] = useState(false);
  const [categoryCreateLoading, setCategoryCreateLoading] = useState(false);
  const [categoryCreateError, setCategoryCreateError] = useState('');
  const [categoryCreateSuccess, setCategoryCreateSuccess] = useState('');
  const [categoryCreateForm, setCategoryCreateForm] = useState({
    nombre: '',
    activo: true,
  });
  const [isCategoryEditOpen, setIsCategoryEditOpen] = useState(false);
  const [categoryEditLoading, setCategoryEditLoading] = useState(false);
  const [categoryEditError, setCategoryEditError] = useState('');
  const [categoryEditSuccess, setCategoryEditSuccess] = useState('');
  const [categoryEditForm, setCategoryEditForm] = useState({
    id: null,
    nombre: '',
    activo: true,
  });
  const [isCategoryDeleteOpen, setIsCategoryDeleteOpen] = useState(false);
  const [categoryDeleteLoading, setCategoryDeleteLoading] = useState(false);
  const [categoryDeleteError, setCategoryDeleteError] = useState('');
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [editForm, setEditForm] = useState({
    id: null,
    codigo: '',
    nombre: '',
    precio: '',
    stock: '0',
    categoryId: '',
    providerId: '',
    activo: true,
  });
  const [createForm, setCreateForm] = useState({
    codigo: '',
    nombre: '',
    precio: '',
    stock: '0',
    categoryId: '',
    providerId: '',
    activo: true,
  });

  const priceFormatter = useMemo(
    () => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }),
    [],
  );

  const sortedResults = useMemo(() => {
    const items = [...results];
    const compareText = (a, b) => a.localeCompare(b, 'es');
    const compareNumber = (a, b) => a - b;

    switch (sortFilter) {
      case 'nombre-desc':
        return items.sort((a, b) => compareText(b.nombre, a.nombre));
      case 'codigo-asc':
        return items.sort((a, b) => compareText(a.codigo, b.codigo));
      case 'codigo-desc':
        return items.sort((a, b) => compareText(b.codigo, a.codigo));
      case 'precio-asc':
        return items.sort((a, b) => compareNumber(Number(a.precio), Number(b.precio)));
      case 'precio-desc':
        return items.sort((a, b) => compareNumber(Number(b.precio), Number(a.precio)));
      case 'stock-asc':
        return items.sort((a, b) => compareNumber(Number(a.stock), Number(b.stock)));
      case 'stock-desc':
        return items.sort((a, b) => compareNumber(Number(b.stock), Number(a.stock)));
      default:
        return items.sort((a, b) => compareText(a.nombre, b.nombre));
    }
  }, [results, sortFilter]);

  const filteredCategories = useMemo(() => {
    const query = categorySearchQuery.trim().toLowerCase();
    if (!query) {
      return categories;
    }
    return categories.filter((cat) => cat.nombre.toLowerCase().includes(query));
  }, [categories, categorySearchQuery]);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const loadCategories = async () => {
    try {
      const data = await categoryService.list({ includeInactive: 'false' });
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      setCategories([]);
    }
  };

  const loadProviders = async () => {
    try {
      const data = await providerService.list({ includeInactive: 'false' });
      setProviders(Array.isArray(data) ? data : []);
    } catch (err) {
      setProviders([]);
    }
  };

  useEffect(() => {
    void Promise.all([loadCategories(), loadProviders()]);
  }, []);

  const loadProducts = async ({ search, categoryId } = {}) => {
    try {
      setLoading(true);
      setError('');
      const params = {
        includeInactive: 'false',
      };

      if (search) {
        params.search = search;
      }

      if (categoryId) {
        params.categoryId = categoryId;
      }

      const data = await productService.list(params);
      setResults(Array.isArray(data) ? data : []);

      if (search && (!data || data.length === 0)) {
        setError('No se encontraron productos.');
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Error al cargar productos.';
      setError(message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isCreateOpen || isEditOpen) {
      void Promise.all([loadCategories(), loadProviders()]);
    }
  }, [isCreateOpen, isEditOpen]);

  useEffect(() => {
    loadProducts();
  }, []);

  const handleCategoryChange = (event) => {
    const nextValue = event.target.value;
    setCategoryFilter(nextValue);
    loadProducts({
      search: searchQuery.trim() || undefined,
      categoryId: nextValue || undefined,
    });
  };

  const handleSearch = async () => {
    const trimmedQuery = searchQuery.trim();
    await loadProducts({ search: trimmedQuery || undefined });
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSearch();
    }
  };

  const handleOpenCreate = () => {
    setIsCreateOpen(true);
    setCreateError('');
    setCreateSuccess('');
  };

  const handleOpenCategoryCreate = () => {
    setIsCategoryCreateOpen(true);
    setCategoryCreateError('');
    setCategoryCreateSuccess('');
    setCategoryCreateForm({
      nombre: '',
      activo: true,
    });
  };

  const handleCloseCategoryCreate = () => {
    if (categoryCreateLoading) {
      return;
    }
    setIsCategoryCreateOpen(false);
  };

  const handleCategoryCreateChange = (field) => (event) => {
    const value = field === 'activo' ? event.target.checked : event.target.value;
    setCategoryCreateForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCategoryCreateSubmit = async (event) => {
    event.preventDefault();
    const trimmedName = categoryCreateForm.nombre.trim();
    if (!trimmedName) {
      setCategoryCreateError('El nombre de categoria es obligatorio.');
      return;
    }

    try {
      setCategoryCreateLoading(true);
      setCategoryCreateError('');
      setCategoryCreateSuccess('');
      await categoryService.create({ nombre: trimmedName, activo: categoryCreateForm.activo });
      setCategoryCreateSuccess('Categoria creada correctamente.');
      await loadCategories();
    } catch (err) {
      const message = err.response?.data?.message || 'Error al crear categoria.';
      setCategoryCreateError(message);
    } finally {
      setCategoryCreateLoading(false);
    }
  };

  const handleOpenCategoryEdit = (category) => {
    setIsCategoryEditOpen(true);
    setCategoryEditError('');
    setCategoryEditSuccess('');
    setCategoryEditForm({
      id: category.id,
      nombre: category.nombre ?? '',
      activo: category.activo ?? true,
    });
  };

  const handleCloseCategoryEdit = () => {
    if (categoryEditLoading) {
      return;
    }
    setIsCategoryEditOpen(false);
  };

  const handleCategoryEditChange = (field) => (event) => {
    const value = field === 'activo' ? event.target.checked : event.target.value;
    setCategoryEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCategoryEditSubmit = async (event) => {
    event.preventDefault();
    setCategoryEditError('');
    setCategoryEditSuccess('');

    const trimmedName = categoryEditForm.nombre.trim();
    if (!categoryEditForm.id) {
      setCategoryEditError('Categoria invalida.');
      return;
    }

    if (!trimmedName) {
      setCategoryEditError('El nombre de categoria es obligatorio.');
      return;
    }

    try {
      setCategoryEditLoading(true);
      await categoryService.update(categoryEditForm.id, {
        nombre: trimmedName,
        activo: categoryEditForm.activo,
      });
      setCategoryEditSuccess('Categoria actualizada correctamente.');
      await loadCategories();
    } catch (err) {
      const message = err.response?.data?.message || 'Error al actualizar categoria.';
      setCategoryEditError(message);
    } finally {
      setCategoryEditLoading(false);
    }
  };

  const handleOpenCategoryDelete = (category) => {
    setCategoryDeleteError('');
    setCategoryToDelete(category);
    setIsCategoryDeleteOpen(true);
  };

  const handleCloseCategoryDelete = () => {
    if (categoryDeleteLoading) {
      return;
    }
    setIsCategoryDeleteOpen(false);
    setCategoryToDelete(null);
    setCategoryDeleteError('');
  };

  const handleConfirmCategoryDelete = async () => {
    if (!categoryToDelete) {
      return;
    }

    try {
      setCategoryDeleteLoading(true);
      setCategoryDeleteError('');
      await categoryService.remove(categoryToDelete.id);
      if (categoryFilter === String(categoryToDelete.id)) {
        setCategoryFilter('');
        await loadProducts({ search: searchQuery.trim() || undefined });
      }
      await loadCategories();
      setIsCategoryDeleteOpen(false);
      setCategoryToDelete(null);
    } catch (err) {
      const message = err.response?.data?.message || 'Error al eliminar categoria.';
      setCategoryDeleteError(message);
    } finally {
      setCategoryDeleteLoading(false);
    }
  };

  const handleOpenEdit = (product) => {
    setIsEditOpen(true);
    setEditError('');
    setEditSuccess('');
    setEditForm({
      id: product.id,
      codigo: product.codigo ?? '',
      nombre: product.nombre ?? '',
      precio: product.precio ?? '',
      stock: Number.isFinite(product.stock) ? String(product.stock) : '0',
      categoryId: product.categoryId ? String(product.categoryId) : '',
      providerId: product.providerId ? String(product.providerId) : '',
      activo: product.activo ?? true,
    });
  };

  const handleCloseCreate = () => {
    if (createLoading) {
      return;
    }
    setIsCreateOpen(false);
  };

  const handleCloseEdit = () => {
    if (editLoading) {
      return;
    }
    setIsEditOpen(false);
  };

  const handleCreateChange = (field) => (event) => {
    const value = field === 'activo' ? event.target.checked : event.target.value;
    setCreateForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditChange = (field) => (event) => {
    const value = field === 'activo' ? event.target.checked : event.target.value;
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetCreateForm = () => {
    setCreateForm({
      codigo: '',
      nombre: '',
      precio: '',
      stock: '0',
      categoryId: '',
      providerId: '',
      activo: true,
    });
  };

  const resetEditForm = () => {
    setEditForm({
      id: null,
      codigo: '',
      nombre: '',
      precio: '',
      stock: '0',
      categoryId: '',
      providerId: '',
      activo: true,
    });
  };

  const handleCreateSubmit = async (event) => {
    event.preventDefault();
    setCreateError('');
    setCreateSuccess('');

    const codigo = createForm.codigo.trim();
    const nombre = createForm.nombre.trim();
    const precio = Number(createForm.precio);
    const stock = Number(createForm.stock);
    const categoryId = Number(createForm.categoryId);
    const providerId = createForm.providerId ? Number(createForm.providerId) : null;

    if (!codigo || !nombre) {
      setCreateError('Codigo y nombre son obligatorios.');
      return;
    }

    if (!Number.isFinite(precio) || precio <= 0) {
      setCreateError('Precio invalido.');
      return;
    }

    if (!Number.isInteger(stock) || stock < 0) {
      setCreateError('Stock invalido.');
      return;
    }

    if (!Number.isInteger(categoryId) || categoryId < 1) {
      setCreateError('Selecciona una categoria valida.');
      return;
    }

    if (providerId !== null && (!Number.isInteger(providerId) || providerId < 1)) {
      setCreateError('Proveedor invalido.');
      return;
    }

    try {
      setCreateLoading(true);
      await productService.create({
        codigo,
        nombre,
        precio,
        stock,
        categoryId,
        providerId,
        activo: createForm.activo,
      });
      setCreateSuccess('Producto creado correctamente.');
      resetCreateForm();
      await loadProducts({ search: searchQuery.trim() || undefined });
    } catch (err) {
      const message = err.response?.data?.message || 'Error al crear producto.';
      setCreateError(message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    setEditError('');
    setEditSuccess('');

    const codigo = editForm.codigo.trim();
    const nombre = editForm.nombre.trim();
    const precio = Number(editForm.precio);
    const stock = Number(editForm.stock);
    const categoryId = Number(editForm.categoryId);
    const providerId = editForm.providerId ? Number(editForm.providerId) : null;

    if (!editForm.id) {
      setEditError('Producto invalido.');
      return;
    }

    if (!codigo || !nombre) {
      setEditError('Codigo y nombre son obligatorios.');
      return;
    }

    if (!Number.isFinite(precio) || precio <= 0) {
      setEditError('Precio invalido.');
      return;
    }

    if (!Number.isInteger(stock) || stock < 0) {
      setEditError('Stock invalido.');
      return;
    }

    if (!Number.isInteger(categoryId) || categoryId < 1) {
      setEditError('Selecciona una categoria valida.');
      return;
    }

    if (providerId !== null && (!Number.isInteger(providerId) || providerId < 1)) {
      setEditError('Proveedor invalido.');
      return;
    }

    try {
      setEditLoading(true);
      await productService.update(editForm.id, {
        codigo,
        nombre,
        precio,
        stock,
        categoryId,
        providerId,
        activo: editForm.activo,
      });
      setEditSuccess('Producto actualizado correctamente.');
      await loadProducts({ search: searchQuery.trim() || undefined, categoryId: categoryFilter || undefined });
    } catch (err) {
      const message = err.response?.data?.message || 'Error al actualizar producto.';
      setEditError(message);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteProduct = async (product) => {
    setDeleteError('');
    setProductToDelete(product);
    setIsDeleteOpen(true);
  };

  const handleCloseDelete = () => {
    if (deleteLoading) {
      return;
    }
    setIsDeleteOpen(false);
    setProductToDelete(null);
    setDeleteError('');
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) {
      return;
    }

    try {
      setDeleteLoading(true);
      setDeleteError('');
      await productService.remove(productToDelete.id);
      await loadProducts({ search: searchQuery.trim() || undefined, categoryId: categoryFilter || undefined });
      setIsDeleteOpen(false);
      setProductToDelete(null);
    } catch (err) {
      const message = err.response?.data?.message || 'Error al eliminar producto.';
      setDeleteError(message);
    } finally {
      setDeleteLoading(false);
    }
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
              <button type="button" className="terminal-primary-btn" onClick={handleOpenCreate}>
                <Plus size={15} />
                Nuevo producto
              </button>
            </div>

            <div className="terminal-toolbar">
              <label className="terminal-field">
                <button type="button" className="terminal-input-action" onClick={handleSearch} aria-label="Buscar">
                  <Search size={15} />
                </button>
                <input
                  type="text"
                  placeholder="Buscar por ID o nombre"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </label>

              <label className="terminal-field">
                <Tags size={15} />
                <select value={categoryFilter} onChange={handleCategoryChange}>
                  <option value="">Todas</option>
                  {categories.map((category) => (
                    <option key={category.id} value={String(category.id)}>
                      {category.nombre}
                    </option>
                  ))}
                </select>
              </label>

              <label className="terminal-field">
                <Filter size={15} />
                <select value={sortFilter} onChange={(event) => setSortFilter(event.target.value)}>
                  <option value="nombre-asc">Nombre A-Z</option>
                  <option value="nombre-desc">Nombre Z-A</option>
                  <option value="codigo-asc">Codigo A-Z</option>
                  <option value="codigo-desc">Codigo Z-A</option>
                  <option value="precio-asc">Precio menor a mayor</option>
                  <option value="precio-desc">Precio mayor a menor</option>
                  <option value="stock-asc">Stock menor a mayor</option>
                  <option value="stock-desc">Stock mayor a menor</option>
                </select>
              </label>
            </div>

            {error && <p className="terminal-panel-sub">{error}</p>}

            <div className="terminal-table terminal-table-scroll">
              <div className="terminal-head" style={{ '--columns': '0.95fr 1.6fr 1fr 0.9fr 0.8fr 1fr' }}>
                <span>Codigo</span>
                <span>Producto</span>
                <span>Categoria</span>
                <span>Precio</span>
                <span>Stock</span>
                <span>Acciones</span>
              </div>

              {sortedResults.map((product) => (
                <div key={product.id} className="terminal-row" style={{ '--columns': '0.95fr 1.6fr 1fr 0.9fr 0.8fr 1fr' }}>
                  <span>{product.codigo}</span>
                  <span>{product.nombre}</span>
                  <span>{product.category?.nombre ?? 'Sin categoria'}</span>
                  <span>{priceFormatter.format(Number(product.precio))}</span>
                  <div>
                    <span className={`terminal-pill ${product.stock <= 2 ? 'terminal-pill-alert' : product.stock <= 10 ? 'terminal-pill-warn' : 'terminal-pill-ok'}`}>
                      {product.stock}
                    </span>
                  </div>
                  <div className="terminal-actions">
                    <button type="button" className="terminal-icon-btn" aria-label="Editar producto" onClick={() => handleOpenEdit(product)}>
                      <Pencil size={14} />
                    </button>
                    <button type="button" className="terminal-icon-btn terminal-icon-btn-danger" aria-label="Eliminar producto" onClick={() => handleDeleteProduct(product)}>
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
                <button
                  type="button"
                  className="terminal-primary-btn terminal-primary-btn-sm"
                  onClick={handleOpenCategoryCreate}
                >
                  <Plus size={14} />
                  Crear
                </button>
              </div>

              <div className="terminal-field-group">
                <label className="terminal-mini-label">Buscar categoria</label>
                <div className="terminal-field">
                  <Search size={15} />
                  <input
                    type="text"
                    placeholder="Filtrar por nombre"
                    value={categorySearchQuery}
                    onChange={(event) => setCategorySearchQuery(event.target.value)}
                  />
                </div>
              </div>

              <div className="terminal-table terminal-table-scroll">
                <div className="terminal-head" style={{ '--columns': '1.4fr 0.7fr 0.9fr 0.8fr' }}>
                  <span>Nombre</span>
                  <span>Productos</span>
                  <span>Estado</span>
                  <span>Acciones</span>
                </div>

                {filteredCategories.map((category) => (
                  <div key={category.id} className="terminal-row" style={{ '--columns': '1.4fr 0.7fr 0.9fr 0.8fr' }}>
                    <span>{category.nombre}</span>
                    <span>{category._count?.products ?? 0}</span>
                    <div>
                      <span className={`terminal-pill ${category.activo ? 'terminal-pill-ok' : 'terminal-pill-muted'}`}>
                        {category.activo ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>
                    <div className="terminal-actions">
                      <button type="button" className="terminal-icon-btn" aria-label="Editar categoria" onClick={() => handleOpenCategoryEdit(category)}>
                        <Pencil size={14} />
                      </button>
                      <button type="button" className="terminal-icon-btn terminal-icon-btn-danger" aria-label="Eliminar categoria" onClick={() => handleOpenCategoryDelete(category)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="terminal-panel">
              <h2 className="terminal-panel-title">Actividad Reciente</h2>
              <p className="terminal-panel-sub">Movimientos de inventario y administracion.</p>

              <ul className="terminal-list">
                {INVENTORY_UPDATES.map((update) => (
                  <li key={`${update.action}-${update.time}`} className="terminal-list-item">
                    <div>
                      <strong>{update.action}</strong>
                      <span>{update.target}</span>
                      <span>{update.user}</span>
                    </div>
                    <span className="terminal-status-tag">{update.time}</span>
                  </li>
                ))}
              </ul>

              <div className="terminal-summary-strip">
                <div>
                  <Warehouse size={16} />
                  <span>Inventario total: 1,142 unidades</span>
                </div>
                <div>
                  <ShieldCheck size={16} />
                  <span>Validaciones de stock activas</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {isCreateOpen && (
        <div className="terminal-modal-backdrop" role="presentation" onClick={handleCloseCreate}>
          <div className="terminal-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <header className="terminal-modal-header">
              <div>
                <h3>Nuevo producto</h3>
                <p>Completa los datos para registrar el producto.</p>
              </div>
              <button type="button" className="terminal-modal-close" onClick={handleCloseCreate} aria-label="Cerrar">
                ×
              </button>
            </header>

            <form className="terminal-modal-body" onSubmit={handleCreateSubmit}>
              <div className="terminal-form-grid">
                <label className="terminal-field">
                  <input
                    type="text"
                    placeholder="Codigo"
                    value={createForm.codigo}
                    onChange={handleCreateChange('codigo')}
                    required
                  />
                </label>
                <label className="terminal-field">
                  <input
                    type="text"
                    placeholder="Nombre"
                    value={createForm.nombre}
                    onChange={handleCreateChange('nombre')}
                    required
                  />
                </label>
                <label className="terminal-field">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Precio"
                    value={createForm.precio}
                    onChange={handleCreateChange('precio')}
                    required
                  />
                </label>
                <label className="terminal-field">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Stock"
                    value={createForm.stock}
                    onChange={handleCreateChange('stock')}
                    required
                  />
                </label>
                <label className="terminal-field">
                  <select value={createForm.categoryId} onChange={handleCreateChange('categoryId')} required>
                    <option value="">Selecciona categoria</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.nombre}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="terminal-field">
                  <select value={createForm.providerId} onChange={handleCreateChange('providerId')}>
                    <option value="">Sin proveedor</option>
                    {providers.map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.nombre}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="terminal-checkbox">
                <input
                  type="checkbox"
                  checked={createForm.activo}
                  onChange={handleCreateChange('activo')}
                />
                Producto activo
              </label>

              {createError && <p className="terminal-modal-error">{createError}</p>}
              {createSuccess && <p className="terminal-modal-success">{createSuccess}</p>}

              <div className="terminal-modal-actions">
                <button type="button" className="terminal-ghost-btn" onClick={handleCloseCreate} disabled={createLoading}>
                  Cancelar
                </button>
                <button type="submit" className="terminal-primary-btn" disabled={createLoading}>
                  {createLoading ? 'Guardando...' : 'Guardar producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditOpen && (
        <div className="terminal-modal-backdrop" role="presentation" onClick={handleCloseEdit}>
          <div className="terminal-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <header className="terminal-modal-header">
              <div>
                <h3>Editar producto</h3>
                <p>Actualiza la informacion del producto.</p>
              </div>
              <button type="button" className="terminal-modal-close" onClick={handleCloseEdit} aria-label="Cerrar">
                ×
              </button>
            </header>

            <form className="terminal-modal-body" onSubmit={handleEditSubmit}>
              <div className="terminal-form-grid">
                <label className="terminal-field">
                  <input
                    type="text"
                    placeholder="Codigo"
                    value={editForm.codigo}
                    onChange={handleEditChange('codigo')}
                    required
                  />
                </label>
                <label className="terminal-field">
                  <input
                    type="text"
                    placeholder="Nombre"
                    value={editForm.nombre}
                    onChange={handleEditChange('nombre')}
                    required
                  />
                </label>
                <label className="terminal-field">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Precio"
                    value={editForm.precio}
                    onChange={handleEditChange('precio')}
                    required
                  />
                </label>
                <label className="terminal-field">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Stock"
                    value={editForm.stock}
                    onChange={handleEditChange('stock')}
                    required
                  />
                </label>
                <label className="terminal-field">
                  <select value={editForm.categoryId} onChange={handleEditChange('categoryId')} required>
                    <option value="">Selecciona categoria</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.nombre}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="terminal-field">
                  <select value={editForm.providerId} onChange={handleEditChange('providerId')}>
                    <option value="">Sin proveedor</option>
                    {providers.map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.nombre}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="terminal-checkbox">
                <input
                  type="checkbox"
                  checked={editForm.activo}
                  onChange={handleEditChange('activo')}
                />
                Producto activo
              </label>

              {editError && <p className="terminal-modal-error">{editError}</p>}
              {editSuccess && <p className="terminal-modal-success">{editSuccess}</p>}

              <div className="terminal-modal-actions">
                <button type="button" className="terminal-ghost-btn" onClick={handleCloseEdit} disabled={editLoading}>
                  Cancelar
                </button>
                <button type="submit" className="terminal-primary-btn" disabled={editLoading}>
                  {editLoading ? 'Actualizando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteOpen && (
        <div className="terminal-modal-backdrop" role="presentation" onClick={handleCloseDelete}>
          <div className="terminal-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <header className="terminal-modal-header">
              <div>
                <h3>Eliminar producto</h3>
                <p>Esta accion marcara el producto como inactivo.</p>
              </div>
              <button type="button" className="terminal-modal-close" onClick={handleCloseDelete} aria-label="Cerrar">
                ×
              </button>
            </header>

            <div className="terminal-modal-body">
              <p className="terminal-panel-sub">
                Estas seguro de eliminar el producto {productToDelete?.codigo} - {productToDelete?.nombre}?
              </p>

              {deleteError && <p className="terminal-modal-error">{deleteError}</p>}

              <div className="terminal-modal-actions">
                <button type="button" className="terminal-ghost-btn" onClick={handleCloseDelete} disabled={deleteLoading}>
                  Cancelar
                </button>
                <button type="button" className="terminal-primary-btn" onClick={handleConfirmDelete} disabled={deleteLoading}>
                  {deleteLoading ? 'Eliminando...' : 'Eliminar producto'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isCategoryEditOpen && (
        <div className="terminal-modal-backdrop" role="presentation" onClick={handleCloseCategoryEdit}>
          <div className="terminal-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <header className="terminal-modal-header">
              <div>
                <h3>Editar categoria</h3>
                <p>Actualiza la informacion de la categoria.</p>
              </div>
              <button type="button" className="terminal-modal-close" onClick={handleCloseCategoryEdit} aria-label="Cerrar">
                ×
              </button>
            </header>

            <form className="terminal-modal-body" onSubmit={handleCategoryEditSubmit}>
              <label className="terminal-field">
                <input
                  type="text"
                  placeholder="Nombre de categoria"
                  value={categoryEditForm.nombre}
                  onChange={handleCategoryEditChange('nombre')}
                  required
                />
              </label>

              <label className="terminal-checkbox">
                <input
                  type="checkbox"
                  checked={categoryEditForm.activo}
                  onChange={handleCategoryEditChange('activo')}
                />
                Categoria activa
              </label>

              {categoryEditError && <p className="terminal-modal-error">{categoryEditError}</p>}
              {categoryEditSuccess && <p className="terminal-modal-success">{categoryEditSuccess}</p>}

              <div className="terminal-modal-actions">
                <button type="button" className="terminal-ghost-btn" onClick={handleCloseCategoryEdit} disabled={categoryEditLoading}>
                  Cancelar
                </button>
                <button type="submit" className="terminal-primary-btn" disabled={categoryEditLoading}>
                  {categoryEditLoading ? 'Actualizando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCategoryDeleteOpen && (
        <div className="terminal-modal-backdrop" role="presentation" onClick={handleCloseCategoryDelete}>
          <div className="terminal-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <header className="terminal-modal-header">
              <div>
                <h3>Eliminar categoria</h3>
                <p>Esta accion marcara la categoria como inactiva.</p>
              </div>
              <button type="button" className="terminal-modal-close" onClick={handleCloseCategoryDelete} aria-label="Cerrar">
                ×
              </button>
            </header>

            <div className="terminal-modal-body">
              <p className="terminal-panel-sub">
                Estas seguro de eliminar la categoria {categoryToDelete?.nombre}?
              </p>

              {categoryDeleteError && <p className="terminal-modal-error">{categoryDeleteError}</p>}

              <div className="terminal-modal-actions">
                <button type="button" className="terminal-ghost-btn" onClick={handleCloseCategoryDelete} disabled={categoryDeleteLoading}>
                  Cancelar
                </button>
                <button type="button" className="terminal-primary-btn" onClick={handleConfirmCategoryDelete} disabled={categoryDeleteLoading}>
                  {categoryDeleteLoading ? 'Eliminando...' : 'Eliminar categoria'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isCategoryCreateOpen && (
        <div className="terminal-modal-backdrop" role="presentation" onClick={handleCloseCategoryCreate}>
          <div className="terminal-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <header className="terminal-modal-header">
              <div>
                <h3>Nueva categoria</h3>
                <p>Completa los datos para registrar la categoria.</p>
              </div>
              <button type="button" className="terminal-modal-close" onClick={handleCloseCategoryCreate} aria-label="Cerrar">
                ×
              </button>
            </header>

            <form className="terminal-modal-body" onSubmit={handleCategoryCreateSubmit}>
              <label className="terminal-field">
                <input
                  type="text"
                  placeholder="Nombre de categoria"
                  value={categoryCreateForm.nombre}
                  onChange={handleCategoryCreateChange('nombre')}
                  required
                />
              </label>

              <label className="terminal-checkbox">
                <input
                  type="checkbox"
                  checked={categoryCreateForm.activo}
                  onChange={handleCategoryCreateChange('activo')}
                />
                Categoria activa
              </label>

              {categoryCreateError && <p className="terminal-modal-error">{categoryCreateError}</p>}
              {categoryCreateSuccess && <p className="terminal-modal-success">{categoryCreateSuccess}</p>}

              <div className="terminal-modal-actions">
                <button type="button" className="terminal-ghost-btn" onClick={handleCloseCategoryCreate} disabled={categoryCreateLoading}>
                  Cancelar
                </button>
                <button type="submit" className="terminal-primary-btn" disabled={categoryCreateLoading}>
                  {categoryCreateLoading ? 'Guardando...' : 'Guardar categoria'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTerminal;
