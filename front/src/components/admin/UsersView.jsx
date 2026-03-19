import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  UserPlus, 
  Shield, 
  Pencil, 
  Trash2,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { userService } from '../../services/userService';

const UsersView = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    usuario: '',
    password: '',
    rol: 'VENDEDOR',
    activo: true
  });

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.list();
      setUsers(data);
    } catch (err) {
      setError('Error al cargar usuarios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = users.filter((user) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return user.nombre?.toLowerCase().includes(term);
  });

  const openModal = (user = null) => {
    setSelectedUser(user);
    if (user) {
      setFormData({
        nombre: user.nombre,
        email: user.email,
        usuario: user.usuario,
        password: '',
        rol: user.rol,
        activo: user.activo
      });
    } else {
      setFormData({
        nombre: '',
        email: '',
        usuario: '',
        password: '',
        rol: 'VENDEDOR',
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
      if (selectedUser) {
        // Only include password if set
        const payload = { ...formData };
        if (!payload.password) delete payload.password;
        await userService.update(selectedUser.id, payload);
      } else {
        await userService.create(formData);
      }
      setIsModalOpen(false);
      loadUsers();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error al guardar usuario');
    } finally {
      setFormLoading(false);
    }
  };

  const toggleStatus = async (user) => {
    try {
      await userService.update(user.id, { activo: !user.activo });
      loadUsers();
    } catch (err) {
      alert('Error al cambiar estado');
    }
  };

  return (
    <div className="view-panel">
      <header className="terminal-header" style={{ border: 'none', background: 'transparent', padding: '0 0 24px', boxShadow: 'none' }}>
        <div className="terminal-header-main">
          <div className="terminal-badge terminal-badge-admin">
            <Users size={24} />
          </div>
          <div className="terminal-meta">
            <span className="terminal-kicker">Recursis Humanos</span>
            <h1 className="terminal-title">Gestión de Usuarios</h1>
            <p className="terminal-subtitle">Administra cuentas de vendedores y administradores.</p>
          </div>
        </div>
      </header>

      <section className="terminal-panel">
        <div className="terminal-panel-header">
           <div>
              <h2 className="terminal-panel-title">Personal del Sistema</h2>
              <p className="terminal-panel-sub">Control de accesos y roles (US010).</p>
           </div>
           <button className="terminal-primary-btn" onClick={() => openModal()}>
              <UserPlus size={15} /> Nuevo Usuario
           </button>
        </div>

        <div style={{ maxWidth: '420px', marginTop: '8px' }}>
          <label className="terminal-field-group">
            <span className="terminal-mini-label">Buscar vendedor por nombre</span>
            <div className="terminal-field">
              <Search size={14} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Escribe nombre completo o parcial"
              />
            </div>
          </label>
        </div>

        <div className="terminal-table">
          <div className="terminal-head" style={{ '--columns': '1.5fr 1.5fr 1fr 1fr 1fr' }}>
            <span>Nombre</span>
            <span>Usuario / Email</span>
            <span>Rol</span>
            <span>Estado</span>
            <span className="text-right">Acciones</span>
          </div>
          {loading ? (
             <div style={{ padding: '40px', textAlign: 'center' }}>Cargando personal...</div>
          ) : filteredUsers.length === 0 ? (
             <div style={{ padding: '40px', textAlign: 'center', opacity: 0.6 }}>No se encontraron coincidencias para "{searchTerm}"</div>
          ) : (
            filteredUsers.map(u => (
              <div key={u.id} className="terminal-row" style={{ '--columns': '1.5fr 1.5fr 1fr 1fr 1fr' }}>
                <span className="font-medium">{u.nombre}</span>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                   <span>{u.usuario}</span>
                   <span style={{ fontSize: '11px', opacity: 0.6 }}>{u.email}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                   <Shield size={12} className={u.rol === 'ADMIN' ? 'terminal-note-ok' : 'terminal-note-neutral'} />
                   <span className="text-xs font-bold uppercase">{u.rol}</span>
                </div>
                <span className={`terminal-pill ${u.activo ? 'terminal-pill-ok' : 'terminal-pill-muted'}`}>
                   {u.activo ? 'ACTIVO' : 'INACTIVO'}
                </span>
                <div className="terminal-actions" style={{ justifyContent: 'flex-end' }}>
                  <button className="terminal-icon-btn" onClick={() => toggleStatus(u)} title={u.activo ? 'Desactivar' : 'Activar'}>
                    {u.activo ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
                  </button>
                  <button className="terminal-icon-btn" onClick={() => openModal(u)} title="Editar"><Pencil size={14} /></button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* User Modal */}
      {isModalOpen && (
        <div className="terminal-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="terminal-modal" onClick={e => e.stopPropagation()}>
            <header className="terminal-modal-header">
               <div>
                  <h3>{selectedUser ? 'Editar Usuario' : 'Crear Usuario'}</h3>
                  <p>Define las credenciales y permisos de acceso.</p>
               </div>
               <button className="terminal-modal-close" onClick={() => setIsModalOpen(false)}>×</button>
            </header>
            <form onSubmit={handleSubmit} className="terminal-modal-body">
               <div className="terminal-form-grid">
                  <label className="terminal-field-group">
                     <span className="terminal-mini-label">Nombre Completo</span>
                     <div className="terminal-field"><input required value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} /></div>
                  </label>
                  <label className="terminal-field-group">
                     <span className="terminal-mini-label">Email</span>
                     <div className="terminal-field"><input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
                  </label>
                  <label className="terminal-field-group">
                     <span className="terminal-mini-label">Usuario (para login)</span>
                     <div className="terminal-field"><input required value={formData.usuario} onChange={e => setFormData({...formData, usuario: e.target.value})} /></div>
                  </label>
                  <label className="terminal-field-group">
                     <span className="terminal-mini-label">Contraseña {selectedUser && '(vacío para mantener)'}</span>
                     <div className="terminal-field"><input type="password" required={!selectedUser} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} /></div>
                  </label>
                  <label className="terminal-field-group">
                     <span className="terminal-mini-label">Rol</span>
                     <div className="terminal-field">
                        <select value={formData.rol} onChange={e => setFormData({...formData, rol: e.target.value})}>
                           <option value="VENDEDOR">Vendedor</option>
                           <option value="ADMIN">Administrador</option>
                        </select>
                     </div>
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

export default UsersView;
