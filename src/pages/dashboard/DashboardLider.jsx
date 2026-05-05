import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import api from '../../utils/axios';
import {
  FileText, Users, Calendar, RefreshCw, Loader2,
  PlusCircle, Send, CheckCircle, Clock, Pencil, Trash2
} from 'lucide-react';
import Swal from 'sweetalert2';

const estadoConfig = {
  ENVIADO: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: <Send className="w-3 h-3" />, label: 'Enviado' },
  APROBADO: { color: 'bg-green-100 text-green-700 border-green-200', icon: <CheckCircle className="w-3 h-3" />, label: 'Aprobado' },
  BORRADOR: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: <Clock className="w-3 h-3" />, label: 'Borrador' },
};

const DashboardLider = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [reportes, setReportes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  // Filtro de Fechas (filtra por semanaDesde del reporte)
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchReportes = async () => {
    setIsLoading(true);
    try {
      const url = user?.grupoFamiliarId ? `/reportes/grupo/${user.grupoFamiliarId}` : '/reportes';
      const response = await api.get(url);
      const data = Array.isArray(response.data?.data) ? response.data.data : [];
      // Ordenar por fecha más reciente primero
      data.sort((a, b) => new Date(b.semanaDesde) - new Date(a.semanaDesde));
      setReportes(data);
    } catch (error) {
      console.error('Error cargando reportes:', error);
      Swal.fire({
        icon: 'error', title: 'Error de Red',
        text: 'No se pudieron cargar los reportes semanales.',
        toast: true, position: 'top-end', timer: 3000, showConfirmButton: false,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchReportes(); }, []);

  // Filtrar por semanaDesde del reporte
  const reportesFiltrados = reportes.filter((r) => {
    if (!startDate && !endDate) return true;
    const rDate = r.semanaDesde; // formato 'YYYY-MM-DD'
    if (!rDate) return true;
    if (startDate && rDate < startDate) return false;
    if (endDate && rDate > endDate) return false;
    return true;
  });

  const handleEliminar = async (id) => {
    const result = await Swal.fire({
      title: '¿Eliminar reporte?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });
    if (!result.isConfirmed) return;
    setActionId(id);
    try {
      await api.delete(`/reportes/${id}`);
      Swal.fire({ icon: 'success', title: 'Eliminado', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
      setReportes(prev => prev.filter(r => r.id !== id));
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Error', text: e.response?.data?.mensaje || 'No se pudo eliminar.', confirmButtonColor: '#4f46e5' });
    } finally {
      setActionId(null);
    }
  };

  const totalReportes = reportesFiltrados.length;
  const totalAsistencia = reportesFiltrados.reduce((sum, r) =>
    sum + (r.cantHermanos || 0) + (r.cantAmigos || 0) + (r.cantAdolescentes || 0), 0);
  const totalEnviados = reportesFiltrados.filter(r => r.estado === 'ENVIADO' || r.estado === 'APROBADO').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            ¡Bienvenido, {user?.nombreCompleto?.split(' ')[0] || 'Líder'}! 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {user?.grupoFamiliarNombre ? `Grupo: ${user.grupoFamiliarNombre}` : 'Dashboard del Líder'} {user?.sectorNombre ? ` | Sector: ${user.sectorNombre}` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchReportes}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors shadow-sm text-sm font-medium"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          <button
            onClick={() => navigate('/lider/reporte/nuevo')}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm text-sm font-medium"
          >
            <PlusCircle className="w-4 h-4" />
            Nuevo Reporte
          </button>
        </div>
      </div>

      {/* Stats Cards — sin ofrenda */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Reportes</p>
            <p className="text-2xl font-bold text-gray-800">{totalReportes}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Asistencia</p>
            <p className="text-2xl font-bold text-gray-800">{totalAsistencia}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Send className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Enviados / Aprobados</p>
            <p className="text-2xl font-bold text-gray-800">{totalEnviados}</p>
          </div>
        </div>
      </div>

      {/* Tabla de reportes */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg font-bold text-gray-800">Historial de Reportes Semanales</h2>
          </div>
          {/* Filtros de Fecha */}
          <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-sm text-gray-600 outline-none w-32"
            />
            <span className="text-gray-400 text-xs">—</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-sm text-gray-600 outline-none w-32"
            />
            {(startDate || endDate) && (
              <button
                onClick={() => { setStartDate(''); setEndDate(''); }}
                className="text-gray-400 hover:text-red-500 px-1 font-bold"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-gray-500">
            <Loader2 className="w-8 h-8 mx-auto animate-spin mb-3 text-indigo-500" />
            <p>Cargando reportes...</p>
          </div>
        ) : reportesFiltrados.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium mb-1">No tienes reportes aún.</p>
            <p className="text-sm mb-4">Registra tu primer reporte semanal.</p>
            <button
              onClick={() => navigate('/lider/reporte/nuevo')}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              <PlusCircle className="w-4 h-4" /> Crear Reporte
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3 font-medium">Semana</th>
                  <th className="px-5 py-3 font-medium">Asistencia</th>
                  <th className="px-5 py-3 font-medium">Convertidos</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                  <th className="px-5 py-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {reportesFiltrados.map((r) => {
                  const asist = (r.cantHermanos || 0) + (r.cantAmigos || 0) + (r.cantAdolescentes || 0);
                  const cfg = estadoConfig[r.estado] || estadoConfig.BORRADOR;
                  const esBorrador = r.estado === 'ENVIADO';
                  const isActing = actionId === r.id;
                  return (
                    <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-800">{r.semanaDesde}</p>
                        <p className="text-xs text-gray-400">al {r.semanaHasta}</p>
                      </td>
                      <td className="px-5 py-4 text-gray-600">{asist} personas</td>
                      <td className="px-5 py-4 text-gray-600">{r.cantConvertidos || 0}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full border ${cfg.color}`}>
                          {cfg.icon} {cfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {/* Editar — solo en ENVIADO */}
                          <button
                            onClick={() => navigate(`/lider/reporte/editar/${r.id}`)}
                            disabled={!esBorrador || isActing}
                            title={esBorrador ? 'Editar reporte' : 'No se puede editar en estado ' + r.estado}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                              ${esBorrador
                                ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Editar
                          </button>
                          {/* Eliminar — solo en ENVIADO */}
                          <button
                            onClick={() => handleEliminar(r.id)}
                            disabled={!esBorrador || isActing}
                            title={esBorrador ? 'Eliminar reporte' : 'No se puede eliminar en estado ' + r.estado}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                              ${esBorrador
                                ? 'bg-red-50 text-red-700 hover:bg-red-100'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                          >
                            {isActing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardLider;
