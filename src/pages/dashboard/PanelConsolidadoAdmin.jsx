import { useState, useEffect } from 'react';
import api from '../../utils/axios';
import Swal from 'sweetalert2';
import { Loader2, Search, Calendar, Download, FileText, Layers, Eye, X } from 'lucide-react';
import { exportConsolidadoExcel, exportConsolidadoPDF } from '../../utils/exportadores';

const suma = (arr, field) => arr.reduce((acc, r) => acc + (Number(r[field]) || 0), 0);
const today = new Date().toISOString().split('T')[0];

// Formatea oración como "X Hr Y Mn"
const fmtOracion = (hrs, min) => {
  const h = Number(hrs) || 0;
  const m = Number(min) || 0;
  if (h === 0 && m === 0) return '—';
  return `${h} Hr ${m} Mn`;
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

const PanelConsolidadoAdmin = () => {
  const [sectores, setSectores] = useState([]);
  const [sectorId, setSectorId] = useState('');
  const [semanaDesde, setSemanaDesde] = useState(today);
  const [semanaHasta, setSemanaHasta] = useState(today);
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [buscado, setBuscado] = useState(false);
  const [modalReporte, setModalReporte] = useState(null);

  useEffect(() => {
    api.get('/sectores').then(r => setSectores(Array.isArray(r.data?.data) ? r.data.data : [])).catch(() => {});
  }, []);

  const buscar = async () => {
    setLoading(true);
    setBuscado(true);
    try {
      let data = [];
      if (sectorId) {
        const res = await api.get(`/reportes/sector/${sectorId}`);
        data = Array.isArray(res.data?.data) ? res.data.data : [];
      } else {
        const promises = sectores.map(s => api.get(`/reportes/sector/${s.id}`).catch(() => ({ data: { data: [] } })));
        const results = await Promise.all(promises);
        results.forEach(r => { data = data.concat(Array.isArray(r.data?.data) ? r.data.data : []); });
      }
      // Filtrar por fechas
      data = data.filter(r => {
        const d = r.semanaDesde;
        if (!d) return true;
        if (semanaDesde && d < semanaDesde) return false;
        if (semanaHasta && d > semanaHasta) return false;
        return true;
      });
      setReportes(data);
      if (data.length === 0) {
        Swal.fire({ icon: 'info', title: 'Sin reportes', text: 'No hay reportes para el filtro seleccionado.', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });
      }
    } catch (e) {
      console.error(e);
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron cargar los reportes.' });
    } finally { setLoading(false); }
  };

  const totalAsistencia = suma(reportes, 'cantHermanos') + suma(reportes, 'cantAmigos') + suma(reportes, 'cantAdolescentes');
  const sectorLabel = sectorId ? sectores.find(s => String(s.id) === String(sectorId))?.nombre || '' : 'Todos los Sectores';
  const nombreArchivo = `Consolidado_Admin_${sectorLabel}_${semanaDesde}`;

  // Helpers para booleanos en tabla
  const fmtBool = (v) => v ? <span className="text-green-600 font-bold">✓</span> : <span className="text-gray-300">✗</span>;

  return (
    <>
      {/* Modal observaciones */}
      <ObservacionModal reporte={modalReporte} onClose={() => setModalReporte(null)} />

      <div className="space-y-5">
        {/* Filtros */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-500" /> Filtros Consolidado por Sector
          </h2>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Sector</label>
              <select value={sectorId} onChange={e => setSectorId(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-400 outline-none min-w-[180px]">
                <option value="">Todos los Sectores</option>
                {sectores.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
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
            <button onClick={buscar} disabled={loading}
              className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
              <Search className="w-4 h-4" /> Buscar
            </button>
          </div>
        </div>

        {/* Tabla consolidada */}
        {loading ? (
          <div className="py-10 text-center"><Loader2 className="w-7 h-7 animate-spin mx-auto text-indigo-500" /></div>
        ) : buscado && reportes.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/50">
              <div>
                <h2 className="text-base font-bold text-gray-800">Consolidado: {sectorLabel}</h2>
                <p className="text-xs text-gray-400 mt-0.5">Período: {semanaDesde} → {semanaHasta}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => exportConsolidadoExcel(reportes, `Consolidado ${sectorLabel}`, nombreArchivo)}
                  className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5" /> Excel
                </button>
                <button onClick={() => exportConsolidadoPDF(reportes, `Consolidado ${sectorLabel}`, nombreArchivo)}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5" /> PDF
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-center border-collapse min-w-[1600px]">
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
                    {['HERMANOS','AMIGOS','ADOLESC.','TOTAL'].map(h => (
                      <th key={h} className={`px-2 py-1.5 border border-indigo-400 ${h==='TOTAL'?'bg-indigo-700':''}`}>{h}</th>
                    ))}
                    {/* Niños / Convertidos */}
                    {['CONVERT.','NIÑOS CRIST.','NIÑOS AMIGOS','TOTAL'].map(h => (
                      <th key={h} className={`px-2 py-1.5 border border-indigo-400 ${h==='TOTAL'?'bg-indigo-700':''}`}>{h}</th>
                    ))}
                    {/* Visitas */}
                    {['CONSOL.','CASA PAZ','HOGAR'].map(h => (
                      <th key={h} className="px-2 py-1.5 border border-indigo-400">{h}</th>
                    ))}
                    {/* Act. espirituales */}
                    {['CULTO ORAC.','MEP','DISCIP.','RETIRO','CULTO CENT.'].map(h => (
                      <th key={h} className="px-2 py-1.5 border border-indigo-400">{h}</th>
                    ))}
                    {/* Ofrendas */}
                    {['SÁBADO','NIÑOS','MIÉRC.','TOTAL'].map(h => (
                      <th key={h} className={`px-2 py-1.5 border border-indigo-400 ${h==='TOTAL'?'bg-indigo-700':''}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportes.map((r, i) => {
                    const tA = (r.cantHermanos||0)+(r.cantAmigos||0)+(r.cantAdolescentes||0);
                    const tN = (r.cantNinosCristianos||0)+(r.cantNinosAmigos||0);
                    const tO = Number(r.ofrendaSabado||0)+Number(r.ofrendaNinos||0)+Number(r.ofrendaMiercoles||0);
                    const tieneObs = r.observaciones && r.observaciones.trim().length > 0;
                    return (
                      <tr key={r.id} className="hover:bg-indigo-50/30 border-b border-gray-100">
                        <td className="px-2 py-2 border border-gray-200 font-semibold text-gray-700">{i+1}</td>
                        <td className="px-3 py-2 border border-gray-200 text-left">
                          <span className="font-medium text-gray-900">{r.grupoFamiliarNombre || `Líder #${r.liderId}`}</span>
                          <br/><span className="text-[10px] text-gray-500">{r.liderNombre}</span>
                        </td>
                        {/* Info general */}
                        <td className="px-2 py-2 border border-violet-100 bg-violet-50/40">{fmtBool(r.diezmo)}</td>
                        <td className="px-2 py-2 border border-violet-100 bg-violet-50/40">{fmtBool(r.lecturaBiblia)}</td>
                        <td className="px-2 py-2 border border-violet-100 bg-violet-50/40 whitespace-nowrap font-medium text-indigo-700">{fmtOracion(r.horasOracion, r.minutosOracion)}</td>
                        <td className="px-2 py-2 border border-violet-100 bg-violet-50/40">{fmtBool(r.visito)}</td>
                        <td className="px-2 py-2 border border-violet-100 bg-violet-50/40">{fmtBool(r.ayuno)}</td>
                        {/* Asistencia */}
                        <td className="px-2 py-2 border border-gray-200">{r.cantHermanos||0}</td>
                        <td className="px-2 py-2 border border-gray-200">{r.cantAmigos||0}</td>
                        <td className="px-2 py-2 border border-gray-200">{r.cantAdolescentes||0}</td>
                        <td className="px-2 py-2 border border-gray-200 font-bold bg-indigo-50 text-indigo-700">{tA}</td>
                        {/* Niños / Convertidos */}
                        <td className="px-2 py-2 border border-gray-200">{r.cantConvertidos||0}</td>
                        <td className="px-2 py-2 border border-gray-200">{r.cantNinosCristianos||0}</td>
                        <td className="px-2 py-2 border border-gray-200">{r.cantNinosAmigos||0}</td>
                        <td className="px-2 py-2 border border-gray-200 font-bold bg-indigo-50 text-indigo-700">{tN}</td>
                        {/* Visitas */}
                        <td className="px-2 py-2 border border-gray-200">{r.cantVisitaConsolidacion||0}</td>
                        <td className="px-2 py-2 border border-gray-200">{r.cantVisitaCasaDePaz||0}</td>
                        <td className="px-2 py-2 border border-gray-200">{r.cantVisitaHogar||0}</td>
                        {/* Act. espirituales */}
                        <td className="px-2 py-2 border border-gray-200">{r.cultoHoracion||0}</td>
                        <td className="px-2 py-2 border border-gray-200">{r.cantHrMep||0}</td>
                        <td className="px-2 py-2 border border-gray-200">{r.cantHrDiscipulado||0}</td>
                        <td className="px-2 py-2 border border-gray-200">{r.cantRetiroEspiritual||0}</td>
                        <td className="px-2 py-2 border border-gray-200">{r.cantCultoCentral||0}</td>
                        {/* Ofrendas */}
                        <td className="px-2 py-2 border border-gray-200">{Number(r.ofrendaSabado||0).toFixed(0)}</td>
                        <td className="px-2 py-2 border border-gray-200">{Number(r.ofrendaNinos||0).toFixed(0)}</td>
                        <td className="px-2 py-2 border border-gray-200">{Number(r.ofrendaMiercoles||0).toFixed(0)}</td>
                        <td className="px-2 py-2 border border-gray-200 font-bold bg-indigo-50 text-indigo-700">{tO.toFixed(0)}</td>
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
                    {/* Info general — no sumable, dejar vacío */}
                    <td className="px-2 py-3 border border-gray-300 bg-yellow-300" colSpan={5}></td>
                    {/* Asistencia */}
                    <td className="px-2 py-3 border border-gray-300">{suma(reportes,'cantHermanos')}</td>
                    <td className="px-2 py-3 border border-gray-300">{suma(reportes,'cantAmigos')}</td>
                    <td className="px-2 py-3 border border-gray-300">{suma(reportes,'cantAdolescentes')}</td>
                    <td className="px-2 py-3 border border-gray-300 bg-yellow-500">{totalAsistencia}</td>
                    {/* Niños / Convertidos */}
                    <td className="px-2 py-3 border border-gray-300">{suma(reportes,'cantConvertidos')}</td>
                    <td className="px-2 py-3 border border-gray-300">{suma(reportes,'cantNinosCristianos')}</td>
                    <td className="px-2 py-3 border border-gray-300">{suma(reportes,'cantNinosAmigos')}</td>
                    <td className="px-2 py-3 border border-gray-300 bg-yellow-500">{suma(reportes,'cantNinosCristianos')+suma(reportes,'cantNinosAmigos')}</td>
                    {/* Visitas */}
                    <td className="px-2 py-3 border border-gray-300">{suma(reportes,'cantVisitaConsolidacion')}</td>
                    <td className="px-2 py-3 border border-gray-300">{suma(reportes,'cantVisitaCasaDePaz')}</td>
                    <td className="px-2 py-3 border border-gray-300">{suma(reportes,'cantVisitaHogar')}</td>
                    {/* Act. espirituales */}
                    <td className="px-2 py-3 border border-gray-300">{suma(reportes,'cultoHoracion')}</td>
                    <td className="px-2 py-3 border border-gray-300">{suma(reportes,'cantHrMep')}</td>
                    <td className="px-2 py-3 border border-gray-300">{suma(reportes,'cantHrDiscipulado')}</td>
                    <td className="px-2 py-3 border border-gray-300">{suma(reportes,'cantRetiroEspiritual')}</td>
                    <td className="px-2 py-3 border border-gray-300">{suma(reportes,'cantCultoCentral')}</td>
                    {/* Ofrendas */}
                    <td className="px-2 py-3 border border-gray-300">{reportes.reduce((a,r)=>a+Number(r.ofrendaSabado||0),0).toFixed(0)}</td>
                    <td className="px-2 py-3 border border-gray-300">{reportes.reduce((a,r)=>a+Number(r.ofrendaNinos||0),0).toFixed(0)}</td>
                    <td className="px-2 py-3 border border-gray-300">{reportes.reduce((a,r)=>a+Number(r.ofrendaMiercoles||0),0).toFixed(0)}</td>
                    <td className="px-2 py-3 border border-gray-300 bg-yellow-500">{reportes.reduce((a,r)=>a+Number(r.ofrendaSabado||0)+Number(r.ofrendaNinos||0)+Number(r.ofrendaMiercoles||0),0).toFixed(0)}</td>
                    {/* OBS */}
                    <td className="px-2 py-3 border border-gray-300"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ) : buscado ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
            <FileText className="w-10 h-10 mx-auto mb-2 text-gray-200" />
            <p>No hay reportes para el filtro seleccionado.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
            <Layers className="w-10 h-10 mx-auto mb-2 text-gray-200" />
            <p>Selecciona un sector y rango de fechas, luego presiona Buscar.</p>
          </div>
        )}
      </div>
    </>
  );
};

export default PanelConsolidadoAdmin;
