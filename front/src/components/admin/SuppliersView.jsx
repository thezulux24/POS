import React, { useEffect, useState } from 'react';
import { 
  Truck, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  Globe, 
  Pencil, 
  Trash2,
  Package
} from 'lucide-react';
import { supplierService } from '../../services/supplierService';

const SuppliersView = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const [formData, setFormData] = useState({
    nombre: '',
    contacto: '',
    telefono: '',
    email: '',
    direccion: '',
    activo: true
  });

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const data = await supplierService.list();
      setSuppliers(data);
    } catch (err) {
      setError('Error al cargar proveedores.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const openModal = (supplier = null) => {
    setSelectedSupplier(supplier);
    if (supplier) {
      setFormData({
        nombre: supplier.nombre,
        contacto: supplier.contacto || '',
        telefono: supplier.telefono || '',
        email: supplier.email || '',
        direccion: supplier.direccion || '',
        activo: supplier.activo
      });
    } else {
      setFormData({
        nombre: '',
        contacto: '',
        telefono: '',
        email: '',
        direccion: '',
        activo: true
      });
    }
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    try {
      if (selectedSupplier) {
        await supplierService.update(selectedSupplier.id, formData);
      } else {
        await supplierService.create(formData);
      }
      setIsModalOpen(false);
      loadSuppliers();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error al guardar proveedor');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="view-panel">
      <header className="terminal-header" style={{ border: 'none', background: 'transparent', padding: '0 0 24px', boxShadow: 'none' }}>
        <div className="terminal-header-main">
          <div className="terminal-badge terminal-badge-admin">
            <Truck size={24} />
          </div>
          <div className="terminal-meta">
            <span className="terminal-kicker">Abastecimiento</span>
            <h1 className="terminal-title">Gestión de Proveedores</h1>
            <p className="terminal-subtitle">Directorio de aliados comerciales y suministros.</p>
          </div>
        </div>
      </header>

      <section className="terminal-panel">
        <div className="terminal-panel-header">
           <div>
              <h2 className="terminal-panel-title">Fichero de Proveedores</h2>
              <p className="terminal-panel-sub">Registro de contactos para reposición de stock (US013).</p>
           </div>
           <button className="terminal-primary-btn" onClick={() => openModal()}>
              <Plus size={15} /> Nuevo Proveedor
           </button>
        </div>

        <div className="terminal-table" style={{ marginTop: '10px' }}>
          <div className="terminal-head" style={{ '--columns': '1.5fr 1fr 1fr 1.2fr 0.8fr' }}>
            <span>Proveedor</span>
            <span>Contacto</span>
            <span>Teléfono</span>
            <span>Email</span>
            <span className="text-right">Acciones</span>
          </div>
          {loading ? (
             <div style={{ padding: '40px', textAlign: 'center' }}>Cargando proveedores...</div>
          ) : suppliers.length === 0 ? (
             <div style={{ padding: '40px', textAlign: 'center', opacity: 0.5 }}>No hay proveedores registrados</div>
          ) : (
            suppliers.map(s => (
              <div key={s.id} className="terminal-row" style={{ '--columns': '1.5fr 1fr 1fr 1.2fr 0.8fr' }}>
                <span className="font-medium">{s.nombre}</span>
                <span>{s.contacto || 'N/A'}</span>
                <span>{s.telefono}</span>
                <span>{s.email}</span>
                <div className="terminal-actions" style={{ justifyContent: 'flex-end' }}>
                  <button className="terminal-icon-btn" onClick={() => openModal(s)} title="Editar"><Pencil size={14} /></button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Supplier Modal */}
      {isModalOpen && (
        <div className="terminal-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="terminal-modal" onClick={e => e.stopPropagation()}>
            <header className="terminal-modal-header">
               <div>
                  <h3>{selectedSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h3>
                  <p>Información de contacto para órdenes de compra.</p>
               </div>
               <button className="terminal-modal-close" onClick={() => setIsModalOpen(false)}>×</button>
            </header>
            <form onSubmit={handleSubmit} className="terminal-modal-body">
               <div className="terminal-form-grid">
                  <label className="terminal-field-group">
                     <span className="terminal-mini-label">Razon Social / Nombre</span>
                     <div className="terminal-field"><input required value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} /></div>
                  </label>
                  <label className="terminal-field-group">
                     <span className="terminal-mini-label">Persona de Contacto</span>
                     <div className="terminal-field"><input value={formData.contacto} onChange={e => setFormData({...formData, contacto: e.target.value})} /></div>
                  </label>
                  <label className="terminal-field-group">
                     <span className="terminal-mini-label">Teléfono</span>
                     <div className="terminal-field"><input required value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} /></div>
                  </label>
                  <label className="terminal-field-group">
                     <span className="terminal-mini-label">Email</span>
                     <div className="terminal-field"><input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
                  </label>
                  <label className="terminal-field-group" style={{ gridColumn: 'span 2' }}>
                     <span className="terminal-mini-label">Dirección</span>
                     <div className="terminal-field"><input value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} /></div>
                  </label>
               </div>
               {formError && <p className="terminal-modal-error">{formError}</p>}
               <div className="terminal-modal-actions">
                  <button type="button" className="terminal-ghost-btn" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                  <button type="submit" className="terminal-primary-btn" disabled={formLoading}>{formLoading ? 'Guardando...' : 'Guardar'}</button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuppliersView;
