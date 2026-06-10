import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import api from '../../utils/axios';
import Swal from 'sweetalert2';
import { 
  ArrowLeft, FileDown, Calendar, Users, 
  Shield, Home, Heart, CheckCircle, XCircle, Send, Loader2 
} from 'lucide-react';
import { exportReporteSectorialPDF } from '../../utils/exportadores';

const estadoConfig = {
  ENVIADO: { color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Enviado' },
  APROBADO: { color: 'bg-green-100 text-green-700 border-green-200', label: 'Aprobado' },
  BORRADOR: { color: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Borrador' },
};

const fmtBool = (v) => v ? <span className="text-green-600 font-bold">✓ Sí</span> : <span className="text-red-500 font-bold">✗ No</span>;

const ReporteSectorialDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [reporte, setReporte] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);

  const isAdminOrGeneral = user?.rol === 'ADMIN' || user?.rol === 'SUP_GENERAL';

  const fetchReporte = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/reportes-sectoriales/${id}`);
      setReporte(res.data?.data);
    } catch (e) {
      console.error(e);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo cargar el reporte detallado.'
      });
      navigate('/supervisor/reporte-sectorial');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReporte();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleEnviar = async () => {
    const confirm = await Swal.fire({
      title: '¿Enviar reporte al Supervisor General?',
      text: 'Una vez enviado, no podrás editarlo.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, enviar'
    });
    if (!confirm.isConfirmed) return;

    setLoadingAction(true);
    try {
      await api.patch(`/reportes-sectoriales/${id}/enviar`);
      Swal.fire({
        icon: 'success',
        title: 'Reporte Enviado',
        timer: 1500,
        showConfirmButton: false
      });
      fetchReporte();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.mensaje || 'No se pudo enviar.'
      });
    } finally {
      setLoadingAction(false);
    }
  };

  const handleAprobar = async () => {
    const confirm = await Swal.fire({
      title: '¿Aprobar Reporte Sectorial?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#059669',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, aprobar'
    });
    if (!confirm.isConfirmed) return;

    setLoadingAction(true);
    try {
      await api.patch(`/reportes-sectoriales/${id}/aprobar`);
      Swal.fire({
        icon: 'success',
        title: 'Aprobado',
        timer: 1500,
        showConfirmButton: false
      });
      fetchReporte();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.mensaje || 'No se pudo aprobar.'
      });
    } finally {
      setLoadingAction(false);
    }
  };

  const handleRechazar = async () => {
    const confirm = await Swal.fire({
      title: '¿Rechazar y devolver a borrador?',
      text: 'Se devolverá a estado borrador para correcciones.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, rechazar'
    });
    if (!confirm.isConfirmed) return;

    setLoadingAction(true);
    try {
      await api.patch(`/reportes-sectoriales/${id}/rechazar`);
      Swal.fire({
        icon: 'info',
        title: 'Rechazado',
        timer: 1500,
        showConfirmButton: false
      });
      fetchReporte();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.mensaje || 'No se pudo rechazar.'
      });
    } finally {
      setLoadingAction(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <span className="text-gray-500 text-sm ml-3">Cargando detalles...</span>
      </div>
    );
  }

  if (!reporte) return null;

  const atenciones = reporte.atencionesJson ? JSON.parse(reporte.atencionesJson) : [];
  const supervisiones = reporte.supervisionesJson ? JSON.parse(reporte.supervisionesJson) : [];
  const evaluaciones = reporte.evaluacionesEquipoJson ? JSON.parse(reporte.evaluacionesEquipoJson) : [];
  const cfg = estadoConfig[reporte.estado] || estadoConfig.BORRADOR;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/supervisor/reporte-sectorial')}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2.5">
              Reporte Semanal Sectorial
              <span className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full border border-current ${cfg.color}`}>
                {cfg.label}
              </span>
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Sector: {reporte.sectorNombre} · Supervisor: {reporte.supervisorNombre}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => exportReporteSectorialPDF(reporte)}
            className="flex items-center gap-1.5 bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-700 shadow-md transition-all"
          >
            <FileDown className="w-4 h-4" /> Descargar PDF
          </button>

          {!isAdminOrGeneral && reporte.estado === 'BORRADOR' && (
            <button
              onClick={handleEnviar}
              disabled={loadingAction}
              className="flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-md transition-all disabled:opacity-50"
            >
              {loadingAction ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Enviar Reporte
            </button>
          )}

          {isAdminOrGeneral && reporte.estado === 'ENVIADO' && (
            <>
              <button
                onClick={handleAprobar}
                disabled={loadingAction}
                className="flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-700 shadow-md transition-all disabled:opacity-50"
              >
                {loadingAction ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Aprobar
              </button>
              <button
                onClick={handleRechazar}
                disabled={loadingAction}
                className="flex items-center gap-1.5 bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-700 shadow-md transition-all disabled:opacity-50"
              >
                {loadingAction ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} Rechazar
              </button>
            </>
          )}
        </div>
      </div>

      {/* Período */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
          <Calendar className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xs font-bold text-gray-400 uppercase">Período de la Semana</h2>
          <p className="text-base font-semibold text-gray-700 mt-0.5">
            {reporte.semanaDesde} <span className="text-gray-300 mx-2">→</span> {reporte.semanaHasta}
          </p>
        </div>
      </div>

      {/* Vida Devocional */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-indigo-50/40 px-6 py-4 border-b flex items-center gap-2">
          <Shield className="w-4 h-4 text-indigo-600" />
          <h2 className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Vida Devocional</h2>
        </div>
        <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-400 block">Oración diaria</span>
            <span className="text-sm font-semibold text-gray-800">{reporte.horasOracion} Hr {reporte.minutosOracion} Mn</span>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-400 block">Lectura Bíblica</span>
            <span className="text-sm">{fmtBool(reporte.lecturaBiblia)}</span>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-400 block">Ayuno semanal</span>
            <span className="text-sm">{fmtBool(reporte.ayuno)}</span>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-400 block">Culto de Liderazgo</span>
            <span className="text-sm">{fmtBool(reporte.cultoLiderazgo)}</span>
          </div>
          <div className="space-y-1 col-span-2">
            <span className="text-xs font-semibold text-gray-400 block">Diezmo mensual</span>
            <span className="text-sm">{fmtBool(reporte.diezmo)}</span>
          </div>
        </div>
      </div>

      {/* Atención Personalizada */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-indigo-50/40 px-6 py-4 border-b flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-600" />
          <h2 className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Atención Personalizada</h2>
        </div>
        <div className="p-6">
          {atenciones.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">No se registraron atenciones personales en esta semana.</p>
          ) : (
            <div className="space-y-6">
              {atenciones.map((a, idx) => (
                <div key={idx} className="pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                  <h3 className="text-xs font-bold text-indigo-600 uppercase mb-2">Registro #{idx + 1}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-2">
                    <div><span className="font-semibold text-gray-500">Líder/Miembro:</span> <span className="text-gray-800 font-medium">{a.lider}</span></div>
                    <div><span className="font-semibold text-gray-500">Lugar:</span> <span className="text-gray-800 font-medium">{a.lugar}</span></div>
                    <div><span className="font-semibold text-gray-500">Fecha/Hora:</span> <span className="text-gray-800 font-medium">{a.fecha} {a.hora ? `· ${a.hora}` : ''}</span></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-gray-50 p-3 rounded-xl">
                    <div><span className="font-semibold text-gray-500 block mb-1">Motivo:</span> <p className="text-gray-700">{a.motivo || '—'}</p></div>
                    <div><span className="font-semibold text-gray-500 block mb-1">Resultado:</span> <p className="text-gray-700">{a.resultado || '—'}</p></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Supervisión de Reunión de Planificación */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-indigo-50/40 px-6 py-4 border-b flex items-center gap-2">
          <Home className="w-4 h-4 text-indigo-600" />
          <h2 className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Supervisando la Reunión de Planificación</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div><span className="font-semibold text-gray-500">Grupo Visitado:</span> <span className="text-gray-800 font-bold">{reporte.planificacionGrupo || '—'}</span></div>
            <div><span className="font-semibold text-gray-500">Fecha:</span> <span className="text-gray-800 font-medium">{reporte.planificacionFecha || '—'}</span></div>
            <div><span className="font-semibold text-gray-500">Hora de Llegada:</span> <span className="text-gray-800 font-medium">{reporte.planificacionHora || '—'}</span></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-xl">
            <div><span className="font-semibold text-gray-500 block mb-1">Aspectos Positivos:</span> <p className="text-gray-700 whitespace-pre-wrap">{reporte.planificacionPositivos || '—'}</p></div>
            <div><span className="font-semibold text-gray-500 block mb-1">Aspectos Débiles:</span> <p className="text-gray-700 whitespace-pre-wrap">{reporte.planificacionNegativos || '—'}</p></div>
          </div>
        </div>
      </div>

      {/* Supervisión de Reuniones Evangelísticas */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-indigo-50/40 px-6 py-4 border-b flex items-center gap-2">
          <Heart className="w-4 h-4 text-indigo-600" />
          <h2 className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Supervisando la Reunión Evangelística</h2>
        </div>
        <div className="p-6">
          {supervisiones.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">No se registraron supervisiones de reunión evangelística.</p>
          ) : (
            <div className="space-y-6">
              {supervisiones.map((s, idx) => (
                <div key={idx} className="pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                  <h3 className="text-xs font-bold text-indigo-600 uppercase mb-2">Registro #{idx + 1}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-2">
                    <div><span className="font-semibold text-gray-500">Grupo Visitado:</span> <span className="text-gray-800 font-bold">{s.grupoNombre}</span></div>
                    <div><span className="font-semibold text-gray-500">Fecha:</span> <span className="text-gray-800 font-medium">{s.fecha || '—'}</span></div>
                    <div><span className="font-semibold text-gray-500">Hora de Llegada:</span> <span className="text-gray-800 font-medium">{s.hora || '—'}</span></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-gray-50 p-3 rounded-xl">
                    <div><span className="font-semibold text-gray-500 block mb-1">Aspectos Positivos:</span> <p className="text-gray-700 whitespace-pre-wrap">{s.positivos || '—'}</p></div>
                    <div><span className="font-semibold text-gray-500 block mb-1">Aspectos Débiles:</span> <p className="text-gray-700 whitespace-pre-wrap">{s.negativos || '—'}</p></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Evaluación de Trabajo en Equipo */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-indigo-50/40 px-6 py-4 border-b flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-600" />
          <h2 className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Evaluación de Trabajo en Equipo</h2>
        </div>
        <div className="p-6 divide-y divide-gray-100">
          {evaluaciones.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">No hay evaluaciones registradas en este reporte.</p>
          ) : (
            evaluaciones.map((e, idx) => (
              <div key={e.grupoId} className={`py-4 ${idx === 0 ? 'pt-0' : ''} last:pb-0`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-gray-800 text-sm">{e.grupoNombre}</span>
                </div>
                <p className="text-gray-700 text-sm whitespace-pre-wrap bg-gray-50/50 p-3 rounded-xl border border-gray-100">{e.evaluacion || 'Sin comentarios registrados.'}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Firma */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
        <h2 className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Firma Digitalizada del Supervisor</h2>
        {reporte.firma ? (
          <div className="border border-indigo-50 bg-indigo-50/10 rounded-2xl p-4 flex items-center justify-center max-w-md">
            <img src={reporte.firma} alt="Firma digitalizada" className="max-h-[140px] w-auto object-contain" />
          </div>
        ) : (
          <p className="text-gray-400 text-sm italic">Firma no disponible en este reporte.</p>
        )}
      </div>
    </div>
  );
};

export default ReporteSectorialDetail;
