import React, { useEffect, useMemo, useState } from 'react';
import { Layers, Plus, Pencil, Power, Search, ShieldCheck } from 'lucide-react';
import { categoryService } from '../../services/categoryService';

const emptyForm = {
  nombre: '',
};

const CategoriesView = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await categoryService.list({ includeInactive: 'true' });
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('No fue posible cargar las categorias.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return categories;
    }

    const query = searchQuery.trim().toLowerCase();
    return categories.filter((category) =>
      category.nombre.toLowerCase().includes(query),
    );
  }, [categories, searchQuery]);

  const openCreateModal = () => {
    setSelectedCategory(null);
    setForm(emptyForm);
    setFormError('');
    setFormSuccess('');
    setIsModalOpen(true);
  };

  const openEditModal = (category) => {
    setSelectedCategory(category);
    setForm({
      nombre: category.nombre,
    });
    setFormError('');
    setFormSuccess('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCategory(null);
    setForm(emptyForm);
    setFormLoading(false);
    setFormError('');
    setFormSuccess('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.nombre.trim()) {
      setFormError('El nombre de la categoria es obligatorio.');
      return;
    }

    setFormLoading(true);
    setFormError('');
    setFormSuccess('');

    try {
      const payload = {
        nombre: form.nombre.trim(),
      };

      if (selectedCategory) {
        await categoryService.update(selectedCategory.id, payload);
        setFormSuccess('Categoria actualizada correctamente.');
      } else {
        await categoryService.create(payload);
        setFormSuccess('Categoria creada correctamente.');
      }

      await loadCategories();
      setTimeout(() => {
        closeModal();
      }, 700);
    } catch (err) {
      const message = err.response?.data?.message;
      setFormError(Array.isArray(message) ? message.join(', ') : (message || 'No fue posible guardar la categoria.'));
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleActive = async (category) => {
    const nextState = !category.activo;

    try {
      await categoryService.setActive(category.id, nextState);
      await loadCategories();
    } catch (err) {
      const message = err.response?.data?.message;
      setError(Array.isArray(message) ? message.join(', ') : (message || 'No fue posible actualizar el estado de la categoria.'));
    }
  };

  return (
    <div className="view-panel">
      <header className="terminal-header" style={{ border: 'none', background: 'transparent', padding: '0 0 24px', boxShadow: 'none' }}>
        <div className="terminal-header-main">
          <div className="terminal-badge terminal-badge-admin">
            <Layers size={24} />
          </div>
          <div className="terminal-meta">
            <span className="terminal-kicker">Organizacion de Inventario</span>
            <h1 className="terminal-title">Gestion de Categorias</h1>
            <p className="terminal-subtitle">Crea, edita y activa o desactiva categorias para mantener el catalogo consistente.</p>
          </div>
        </div>
      </header>

      <section className="terminal-panel">
        <div className="terminal-panel-header">
          <div>
            <h2 className="terminal-panel-title">Categorias Registradas</h2>
            <p className="terminal-panel-sub">Solo usuarios con rol administrador pueden gestionar categorias.</p>
          </div>
          <button className="terminal-primary-btn" onClick={openCreateModal}>
            <Plus size={15} /> Nueva Categoria
          </button>
        </div>

        <div className="terminal-toolbar">
          <label className="terminal-field" style={{ flex: 1.6 }}>
            <Search size={15} />
            <input
              type="text"
              placeholder="Buscar categoria por nombre..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </label>
        </div>

        {error ? <p className="terminal-modal-error" style={{ marginBottom: '12px' }}>{error}</p> : null}

        <div className="terminal-table terminal-table-scroll">
          <div className="terminal-head" style={{ '--columns': '0.7fr 1.8fr 1fr 1.2fr' }}>
            <span>ID</span>
            <span>Nombre</span>
            <span>Estado</span>
            <span>Acciones</span>
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>Cargando categorias...</div>
          ) : filteredCategories.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', opacity: 0.6 }}>No hay categorias para mostrar.</div>
          ) : (
            filteredCategories.map((category) => (
              <div key={category.id} className="terminal-row" style={{ '--columns': '0.7fr 1.8fr 1fr 1.2fr' }}>
                <span>{category.id}</span>
                <span className="font-medium">{category.nombre}</span>
                <span className={`terminal-pill ${category.activo ? 'terminal-pill-ok' : 'terminal-pill-alert'}`}>
                  {category.activo ? 'Activa' : 'Inactiva'}
                </span>
                <div className="terminal-actions">
                  <button
                    className="terminal-icon-btn"
                    onClick={() => openEditModal(category)}
                    title="Editar categoria"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    className={`terminal-icon-btn ${category.activo ? 'terminal-icon-btn-danger' : ''}`}
                    onClick={() => handleToggleActive(category)}
                    title={category.activo ? 'Desactivar categoria' : 'Activar categoria'}
                  >
                    <Power size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {isModalOpen ? (
        <div className="terminal-modal-backdrop" onClick={closeModal}>
          <div className="terminal-modal" onClick={(event) => event.stopPropagation()}>
            <header className="terminal-modal-header">
              <div>
                <h3>{selectedCategory ? 'Editar Categoria' : 'Nueva Categoria'}</h3>
                <p>El nombre es obligatorio para registrar la categoria.</p>
              </div>
              <button className="terminal-modal-close" onClick={closeModal}>x</button>
            </header>

            <form onSubmit={handleSubmit} className="terminal-modal-body">
              <div className="terminal-form-grid" style={{ gridTemplateColumns: '1fr' }}>
                <label className="terminal-field-group">
                  <span className="terminal-mini-label">Nombre</span>
                  <div className="terminal-field">
                    <input
                      required
                      minLength={2}
                      maxLength={80}
                      value={form.nombre}
                      onChange={(event) => setForm({ ...form, nombre: event.target.value })}
                    />
                  </div>
                </label>
              </div>

              {formError ? <p className="terminal-modal-error">{formError}</p> : null}
              {formSuccess ? <p className="terminal-modal-success">{formSuccess}</p> : null}

              <div className="terminal-modal-actions">
                <button type="button" className="terminal-ghost-btn" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="terminal-primary-btn" disabled={formLoading}>
                  {formLoading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <section className="terminal-panel" style={{ marginTop: '16px' }}>
        <div className="terminal-panel-header" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={16} />
            <p className="terminal-panel-sub" style={{ margin: 0 }}>
              Las categorias inactivas no aparecen en los formularios de creacion o edicion de productos.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CategoriesView;
