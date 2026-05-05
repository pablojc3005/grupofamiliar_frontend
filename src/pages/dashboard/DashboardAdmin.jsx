import { useState, useEffect } from 'react';
import api from '../../utils/axios';
import Swal from 'sweetalert2';
import {
  Settings, Users, Building2, Layers, RefreshCw, Loader2,
  PlusCircle, Pencil, Trash2, ToggleLeft, ToggleRight, Shield,
  CheckCircle, XCircle, BarChart2, DollarSign, ImagePlus,
} from 'lucide-react';
import PanelConsolidadoAdmin from './PanelConsolidadoAdmin';
import PanelFinanzasAdmin from './PanelFinanzasAdmin';
import PanelConfiguracion from './PanelConfiguracion';

// ────────────────────────────────────────────────────────────
// Componente Tab
// ────────────────────────────────────────────────────────────
const Tab = ({ label, icon, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${active ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'
      }`}
  >
    {icon} {label}
  </button>
);

// ────────────────────────────────────────────────────────────
// Panel Usuarios
// ────────────────────────────────────────────────────────────
const PanelUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [sectores, setSectores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ nombres: '', apellidos: '', email: '', telefono: '', password: '', idRol: '', idSupervisor: '', idSector: '' });

  const fetch = async () => {
    setLoading(true);
    try {
      const [uRes, rRes, sRes] = await Promise.all([api.get('/usuarios'), api.get('/roles'), api.get('/sectores')]);
      setUsuarios(Array.isArray(uRes.data?.data) ? uRes.data.data : []);
      setRoles(Array.isArray(rRes.data?.data) ? rRes.data.data : []);
      setSectores(Array.isArray(sRes.data?.data) ? sRes.data.data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editando) {
        await api.put(`/usuarios/${editando}`, form);
        Swal.fire({ icon: 'success', title: 'Usuario actualizado', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
      } else {
        await api.post('/usuarios', form);
        Swal.fire({ icon: 'success', title: 'Usuario creado', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
      }
      setShowForm(false);
      setEditando(null);
      setForm({ nombres: '', apellidos: '', email: '', telefono: '', password: '', idRol: '', idSupervisor: '', idSector: '' });
      fetch();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.mensaje || 'No se pudo guardar.' });
    }
  };

  const handleEditar = (u) => {
    setEditando(u.id);
    const rolId = roles.find(r => r.nombre.toUpperCase() === u.rol?.toUpperCase())?.id || '';
    setForm({
      nombres: u.nombres || '',
      apellidos: u.apellidos || '',
      email: u.email || '',
      telefono: u.telefono || '',
      password: '',
      idRol: rolId,
      idSupervisor: u.supervisorId || '',
      idSector: u.sectorId || ''
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggle = async (u) => {
    try {
      const confirmText = u.activo ? '¿Estás seguro de inhabilitar este usuario?' : '¿Estás seguro de habilitar este usuario?';
      const confirmButtonText = u.activo ? 'Sí, inhabilitar' : 'Sí, habilitar';

      const result = await Swal.fire({
        title: 'Confirmación',
        text: confirmText,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: u.activo ? '#ef4444' : '#10b981',
        cancelButtonColor: '#6b7280',
        confirmButtonText: confirmButtonText,
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        if (u.activo) {
          await api.delete(`/usuarios/${u.id}`);
        } else {
          await api.patch(`/usuarios/${u.id}/activar`);
        }
        Swal.fire({ icon: 'success', title: 'Estado actualizado', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
        fetch();
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.mensaje || 'Error al cambiar estado.' });
    }
  };

  const rolBadge = (rolNombre) => {
    const colors = {
      ADMIN: 'bg-rose-100 text-rose-700',
      LIDER: 'bg-blue-100 text-blue-700',
      SUP_SECTORIAL: 'bg-amber-100 text-amber-700',
      SUP_GENERAL: 'bg-emerald-100 text-emerald-700',
      TESORERO: 'bg-violet-100 text-violet-700',
    };
    return colors[rolNombre] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{usuarios.length} usuarios registrados</p>
        <div className="flex gap-2">
          <button onClick={fetch} className="flex items-center gap-1.5 border border-gray-200 text-gray-600 px-3 py-2 rounded-xl text-sm hover:bg-gray-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => { setShowForm(s => !s); setEditando(null); setForm({ nombres: '', apellidos: '', email: '', telefono: '', password: '', idRol: '', idSupervisor: '', idSector: '' }); }}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700"
          >
            <PlusCircle className="w-4 h-4" /> Nuevo Usuario
          </button>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                {editando ? <Pencil className="w-5 h-5 text-indigo-500" /> : <PlusCircle className="w-5 h-5 text-indigo-500" />}
                {editando ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h3>
              <button onClick={() => { setShowForm(false); setEditando(null); }} className="text-gray-400 hover:text-gray-600 transition-colors">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[['nombres', 'Nombres *', 'text'], ['apellidos', 'Apellidos *', 'text'], ['email', 'Email *', 'email'], ['telefono', 'Teléfono', 'text'], ['password', editando ? 'Nueva Contraseña' : 'Contraseña *', 'password']].map(([name, label, type]) => (
                  <div key={name} className={name === 'email' ? 'md:col-span-2' : ''}>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
                    <input type={type} name={name} value={form[name]} onChange={e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))}
                      required={name !== 'telefono' && !(name === 'password' && editando)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-400 outline-none transition-colors" />
                  </div>
                ))}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Rol *</label>
                  <select name="idRol" value={form.idRol} onChange={e => setForm(p => ({ ...p, idRol: e.target.value }))} required
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-400 outline-none transition-colors">
                    <option value="">Seleccionar rol...</option>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                  </select>
                </div>
                {form.idRol && roles.find(r => r.id === Number(form.idRol))?.nombre === 'LIDER' && (
                  <>
                    <div className="md:col-span-1">
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Sector Asignado</label>
                      <select name="idSector" value={form.idSector} onChange={e => setForm(p => ({ ...p, idSector: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-400 outline-none transition-colors">
                        <option value="">Seleccionar Sector...</option>
                        {sectores.map(s => (
                          <option key={s.id} value={s.id}>{s.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-1">
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Supervisor Asignado</label>
                      <select name="idSupervisor" value={form.idSupervisor} onChange={e => setForm(p => ({ ...p, idSupervisor: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-400 outline-none transition-colors">
                        <option value="">Ninguno (Opcional)...</option>
                        {usuarios.filter(u => u.rol.includes('SUP_')).map(u => (
                          <option key={u.id} value={u.id}>{u.nombres} {u.apellidos} - {u.rol}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => { setShowForm(false); setEditando(null); }}
                  className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm">
                  {editando ? 'Guardar Cambios' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-10 text-center"><Loader2 className="w-7 h-7 animate-spin mx-auto text-indigo-500" /></div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-100">
          <table className="w-full text-sm text-left bg-white">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-5 py-3">Nombre</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Rol</th>
                {/*
                <th className="px-5 py-3">Sector</th>
                <th className="px-5 py-3">Supervisor</th>
                */}
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {usuarios.map(u => (
                <tr key={u.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3 font-medium text-gray-800">{u.nombres} {u.apellidos}</td>
                  <td className="px-5 py-3 text-gray-500">{u.email}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${rolBadge(u.rol)}`}>{u.rol}</span>
                  </td>

                  {/*
                  <td className="px-5 py-3 text-gray-500">
                    {u.sectorNombre ? <span className="text-xs bg-indigo-50 px-2 py-1 rounded-lg border text-indigo-700 font-medium">{u.sectorNombre}</span> : <span className="text-xs text-gray-400">—</span>}
                  </td>
                
                  <td className="px-5 py-3 text-gray-500">
                    {u.supervisorNombre ? <span className="text-xs bg-gray-100 px-2 py-1 rounded-lg border">{u.supervisorNombre}</span> : <span className="text-xs text-gray-400">—</span>}
                  </td>
                  */}

                  <td className="px-5 py-3">
                    {u.activo
                      ? <span className="flex items-center gap-1 text-green-600 text-xs font-medium"><CheckCircle className="w-3.5 h-3.5" />Activo</span>
                      : <span className="flex items-center gap-1 text-gray-400 text-xs font-medium"><XCircle className="w-3.5 h-3.5" />Inactivo</span>}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleEditar(u)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleToggle(u)} className={`p-1.5 rounded-lg transition-colors ${u.activo ? 'text-gray-400 hover:text-red-500 hover:bg-red-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`}>
                        {u.activo ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// Panel Sectores
// ────────────────────────────────────────────────────────────
const PanelSectores = () => {
  const [sectores, setSectores] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ nombre: '', codigo: '', supervisorId: '' });

  const fetchSectores = async () => {
    setLoading(true);
    try {
      const [sRes, uRes] = await Promise.all([api.get('/sectores'), api.get('/usuarios')]);
      setSectores(Array.isArray(sRes.data?.data) ? sRes.data.data : []);
      setUsuarios(Array.isArray(uRes.data?.data) ? uRes.data.data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSectores(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editando) {
        await api.put(`/sectores/${editando}`, form);
        Swal.fire({ icon: 'success', title: 'Sector actualizado', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
      } else {
        await api.post('/sectores', form);
        Swal.fire({ icon: 'success', title: 'Sector creado', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
      }
      setShowForm(false);
      setEditando(null);
      setForm({ nombre: '', codigo: '', supervisorId: '' });
      fetchSectores();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.mensaje || 'Error al guardar sector.' });
    }
  };

  const handleEditar = (s) => {
    setEditando(s.id);
    setForm({ nombre: s.nombre, codigo: s.codigo || '', supervisorId: s.supervisorId || '' });
    setShowForm(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{sectores.length} sectores</p>
        <button onClick={() => { setShowForm(true); setEditando(null); setForm({ nombre: '', codigo: '', supervisorId: '' }); }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700">
          <PlusCircle className="w-4 h-4" /> Nuevo Sector
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                {editando ? <Pencil className="w-5 h-5 text-indigo-500" /> : <PlusCircle className="w-5 h-5 text-indigo-500" />}
                {editando ? 'Editar Sector' : 'Nuevo Sector'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre *</label>
                  <input value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} required
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-400 outline-none transition-colors" placeholder="Ej: Sector Rojo I" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Código</label>
                  <input value={form.codigo} onChange={e => setForm(p => ({ ...p, codigo: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-400 outline-none transition-colors" placeholder="SR-I" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Supervisor de Sector</label>
                  <select name="supervisorId" value={form.supervisorId} onChange={e => setForm(p => ({ ...p, supervisorId: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-400 outline-none transition-colors">
                    <option value="">Ninguno (Opcional)...</option>
                    {usuarios.filter(u => u.rol === 'SUP_SECTORIAL').map(u => (
                      <option key={u.id} value={u.id}>{u.nombres} {u.apellidos} - {u.rol}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">Cancelar</button>
                <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm">{editando ? 'Guardar Cambios' : 'Crear Sector'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-10 text-center"><Loader2 className="w-7 h-7 animate-spin mx-auto text-indigo-500" /></div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-100">
          <table className="w-full text-sm bg-white">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-5 py-3 text-left">ID</th>
                <th className="px-5 py-3 text-left">Nombre</th>
                <th className="px-5 py-3 text-left">Código</th>
                <th className="px-5 py-3 text-left">Supervisor</th>
                <th className="px-5 py-3 text-left">Estado</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sectores.map(s => (
                <tr key={s.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3 text-gray-400">#{s.id}</td>
                  <td className="px-5 py-3 font-medium text-gray-800">{s.nombre}</td>
                  <td className="px-5 py-3 text-gray-500">{s.codigo || '—'}</td>
                  <td className="px-5 py-3 text-gray-500">
                    {s.supervisorNombre ? <span className="text-xs bg-gray-100 px-2 py-1 rounded-lg border">{s.supervisorNombre}</span> : <span className="text-xs text-gray-400">—</span>}
                  </td>
                  <td className="px-5 py-3">
                    {s.activo
                      ? <span className="text-green-600 text-xs font-semibold">Activo</span>
                      : <span className="text-gray-400 text-xs font-semibold">Inactivo</span>}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => handleEditar(s)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};



// ────────────────────────────────────────────────────────────
// Panel Grupos Familiares
// ────────────────────────────────────────────────────────────
const PanelGruposFamiliares = () => {
  const [grupos, setGrupos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [sectores, setSectores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ nombre: '', direccion: '', idLider: '', idSector: '', activo: true });

  const fetchDatos = async () => {
    setLoading(true);
    try {
      const [gRes, uRes, sRes] = await Promise.all([
        api.get('/grupos-familiares'),
        api.get('/usuarios'),
        api.get('/sectores')
      ]);
      setGrupos(Array.isArray(gRes.data?.data) ? gRes.data.data : []);
      setUsuarios(Array.isArray(uRes.data?.data) ? uRes.data.data : []);
      setSectores(Array.isArray(sRes.data?.data) ? sRes.data.data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDatos(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editando) {
        await api.put(`/grupos-familiares/${editando}`, form);
        Swal.fire({ icon: 'success', title: 'Grupo actualizado', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
      } else {
        await api.post('/grupos-familiares', form);
        Swal.fire({ icon: 'success', title: 'Grupo creado', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
      }
      setShowForm(false);
      setEditando(null);
      setForm({ nombre: '', direccion: '', idLider: '', idSector: '', activo: true });
      fetchDatos();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.mensaje || 'Error al guardar grupo.' });
    }
  };

  const handleEditar = (g) => {
    setEditando(g.id);
    setForm({
      nombre: g.nombre,
      direccion: g.direccion || '',
      idLider: g.liderId || '',
      idSector: g.sectorId || '',
      activo: g.activo
    });
    setShowForm(true);
  };

  const handleToggle = async (g) => {
    try {
      await api.patch(`/grupos-familiares/${g.id}/activar`);
      Swal.fire({ icon: 'success', title: 'Estado actualizado', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
      fetchDatos();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.mensaje || 'Error al cambiar estado.' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{grupos.length} grupos familiares</p>
        <button onClick={() => { setShowForm(true); setEditando(null); setForm({ nombre: '', direccion: '', idLider: '', idSector: '', activo: true }); }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700">
          <PlusCircle className="w-4 h-4" /> Nuevo Grupo Familiar
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                {editando ? <Pencil className="w-5 h-5 text-indigo-500" /> : <PlusCircle className="w-5 h-5 text-indigo-500" />}
                {editando ? 'Editar Grupo' : 'Nuevo Grupo Familiar'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre *</label>
                  <input value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} required
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-400 outline-none transition-colors" placeholder="Ej: Grupo Fe y Esperanza" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Dirección</label>
                  <input value={form.direccion} onChange={e => setForm(p => ({ ...p, direccion: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-400 outline-none transition-colors" placeholder="Calle 123..." />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Sector *</label>
                  <select name="idSector" value={form.idSector} onChange={e => setForm(p => ({ ...p, idSector: e.target.value }))} required
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-400 outline-none transition-colors">
                    <option value="">Seleccionar Sector...</option>
                    {sectores.map(s => (
                      <option key={s.id} value={s.id}>{s.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Líder *</label>
                  <select name="idLider" value={form.idLider} onChange={e => setForm(p => ({ ...p, idLider: e.target.value }))} required
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-400 outline-none transition-colors">
                    <option value="">Seleccionar Líder...</option>
                    {usuarios.filter(u => u.rol === 'LIDER').map(u => (
                      <option key={u.id} value={u.id}>{u.nombres} {u.apellidos}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">Cancelar</button>
                <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm">{editando ? 'Guardar Cambios' : 'Crear Grupo'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-10 text-center"><Loader2 className="w-7 h-7 animate-spin mx-auto text-indigo-500" /></div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-100">
          <table className="w-full text-sm bg-white">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-5 py-3 text-left">ID</th>
                <th className="px-5 py-3 text-left">Nombre</th>
                <th className="px-5 py-3 text-left">Sector</th>
                <th className="px-5 py-3 text-left">Líder</th>
                <th className="px-5 py-3 text-left">Estado</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {grupos.map(g => (
                <tr key={g.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3 text-gray-400">#{g.id}</td>
                  <td className="px-5 py-3 font-medium text-gray-800">{g.nombre}</td>
                  <td className="px-5 py-3 text-gray-500">
                    {g.sectorNombre ? <span className="text-xs bg-indigo-50 px-2 py-1 rounded-lg border text-indigo-700 font-medium">{g.sectorNombre}</span> : <span className="text-xs text-gray-400">—</span>}
                  </td>
                  <td className="px-5 py-3 text-gray-500">{g.liderNombre || '—'}</td>
                  <td className="px-5 py-3">
                    {g.activo
                      ? <span className="flex items-center gap-1 text-green-600 text-xs font-semibold"><CheckCircle className="w-3.5 h-3.5" />Activo</span>
                      : <span className="flex items-center gap-1 text-gray-400 text-xs font-semibold"><XCircle className="w-3.5 h-3.5" />Inactivo</span>}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleEditar(g)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleToggle(g)} className={`p-1.5 rounded-lg transition-colors ${g.activo ? 'text-gray-400 hover:text-red-500 hover:bg-red-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`}>
                        {g.activo ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};



// ────────────────────────────────────────────────────────────
// Dashboard Admin Principal
// ────────────────────────────────────────────────────────────
const DashboardAdmin = () => {
  const [tab, setTab] = useState('usuarios');

  const tabs = [
    { id: 'usuarios', label: 'Usuarios', icon: <Users className="w-4 h-4" /> },
    { id: 'sectores', label: 'Sectores', icon: <Layers className="w-4 h-4" /> },
    { id: 'grupos', label: 'Grupos Familiares', icon: <Building2 className="w-4 h-4" /> },
    // { id: 'consolidado', label: 'Supervisor Sec.', icon: <BarChart2 className="w-4 h-4" /> },
    // { id: 'finanzas', label: 'Finanzas', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'config', label: 'Configuración', icon: <ImagePlus className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Shield className="w-6 h-6 text-rose-500" /> Panel de Administración
        </h1>
        <p className="text-gray-500 text-sm mt-1">Gestión completa del sistema.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(t => (
          <Tab key={t.id} label={t.label} icon={t.icon} active={tab === t.id} onClick={() => setTab(t.id)} />
        ))}
      </div>

      {/* Panel content */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        {tab === 'usuarios' && <PanelUsuarios />}
        {tab === 'sectores' && <PanelSectores />}
        {tab === 'grupos' && <PanelGruposFamiliares />}
        {/*tab === 'consolidado' && <PanelConsolidadoAdmin />*/}
        {/*tab === 'finanzas' && <PanelFinanzasAdmin />*/}
        {tab === 'config' && <PanelConfiguracion />}
      </div>
    </div>
  );
};

export default DashboardAdmin;
