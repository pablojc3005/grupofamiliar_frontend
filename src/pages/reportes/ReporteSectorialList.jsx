import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import api from '../../utils/axios';
import Swal from 'sweetalert2';
import { 
  FileText, Plus, RefreshCw, Loader2, Calendar, 
  Trash2, Edit, Eye, Send, CheckCircle, XCircle, FileDown 
} from 'lucide-react';
import { exportReporteSectorialPDF } from '../../utils/exportadores';

const estadoConfig = {
  ENVIADO: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: <Send className="w-3.5 h-3.5" />, label: 'Enviado' },
  APROBADO: { color: 'bg-green-100 text-green-700 border-green-200', icon: <CheckCircle className="w-3.5 h-3.5" />, label: 'Aprobado' },
  BORRADOR: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: <FileText className="w-3.5 h-3.5" />, label: 'Borrador' },
};

const ReporteSectorialList = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState(null);

  const isAdminOrGeneral = user?.rol === 'ADMIN' || user?.rol === 'SUP_GENERAL';

  const fetchReportes = async () => {
    setLoading(true);
    try {
      let url = '/reportes-sectoriales';
      if (!isAdminOrGeneral) {
        url = `/reportes-sectoriales/supervisor/${user.id}`;
      }
      const res = await api.get(url);
      setReportes(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (e) {
      console.error(e);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los reportes sectoriales.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEnviar = async (id) => {
    const confirm = await Swal.fire({
      title: '¿Enviar reporte al Supervisor General?',
      text: 'Una vez enviado, no podrás editarlo a menos que sea rechazado.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, enviar'
    });
    if (!confirm.isConfirmed) return;

    setLoadingAction(id);
    try {
      await api.patch(`/reportes-sectoriales/${id}/enviar`);
      Swal.fire({
        icon: 'success',
        title: 'Reporte Enviado',
        text: 'El reporte ha sido enviado correctamente al Supervisor General.',
        timer: 2000,
        showConfirmButton: false
      });
      fetchReportes();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.mensaje || 'No se pudo enviar el reporte.'
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleEliminar = async (id) => {
    const confirm = await Swal.fire({
      title: '¿Eliminar borrador?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar'
    });
    if (!confirm.isConfirmed) return;

    setLoadingAction(id);
    try {
      await api.delete(`/reportes-sectoriales/${id}`);
      Swal.fire({
        icon: 'success',
        title: 'Eliminado',
        text: 'El borrador ha sido eliminado.',
        timer: 1500,
        showConfirmButton: false
      });
      fetchReportes();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.mensaje || 'No se pudo eliminar el reporte.'
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleAprobar = async (id) => {
    const confirm = await Swal.fire({
      title: '¿Aprobar Reporte Sectorial?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#059669',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, aprobar'
    });
    if (!confirm.isConfirmed) return;

    setLoadingAction(id);
    try {
      await api.patch(`/reportes-sectoriales/${id}/aprobar`);
      Swal.fire({
        icon: 'success',
        title: 'Aprobado',
        text: 'Reporte aprobado correctamente.',
        timer: 1500,
        showConfirmButton: false
      });
      fetchReportes();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.mensaje || 'No se pudo aprobar.'
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRechazar = async (id) => {
    const confirm = await Swal.fire({
      title: '¿Rechazar Reporte Sectorial?',
      text: 'Se devolverá a estado borrador para que el supervisor lo corrija.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, rechazar'
    });
    if (!confirm.isConfirmed) return;

    setLoadingAction(id);
    try {
      await api.patch(`/reportes-sectoriales/${id}/rechazar`);
      Swal.fire({
        icon: 'info',
        title: 'Rechazado',
        text: 'El reporte ha sido devuelto a borrador.',
        timer: 1500,
        showConfirmButton: false
      });
      fetchReportes();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.mensaje || 'No se pudo rechazar.'
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDownloadPDF = async (reporte) => {
    try {
      exportReporteSectorialPDF(reporte);
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ocurrió un error al generar el PDF.'
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" /> Reportes Sectoriales
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {isAdminOrGeneral 
              ? 'Historial consolidado de reportes de supervisores sectoriales.' 
              : `Historial de reportes sectoriales semanales para el sector: ${user?.sectorNombre || ''}`
            }
          </p>
        </div>
        <div className="flex gap-2.5">
          <button 
            onClick={fetchReportes} 
            disabled={loading}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-all shadow-sm text-sm font-medium disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          {!isAdminOrGeneral && (
            <button 
              onClick={() => navigate('/supervisor/reporte-sectorial/nuevo')}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-md text-sm font-semibold"
            >
              <Plus className="w-4 h-4" />
              Nuevo Reporte
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
            <p className="text-sm text-gray-400 mt-3">Cargando historial de reportes...</p>
          </div>
        ) : reportes.length === 0 ? (
          <div className="p-16 text-center text-gray-400 space-y-3">
            <div className="bg-indigo-50 w-14 h-14 rounded-full flex items-center justify-center mx-auto">
              <FileText className="w-7 h-7 text-indigo-400" />
            </div>
            <p className="font-semibold text-gray-700">No hay reportes sectoriales</p>
            <p className="text-sm max-w-sm mx-auto">
              {isAdminOrGeneral 
                ? 'Ningún supervisor ha creado o enviado reportes todavía.'
                : 'Aún no has registrado ningún reporte semanal. Haz clic en "Nuevo Reporte" para empezar.'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                <tr>
                  {isAdminOrGeneral && <th className="px-6 py-4 font-semibold">Sector / Supervisor</th>}
                  <th className="px-6 py-4 font-semibold">Semana</th>
                  <th className="px-6 py-4 font-semibold text-center">Devocional (Oración)</th>
                  <th className="px-6 py-4 font-semibold">Estado</th>
                  <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {reportes.map((r) => {
                  const cfg = estadoConfig[r.estado] || estadoConfig.BORRADOR;
                  const isActing = loadingAction === r.id;
                  return (
                    <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                      {isAdminOrGeneral && (
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          {r.sectorNombre}
                          <br />
                          <span className="text-xs font-normal text-gray-500">{r.supervisorNombre}</span>
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-indigo-500" />
                          <span className="font-medium text-gray-700">{r.semanaDesde}</span>
                          <span className="text-gray-300">→</span>
                          <span className="text-gray-500">{r.semanaHasta}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600 font-medium">
                        {r.horasOracion} Hr {r.minutosOracion} Mn
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}>
                          {cfg.icon} {cfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-2.5">
                          {/* Descargar PDF (disponible si enviado o aprobado) */}
                          {r.estado !== 'BORRADOR' && (
                            <button
                              onClick={() => handleDownloadPDF(r)}
                              title="Descargar PDF"
                              className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                            >
                              <FileDown className="w-4 h-4" />
                            </button>
                          )}

                          {/* Ver detalles */}
                          <button
                            onClick={() => navigate(`/supervisor/reporte-sectorial/ver/${r.id}`)}
                            title="Ver detalles"
                            className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Acciones para Supervisor Sectorial */}
                          {!isAdminOrGeneral && r.estado === 'BORRADOR' && (
                            <>
                              <button
                                onClick={() => navigate(`/supervisor/reporte-sectorial/editar/${r.id}`)}
                                title="Editar borrador"
                                disabled={isActing}
                                className="p-1.5 rounded-lg text-gray-500 hover:text-amber-600 hover:bg-amber-50 transition-all"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEnviar(r.id)}
                                title="Enviar reporte"
                                disabled={isActing}
                                className="p-1.5 rounded-lg text-indigo-600 hover:text-white hover:bg-indigo-600 transition-all"
                              >
                                {isActing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => handleEliminar(r.id)}
                                title="Eliminar borrador"
                                disabled={isActing}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {/* Acciones de aprobación para Admin o Supervisor General */}
                          {isAdminOrGeneral && r.estado === 'ENVIADO' && (
                            <>
                              <button
                                onClick={() => handleAprobar(r.id)}
                                title="Aprobar reporte"
                                disabled={isActing}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm transition-all"
                              >
                                <CheckCircle className="w-3.5 h-3.5" /> Aprobar
                              </button>
                              <button
                                onClick={() => handleRechazar(r.id)}
                                title="Rechazar y devolver a borrador"
                                disabled={isActing}
                                className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm transition-all"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Rechazar
                              </button>
                            </>
                          )}
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

export default ReporteSectorialList;
