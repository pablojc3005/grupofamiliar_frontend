import { useState, useEffect } from 'react';
import useAuthStore from '../../store/authStore';
import api from '../../utils/axios';
import Swal from 'sweetalert2';
import { BarChart2, Users, RefreshCw, Loader2, CheckCircle, XCircle, Send, Download, Calendar, Search, ClipboardList, FileText, Bell, PlusCircle, Eye, X } from 'lucide-react';
import { exportConsolidadoExcel, exportConsolidadoPDF } from '../../utils/exportadores';

const estadoConfig = {
  ENVIADO: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: <Send className="w-3 h-3" />, label: 'Enviado' },
  APROBADO: { color: 'bg-green-100 text-green-700 border-green-200', icon: <CheckCircle className="w-3 h-3" />, label: 'Aprobado' },
  BORRADOR: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: <Send className="w-3 h-3" />, label: 'Borrador' },
};

const suma = (arr, field) => arr.reduce((acc, r) => acc + (Number(r[field]) || 0), 0);

// Formatea oración como "X Hr Y Mn"
const fmtOracion = (hrs, min) => {
  const h = Number(hrs) || 0;
  const m = Number(min) || 0;
  if (h === 0 && m === 0) return '—';
  return `${h} Hr ${m} Mn`;
};

const sumarOracion = (data) => {
  let totalMin = 0;
  for (const row of data) {
    totalMin += (Number(row.horasOracion) || 0) * 60 + (Number(row.minutosOracion) || 0);
  }
  const horas = Math.floor(totalMin / 60);
  const minutos = totalMin % 60;
  return fmtOracion(horas, minutos);
};

// Icono ojo con estado activo/inactivo
const EyeIcon = ({ active, onClick }) => (
  <button
    onClick={onClick}
    disabled={!active}
    title={active ? 'Ver observación' : 'Sin observación'}
    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all
      ${active
        ? 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200 hover:scale-110 cursor-pointer shadow-sm'
        : 'text-gray-200 cursor-default'}`}
  >
    <Eye className="w-4 h-4" />
  </button>
);

// Modal de observaciones
const ObservacionModal = ({ reporte, onClose }) => {
  if (!reporte) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-[fadeInScale_0.2s_ease]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-gray-800">Observación</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {reporte.grupoFamiliarNombre || `Líder #${reporte.liderId}`}
              {reporte.liderNombre ? ` · ${reporte.liderNombre}` : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
          {reporte.observaciones}
        </div>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};


const DashboardSupervisorSectorial = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('aprobaciones');
  // --- Alertas state ---
  const [alertas, setAlertas] = useState([]);
  const [alertasLoading, setAlertasLoading] = useState(false);
  const [alertasDesde, setAlertasDesde] = useState(new Date().toISOString().split('T')[0]);
  const [alertasHasta, setAlertasHasta] = useState(new Date().toISOString().split('T')[0]);
  // --- Form registro por líder ---
  const [showRegForm, setShowRegForm] = useState(false);
  const [regGrupoId, setRegGrupoId] = useState('');
  const [regForm, setRegForm] = useState({ semanaDesde: new Date().toISOString().split('T')[0], semanaHasta: new Date().toISOString().split('T')[0], cantHermanos: 0, cantAmigos: 0, cantAdolescentes: 0, cantConvertidos: 0, cantNinosCristianos: 0, cantNinosAmigos: 0, cantVisitaConsolidacion: 0, cantVisitaCasaDePaz: 0, cantVisitaHogar: 0, cantHrOracion: 0, cantHrMep: 0, cantHrDiscipulado: 0, cantRetiroEspiritual: 0, ofrendaSabado: 0, ofrendaNinos: 0, ofrendaMiercoles: 0, observaciones: '' });
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState(null);

  // Filtros
  const today = new Date().toISOString().split('T')[0];
  const [semanaDesde, setSemanaDesde] = useState(today);
  const [semanaHasta, setSemanaHasta] = useState(today);
  const [grupoSelId, setGrupoSelId] = useState('');
  const [buscado, setBuscado] = useState(false);
  const [modalReporte, setModalReporte] = useState(null);

  const buscarReportes = async () => {
    const idSector = user?.sectorId;
    if (!idSector) {
      Swal.fire({ icon: 'warning', title: 'Error', text: 'No tienes un sector asignado.' });
      return;
    }
    setLoading(true);
    setBuscado(true);
    try {
      const res = await api.get(`/reportes/sector/${idSector}`);
      const data = Array.isArray(res.data?.data) ? res.data.data : [];
      setReportes(data);
      if (data.length === 0) {
        Swal.fire({ icon: 'info', title: 'Sin reportes', text: 'No hay reportes registrados para tu sector.', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });
      }
    } catch (error) {
      console.error('Error:', error);
      Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.mensaje || 'No se pudieron cargar los reportes.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.sectorId) {
      buscarReportes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.sectorId]);

  const reportesFiltrados = reportes.filter(r => {
    if (grupoSelId && String(r.grupoFamiliarId) !== String(grupoSelId)) return false;
    const d = r.semanaDesde;
    if (!d) return true;
    if (semanaDesde && d < semanaDesde) return false;
    if (semanaHasta && d > semanaHasta) return false;
    return true;
  });

  const handleAprobar = async (id) => {
    const ok = await Swal.fire({ title: '¿Aprobar reporte?', icon: 'question', showCancelButton: true, confirmButtonColor: '#059669', cancelButtonColor: '#6b7280', confirmButtonText: 'Sí, aprobar' });
    if (!ok.isConfirmed) return;
    setLoadingAction(id);
    try {
      await api.patch(`/reportes/${id}/aprobar`);
      Swal.fire({ icon: 'success', title: '¡Aprobado!', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
      buscarReportes();
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Error', text: e.response?.data?.mensaje || 'No se pudo aprobar.' });
    } finally { setLoadingAction(null); }
  };

  const handleRechazar = async (id) => {
    const ok = await Swal.fire({ title: '¿Rechazar reporte?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc2626', cancelButtonColor: '#6b7280', confirmButtonText: 'Sí, rechazar' });
    if (!ok.isConfirmed) return;
    setLoadingAction(id);
    try {
      await api.patch(`/reportes/${id}/rechazar`);
      Swal.fire({ icon: 'info', title: 'Rechazado', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
      buscarReportes();
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Error', text: e.response?.data?.mensaje || 'No se pudo rechazar.' });
    } finally { setLoadingAction(null); }
  };

  const totalAsistencia = suma(reportesFiltrados, 'cantHermanos') + suma(reportesFiltrados, 'cantAmigos') + suma(reportesFiltrados, 'cantAdolescentes');
  const totalConvertidos = suma(reportesFiltrados, 'cantConvertidos');
  const enviados = reportesFiltrados.filter(r => r.estado === 'ENVIADO').length;
  const aprobados = reportesFiltrados.filter(r => r.estado === 'APROBADO').length;
  const sectorNombreSel = user?.sectorNombre || '';
  const nombreArchivo = `Consolidado_${sectorNombreSel}${semanaDesde ? `_${semanaDesde}` : ''}`;

  const gruposUnicos = Array.from(new Map(reportes.map(r => [r.grupoFamiliarId, r.grupoFamiliarNombre || `Grupo de ${r.liderNombre}`])).entries());

  const fmtBool = (v) => v ? <span className="text-green-600 font-bold">✓</span> : <span className="text-gray-300">✗</span>;

  return (
    <>
      {/* Modal observaciones */}
      <ObservacionModal reporte={modalReporte} onClose={() => setModalReporte(null)} />

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Supervisor Sectorial 📋</h1>
            <p className="text-gray-500 text-sm mt-1">{sectorNombreSel ? `Sector: ${sectorNombreSel}` : 'Cargando sector...'}</p>
          </div>
          <button onClick={buscarReportes} disabled={loading}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors shadow-sm text-sm font-medium self-start disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Actualizar
          </button>
        </div>

        <div className="flex gap-4 border-b border-gray-200">
          <button onClick={() => setActiveTab('aprobaciones')} className={`flex items-center gap-2 pb-3 px-1 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'aprobaciones' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}><ClipboardList className="w-4 h-4" /> Aprobaciones</button>
          <button onClick={() => setActiveTab('consolidado')} className={`flex items-center gap-2 pb-3 px-1 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'consolidado' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}><FileText className="w-4 h-4" /> Reporte Consolidado</button>
          <button onClick={() => setActiveTab('alertas')} className={`flex items-center gap-2 pb-3 px-1 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'alertas' ? 'border-red-500 text-red-500' : 'border-transparent text-gray-500 hover:text-gray-700'}`}><Bell className="w-4 h-4" /> Alertas {alertas.length > 0 && <span className="ml-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{alertas.length}</span>}</button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-500" /> Filtros
          </h2>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Grupo Familiar</label>
              <select value={grupoSelId} onChange={e => setGrupoSelId(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-400 outline-none min-w-[160px]">
                <option value="">Todos los grupos</option>
                {gruposUnicos.map(([id, nombre]) => (
                  <option key={id} value={id}>{nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Semana Desde</label>
              <input type="date" value={semanaDesde} onChange={e => setSemanaDesde(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-400 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Semana Hasta</label>
              <input type="date" value={semanaHasta} onChange={e => setSemanaHasta(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-400 outline-none" />
            </div>
            {(semanaDesde !== today || semanaHasta !== today || grupoSelId !== '') && (
              <button onClick={() => { setSemanaDesde(today); setSemanaHasta(today); setGrupoSelId(''); }}
                className="text-sm text-gray-400 hover:text-red-500 transition-colors pb-2">
                Limpiar filtro
              </button>
            )}
          </div>
        </div>

        {buscado && activeTab === 'aprobaciones' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Send className="w-6 h-6" /></div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Por Aprobar</p>
                  <p className="text-xl font-bold text-gray-800">{enviados}</p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
                <div className="p-2.5 bg-green-50 text-green-600 rounded-xl"><CheckCircle className="w-6 h-6" /></div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Aprobados</p>
                  <p className="text-xl font-bold text-gray-800">{aprobados}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-800">Gestión de Reportes</h2>
                <span className="text-xs text-gray-400">{reportesFiltrados.length} reportes</span>
              </div>
              {loading ? (
                <div className="p-8 text-center"><Loader2 className="w-7 h-7 mx-auto animate-spin text-indigo-500" /></div>
              ) : reportesFiltrados.length === 0 ? (
                <div className="p-10 text-center text-gray-400">
                  <BarChart2 className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                  <p>No hay reportes para el filtro seleccionado.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                      <tr>
                        <th className="px-5 py-3">Grupo/Líder</th>
                        <th className="px-5 py-3">Semana</th>
                        <th className="px-5 py-3">Asistencia</th>
                        <th className="px-5 py-3">Estado</th>
                        <th className="px-5 py-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {reportesFiltrados.map(r => {
                        const asist = (r.cantHermanos || 0) + (r.cantAmigos || 0) + (r.cantAdolescentes || 0);
                        const cfg = estadoConfig[r.estado] || estadoConfig.BORRADOR;
                        const isActing = loadingAction === r.id;
                        return (
                          <tr key={r.id} className="hover:bg-gray-50/50">
                            <td className="px-5 py-3 font-medium text-gray-900">
                              {r.grupoFamiliarNombre || `Líder #${r.liderId}`}
                              <br /><span className="text-xs font-normal text-gray-500">{r.liderNombre}</span>
                            </td>
                            <td className="px-5 py-3 text-gray-600 text-xs">{r.semanaDesde} → {r.semanaHasta}</td>
                            <td className="px-5 py-3 text-gray-600">{asist}</td>
                            <td className="px-5 py-3">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full border ${cfg.color}`}>
                                {cfg.icon} {cfg.label}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-right">
                              {r.estado === 'ENVIADO' && (
                                <div className="flex justify-end gap-2">
                                  <button onClick={() => handleAprobar(r.id)} disabled={isActing}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50 transition-colors">
                                    {isActing ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />} Aprobar
                                  </button>
                                  <button onClick={() => handleRechazar(r.id)} disabled={isActing}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 disabled:opacity-50 transition-colors">
                                    {isActing ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />} Rechazar
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {buscado && activeTab === 'consolidado' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><BarChart2 className="w-6 h-6" /></div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Asistencia Total</p>
                  <p className="text-xl font-bold text-gray-800">{totalAsistencia}</p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
                <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl"><Users className="w-6 h-6" /></div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Convertidos</p>
                  <p className="text-xl font-bold text-gray-800">{totalConvertidos}</p>
                </div>
              </div>
            </div>

            {reportesFiltrados.length > 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/50">
                  <div>
                    <h2 className="text-base font-bold text-gray-800">Tabla Consolidada</h2>
                    {semanaDesde && <p className="text-xs text-gray-400 mt-0.5">Período: {semanaDesde} → {semanaHasta || 'hoy'}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => exportConsolidadoExcel(reportesFiltrados, `Consolidado ${sectorNombreSel}`, nombreArchivo)}
                      className="px-3 py-1.5 bg-green-600 text-white border border-green-700 rounded-lg text-xs font-semibold hover:bg-green-700 flex items-center gap-1.5 transition-colors shadow-sm">
                      <Download className="w-3.5 h-3.5" /> Excel
                    </button>
                    <button onClick={() => exportConsolidadoPDF(reportesFiltrados, `Consolidado ${sectorNombreSel}`, nombreArchivo)}
                      className="px-3 py-1.5 bg-red-600 text-white border border-red-700 rounded-lg text-xs font-semibold hover:bg-red-700 flex items-center gap-1.5 transition-colors shadow-sm">
                      <Download className="w-3.5 h-3.5" /> PDF
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-center border-collapse min-w-[1200px]">
                    <thead>
                      <tr className="bg-indigo-600 text-white font-bold">
                        <th className="px-2 py-2 border border-indigo-500" rowSpan={2}>ÍTEM</th>
                        <th className="px-2 py-2 border border-indigo-500" rowSpan={2}>LÍDERES / GRUPO</th>
                        {/* INFO GENERAL */}
                        <th className="px-2 py-2 border border-indigo-500 bg-violet-600" colSpan={5}>INFO GENERAL</th>
                        {/* ASISTENCIA */}
                        <th className="px-2 py-2 border border-indigo-500" colSpan={4}>ASISTENCIA</th>
                        {/* NIÑOS / CONVERTIDOS */}
                        <th className="px-2 py-2 border border-indigo-500" colSpan={4}>NIÑOS / CONVERTIDOS</th>
                        {/* VISITAS */}
                        <th className="px-2 py-2 border border-indigo-500" colSpan={3}>VISITAS</th>
                        {/* ACT. ESPIRITUALES */}
                        <th className="px-2 py-2 border border-indigo-500" colSpan={5}>ACT. ESPIRITUALES</th>
                        {/* OFRENDAS */}
                        <th className="px-2 py-2 border border-indigo-500" colSpan={4}>OFRENDAS (S/)</th>
                        {/* OBS */}
                        <th className="px-2 py-2 border border-indigo-500" rowSpan={2}>OBS</th>
                      </tr>
                      <tr className="bg-indigo-500 text-white font-semibold">
                        {/* Info general sub-headers */}
                        <th className="px-2 py-1.5 border border-violet-400 bg-violet-500">DIEZMO</th>
                        <th className="px-2 py-1.5 border border-violet-400 bg-violet-500">LECT. BIB.</th>
                        <th className="px-2 py-1.5 border border-violet-400 bg-violet-500">ORACIÓN</th>
                        <th className="px-2 py-1.5 border border-violet-400 bg-violet-500">VISITÓ</th>
                        <th className="px-2 py-1.5 border border-violet-400 bg-violet-500">AYUNO</th>
                        {/* Asistencia */}
                        {['HERMANOS', 'AMIGOS', 'ADOLESC.', 'TOTAL'].map(h => (
                          <th key={h} className={`px-2 py-1.5 border border-indigo-400 ${h === 'TOTAL' ? 'bg-indigo-700' : ''}`}>{h}</th>
                        ))}
                        {/* Niños / Convertidos */}
                        {['CONVERT.', 'NIÑOS CRIST.', 'NIÑOS AMIGOS', 'TOTAL'].map(h => (
                          <th key={h} className={`px-2 py-1.5 border border-indigo-400 ${h === 'TOTAL' ? 'bg-indigo-700' : ''}`}>{h}</th>
                        ))}
                        {/* Visitas */}
                        {['CONSOL.', 'CASA PAZ', 'HOGAR'].map(h => (
                          <th key={h} className="px-2 py-1.5 border border-indigo-400">{h}</th>
                        ))}
                        {/* Act. espirituales */}
                        {['CULTO ORAC.', 'MEP', 'DISCIP.', 'RETIRO', 'CULTO CENT.'].map(h => (
                          <th key={h} className="px-2 py-1.5 border border-indigo-400">{h}</th>
                        ))}
                        {/* Ofrendas */}
                        {['SÁBADO', 'NIÑOS', 'MIÉRC.', 'TOTAL'].map(h => (
                          <th key={h} className={`px-2 py-1.5 border border-indigo-400 ${h === 'TOTAL' ? 'bg-indigo-700' : ''}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reportesFiltrados.map((r, i) => {
                        const tA = (r.cantHermanos || 0) + (r.cantAmigos || 0) + (r.cantAdolescentes || 0);
                        const tN = (r.cantNinosCristianos || 0) + (r.cantNinosAmigos || 0);
                        const tO = Number(r.ofrendaSabado || 0) + Number(r.ofrendaNinos || 0) + Number(r.ofrendaMiercoles || 0);
                        const tieneObs = r.observaciones && r.observaciones.trim().length > 0;
                        return (
                          <tr key={r.id} className="hover:bg-indigo-50/30 border-b border-gray-100">
                            <td className="px-2 py-2 border border-gray-200 font-semibold text-gray-700">{i + 1}</td>
                            <td className="px-3 py-2 border border-gray-200 text-left">
                              <span className="font-medium text-gray-900">{r.grupoFamiliarNombre || `Líder #${r.liderId}`}</span>
                              <br /><span className="text-[10px] text-gray-500">{r.liderNombre}</span>
                            </td>
                            {/* Info general */}
                            <td className="px-2 py-2 border border-violet-100 bg-violet-50/40">{fmtBool(r.diezmo)}</td>
                            <td className="px-2 py-2 border border-violet-100 bg-violet-50/40">{fmtBool(r.lecturaBiblia)}</td>
                            <td className="px-2 py-2 border border-violet-100 bg-violet-50/40 whitespace-nowrap font-medium text-indigo-700">{fmtOracion(r.horasOracion, r.minutosOracion)}</td>
                            <td className="px-2 py-2 border border-violet-100 bg-violet-50/40">{fmtBool(r.visito)}</td>
                            <td className="px-2 py-2 border border-violet-100 bg-violet-50/40">{fmtBool(r.ayuno)}</td>
                            {/* Asistencia */}
                            <td className="px-2 py-2 border border-gray-200">{r.cantHermanos || 0}</td>
                            <td className="px-2 py-2 border border-gray-200">{r.cantAmigos || 0}</td>
                            <td className="px-2 py-2 border border-gray-200">{r.cantAdolescentes || 0}</td>
                            <td className="px-2 py-2 border border-gray-200 font-bold bg-indigo-50 text-indigo-700">{tA}</td>
                            {/* Niños / Convertidos */}
                            <td className="px-2 py-2 border border-gray-200">{r.cantConvertidos || 0}</td>
                            <td className="px-2 py-2 border border-gray-200">{r.cantNinosCristianos || 0}</td>
                            <td className="px-2 py-2 border border-gray-200">{r.cantNinosAmigos || 0}</td>
                            <td className="px-2 py-2 border border-gray-200 font-bold bg-indigo-50 text-indigo-700">{tN}</td>
                            {/* Visitas */}
                            <td className="px-2 py-2 border border-gray-200">{r.cantVisitaConsolidacion || 0}</td>
                            <td className="px-2 py-2 border border-gray-200">{r.cantVisitaCasaDePaz || 0}</td>
                            <td className="px-2 py-2 border border-gray-200">{r.cantVisitaHogar || 0}</td>
                            {/* Act. espirituales */}
                            <td className="px-2 py-2 border border-gray-200">{r.cultoHoracion || 0}</td>
                            <td className="px-2 py-2 border border-gray-200">{r.cantHrMep || 0}</td>
                            <td className="px-2 py-2 border border-gray-200">{r.cantHrDiscipulado || 0}</td>
                            <td className="px-2 py-2 border border-gray-200">{r.cantRetiroEspiritual || 0}</td>
                            <td className="px-2 py-2 border border-gray-200">{r.cantCultoCentral || 0}</td>
                            {/* Ofrendas */}
                            <td className="px-2 py-2 border border-gray-200">{Number(r.ofrendaSabado || 0).toFixed(2)}</td>
                            <td className="px-2 py-2 border border-gray-200">{Number(r.ofrendaNinos || 0).toFixed(2)}</td>
                            <td className="px-2 py-2 border border-gray-200">{Number(r.ofrendaMiercoles || 0).toFixed(2)}</td>
                            <td className="px-2 py-2 border border-gray-200 font-bold bg-indigo-50 text-indigo-700">{tO.toFixed(2)}</td>
                            {/* Observaciones */}
                            <td className="px-2 py-2 border border-gray-200">
                              <div className="flex justify-center">
                                <EyeIcon active={tieneObs} onClick={() => tieneObs && setModalReporte(r)} />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-yellow-400 font-bold text-gray-900 border-t-2 border-gray-400">
                        <td className="px-2 py-3 border border-gray-300 text-center" colSpan={2}>TOTAL</td>
                        {/* Info general */}
                        <td className="px-2 py-3 border border-gray-300">{suma(reportesFiltrados, 'diezmo')}</td>
                        <td className="px-2 py-3 border border-gray-300">{suma(reportesFiltrados, 'lecturaBiblia')}</td>
                        <td className="px-2 py-3 border border-gray-300">{sumarOracion(reportesFiltrados, 'horasOracion', 'minutosOracion')}</td>
                        <td className="px-2 py-3 border border-gray-300">{suma(reportesFiltrados, 'visito')}</td>
                        <td className="px-2 py-3 border border-gray-300">{suma(reportesFiltrados, 'ayuno')}</td>
                        {/* Asistencia */}
                        <td className="px-2 py-3 border border-gray-300">{suma(reportesFiltrados, 'cantHermanos')}</td>
                        <td className="px-2 py-3 border border-gray-300">{suma(reportesFiltrados, 'cantAmigos')}</td>
                        <td className="px-2 py-3 border border-gray-300">{suma(reportesFiltrados, 'cantAdolescentes')}</td>
                        <td className="px-2 py-3 border border-gray-300 bg-yellow-500">{totalAsistencia}</td>
                        {/* Niños / Convertidos */}
                        <td className="px-2 py-3 border border-gray-300">{suma(reportesFiltrados, 'cantConvertidos')}</td>
                        <td className="px-2 py-3 border border-gray-300">{suma(reportesFiltrados, 'cantNinosCristianos')}</td>
                        <td className="px-2 py-3 border border-gray-300">{suma(reportesFiltrados, 'cantNinosAmigos')}</td>
                        <td className="px-2 py-3 border border-gray-300 bg-yellow-500">{suma(reportesFiltrados, 'cantNinosCristianos') + suma(reportesFiltrados, 'cantNinosAmigos')}</td>
                        {/* Visitas */}
                        <td className="px-2 py-3 border border-gray-300">{suma(reportesFiltrados, 'cantVisitaConsolidacion')}</td>
                        <td className="px-2 py-3 border border-gray-300">{suma(reportesFiltrados, 'cantVisitaCasaDePaz')}</td>
                        <td className="px-2 py-3 border border-gray-300">{suma(reportesFiltrados, 'cantVisitaHogar')}</td>
                        {/* Act. espirituales */}
                        <td className="px-2 py-3 border border-gray-300">{suma(reportesFiltrados, 'cultoHoracion')}</td>
                        <td className="px-2 py-3 border border-gray-300">{suma(reportesFiltrados, 'cantHrMep')}</td>
                        <td className="px-2 py-3 border border-gray-300">{suma(reportesFiltrados, 'cantHrDiscipulado')}</td>
                        <td className="px-2 py-3 border border-gray-300">{suma(reportesFiltrados, 'cantRetiroEspiritual')}</td>
                        <td className="px-2 py-3 border border-gray-300">{suma(reportesFiltrados, 'cantCultoCentral')}</td>
                        {/* Ofrendas */}
                        <td className="px-2 py-3 border border-gray-300">{reportesFiltrados.reduce((a, r) => a + Number(r.ofrendaSabado || 0), 0).toFixed(2)}</td>
                        <td className="px-2 py-3 border border-gray-300">{reportesFiltrados.reduce((a, r) => a + Number(r.ofrendaNinos || 0), 0).toFixed(2)}</td>
                        <td className="px-2 py-3 border border-gray-300">{reportesFiltrados.reduce((a, r) => a + Number(r.ofrendaMiercoles || 0), 0).toFixed(2)}</td>
                        <td className="px-2 py-3 border border-gray-300 bg-yellow-500">{reportesFiltrados.reduce((a, r) => a + Number(r.ofrendaSabado || 0) + Number(r.ofrendaNinos || 0) + Number(r.ofrendaMiercoles || 0), 0).toFixed(2)}</td>
                        {/* OBS */}
                        <td className="px-2 py-3 border border-gray-300"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center text-gray-400">
                <FileText className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                <p>No hay reportes para el filtro seleccionado.</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'alertas' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-wrap gap-3 items-end">
              <div><label className="block text-xs font-semibold text-gray-500 mb-1">Semana Desde</label><input type="date" value={alertasDesde} onChange={e => setAlertasDesde(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-400 outline-none" /></div>
              <div><label className="block text-xs font-semibold text-gray-500 mb-1">Semana Hasta</label><input type="date" value={alertasHasta} onChange={e => setAlertasHasta(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-400 outline-none" /></div>
              <button onClick={async () => { const id = user?.sectorId; if (!id) return; setAlertasLoading(true); try { const r = await api.get(`/reportes/alertas/sector/${id}`, { params: { desde: alertasDesde, hasta: alertasHasta } }); setAlertas(Array.isArray(r.data?.data) ? r.data.data : []); } catch { Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo cargar.' }); } finally { setAlertasLoading(false); } }} disabled={alertasLoading} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50"><Search className="w-4 h-4" /> Verificar</button>
            </div>
            {alertasLoading ? <div className="py-10 text-center"><Loader2 className="w-7 h-7 animate-spin mx-auto text-red-500" /></div> : alertas.length === 0 ? (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center"><CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-500" /><p className="font-semibold text-green-700">¡Todos los grupos han enviado su reporte!</p></div>
            ) : (
              <div className="bg-white rounded-2xl border border-red-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-red-100 bg-red-50/50 flex items-center justify-between"><h3 className="font-bold text-red-700 flex items-center gap-2"><Bell className="w-4 h-4" /> {alertas.length} grupo(s) sin reporte</h3></div>
                <div className="divide-y divide-gray-50">
                  {alertas.map(a => (
                    <div key={a.grupoId} className="flex items-center justify-between px-5 py-3 hover:bg-red-50/30">
                      <div><p className="font-medium text-gray-900">{a.grupoNombre}</p><p className="text-xs text-gray-500">{a.liderNombre}</p></div>
                      <button onClick={() => { setRegGrupoId(a.grupoId); setShowRegForm(true); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700"><PlusCircle className="w-3.5 h-3.5" /> Registrar Reporte</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {showRegForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800">Registrar Reporte en Nombre del Líder</h3>
                    <button onClick={() => setShowRegForm(false)} className="text-gray-400 hover:text-gray-600"><XCircle className="w-6 h-6" /></button>
                  </div>
                  <form className="p-6" onSubmit={async e => { e.preventDefault(); try { await api.post('/reportes', { ...regForm, grupoFamiliarId: Number(regGrupoId) }); Swal.fire({ icon: 'success', title: 'Reporte registrado', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false }); setShowRegForm(false); } catch (err) { Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.mensaje || 'No se pudo guardar.' }) } }}>
                    <div className="grid grid-cols-2 gap-4">
                      {[['semanaDesde', 'Semana Desde', 'date'], ['semanaHasta', 'Semana Hasta', 'date']].map(([k, l, t]) => (<div key={k}><label className="block text-xs font-semibold text-gray-600 mb-1">{l}</label><input type={t} value={regForm[k]} onChange={e => setRegForm(p => ({ ...p, [k]: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-400 outline-none" /></div>))}
                      {[['cantHermanos', 'Hermanos'], ['cantAmigos', 'Amigos'], ['cantAdolescentes', 'Adolescentes'], ['cantConvertidos', 'Convertidos'], ['cantNinosCristianos', 'Niños Crist.'], ['cantNinosAmigos', 'Niños Amigos'], ['cantVisitaConsolidacion', 'Vis.Consol.'], ['cantVisitaCasaDePaz', 'Vis.Casa Paz'], ['cantVisitaHogar', 'Vis.Hogar'], ['cantHrOracion', 'Hr Oración'], ['cantHrMep', 'Hr MEP'], ['cantHrDiscipulado', 'Hr Discip.'], ['cantRetiroEspiritual', 'Retiro'], ['ofrendaSabado', 'Ofrenda Sáb.'], ['ofrendaNinos', 'Ofrenda Niños'], ['ofrendaMiercoles', 'Ofrenda Miérc.']].map(([k, l]) => (<div key={k}><label className="block text-xs font-semibold text-gray-600 mb-1">{l}</label><input type="number" min="0" step="0.01" value={regForm[k]} onChange={e => setRegForm(p => ({ ...p, [k]: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-400 outline-none" /></div>))}
                      <div className="col-span-2"><label className="block text-xs font-semibold text-gray-600 mb-1">Observaciones</label><textarea value={regForm.observaciones} onChange={e => setRegForm(p => ({ ...p, observaciones: e.target.value }))} rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-400 outline-none" /></div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                      <button type="button" onClick={() => setShowRegForm(false)} className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50">Cancelar</button>
                      <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700">Guardar Reporte</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default DashboardSupervisorSectorial;
