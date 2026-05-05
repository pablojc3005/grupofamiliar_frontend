import { useState, useEffect } from 'react';
import api from '../../utils/axios';
import Swal from 'sweetalert2';
import { Loader2, Search, Calendar, Download, FileText, Layers } from 'lucide-react';
import { exportConsolidadoExcel, exportConsolidadoPDF } from '../../utils/exportadores';

const suma = (arr, field) => arr.reduce((acc, r) => acc + (Number(r[field]) || 0), 0);
const today = new Date().toISOString().split('T')[0];

const PanelConsolidadoAdmin = () => {
  const [sectores, setSectores] = useState([]);
  const [sectorId, setSectorId] = useState('');
  const [semanaDesde, setSemanaDesde] = useState(today);
  const [semanaHasta, setSemanaHasta] = useState(today);
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [buscado, setBuscado] = useState(false);

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

  return (
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
            <table className="w-full text-xs text-center border-collapse min-w-[1200px]">
              <thead>
                <tr className="bg-indigo-600 text-white font-bold">
                  <th className="px-2 py-2 border border-indigo-500" rowSpan={2}>ÍTEM</th>
                  <th className="px-2 py-2 border border-indigo-500" rowSpan={2}>LÍDERES / GRUPO</th>
                  <th className="px-2 py-2 border border-indigo-500" colSpan={4}>ASISTENCIA</th>
                  <th className="px-2 py-2 border border-indigo-500" colSpan={4}>NIÑOS / CONVERTIDOS</th>
                  <th className="px-2 py-2 border border-indigo-500" colSpan={3}>VISITAS</th>
                  <th className="px-2 py-2 border border-indigo-500" colSpan={4}>ACT. ESPIRITUALES</th>
                  <th className="px-2 py-2 border border-indigo-500" colSpan={4}>OFRENDAS (S/)</th>
                </tr>
                <tr className="bg-indigo-500 text-white font-semibold">
                  {['HERMANOS','AMIGOS','ADOLESC.','TOTAL','CONVERT.','NIÑOS CRIST.','NIÑOS AMIGOS','TOTAL',
                    'CONSOL.','CASA PAZ','HOGAR','HR ORACIÓN','HR MEP','HR DISCIP.','RETIRO',
                    'SÁBADO','NIÑOS','MIÉRC.','TOTAL'].map(h => (
                    <th key={h} className={`px-2 py-1.5 border border-indigo-400 ${h==='TOTAL'?'bg-indigo-700':''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reportes.map((r, i) => {
                  const tA = (r.cantHermanos||0)+(r.cantAmigos||0)+(r.cantAdolescentes||0);
                  const tN = (r.cantNinosCristianos||0)+(r.cantNinosAmigos||0);
                  const tO = Number(r.ofrendaSabado||0)+Number(r.ofrendaNinos||0)+Number(r.ofrendaMiercoles||0);
                  return (
                    <tr key={r.id} className="hover:bg-indigo-50/30 border-b border-gray-100">
                      <td className="px-2 py-2 border border-gray-200 font-semibold text-gray-700">{i+1}</td>
                      <td className="px-3 py-2 border border-gray-200 text-left">
                        <span className="font-medium text-gray-900">{r.grupoFamiliarNombre || `Líder #${r.liderId}`}</span>
                        <br/><span className="text-[10px] text-gray-500">{r.liderNombre}</span>
                      </td>
                      <td className="px-2 py-2 border border-gray-200">{r.cantHermanos||0}</td>
                      <td className="px-2 py-2 border border-gray-200">{r.cantAmigos||0}</td>
                      <td className="px-2 py-2 border border-gray-200">{r.cantAdolescentes||0}</td>
                      <td className="px-2 py-2 border border-gray-200 font-bold bg-indigo-50 text-indigo-700">{tA}</td>
                      <td className="px-2 py-2 border border-gray-200">{r.cantConvertidos||0}</td>
                      <td className="px-2 py-2 border border-gray-200">{r.cantNinosCristianos||0}</td>
                      <td className="px-2 py-2 border border-gray-200">{r.cantNinosAmigos||0}</td>
                      <td className="px-2 py-2 border border-gray-200 font-bold bg-indigo-50 text-indigo-700">{tN}</td>
                      <td className="px-2 py-2 border border-gray-200">{r.cantVisitaConsolidacion||0}</td>
                      <td className="px-2 py-2 border border-gray-200">{r.cantVisitaCasaDePaz||0}</td>
                      <td className="px-2 py-2 border border-gray-200">{r.cantVisitaHogar||0}</td>
                      <td className="px-2 py-2 border border-gray-200">{r.cantHrOracion||0}</td>
                      <td className="px-2 py-2 border border-gray-200">{r.cantHrMep||0}</td>
                      <td className="px-2 py-2 border border-gray-200">{r.cantHrDiscipulado||0}</td>
                      <td className="px-2 py-2 border border-gray-200">{r.cantRetiroEspiritual||0}</td>
                      <td className="px-2 py-2 border border-gray-200">{Number(r.ofrendaSabado||0).toFixed(0)}</td>
                      <td className="px-2 py-2 border border-gray-200">{Number(r.ofrendaNinos||0).toFixed(0)}</td>
                      <td className="px-2 py-2 border border-gray-200">{Number(r.ofrendaMiercoles||0).toFixed(0)}</td>
                      <td className="px-2 py-2 border border-gray-200 font-bold bg-indigo-50 text-indigo-700">{tO.toFixed(0)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-yellow-400 font-bold text-gray-900 border-t-2 border-gray-400">
                  <td className="px-2 py-3 border border-gray-300 text-center" colSpan={2}>TOTAL</td>
                  <td className="px-2 py-3 border border-gray-300">{suma(reportes,'cantHermanos')}</td>
                  <td className="px-2 py-3 border border-gray-300">{suma(reportes,'cantAmigos')}</td>
                  <td className="px-2 py-3 border border-gray-300">{suma(reportes,'cantAdolescentes')}</td>
                  <td className="px-2 py-3 border border-gray-300 bg-yellow-500">{totalAsistencia}</td>
                  <td className="px-2 py-3 border border-gray-300">{suma(reportes,'cantConvertidos')}</td>
                  <td className="px-2 py-3 border border-gray-300">{suma(reportes,'cantNinosCristianos')}</td>
                  <td className="px-2 py-3 border border-gray-300">{suma(reportes,'cantNinosAmigos')}</td>
                  <td className="px-2 py-3 border border-gray-300 bg-yellow-500">{suma(reportes,'cantNinosCristianos')+suma(reportes,'cantNinosAmigos')}</td>
                  <td className="px-2 py-3 border border-gray-300">{suma(reportes,'cantVisitaConsolidacion')}</td>
                  <td className="px-2 py-3 border border-gray-300">{suma(reportes,'cantVisitaCasaDePaz')}</td>
                  <td className="px-2 py-3 border border-gray-300">{suma(reportes,'cantVisitaHogar')}</td>
                  <td className="px-2 py-3 border border-gray-300">{suma(reportes,'cantHrOracion')}</td>
                  <td className="px-2 py-3 border border-gray-300">{suma(reportes,'cantHrMep')}</td>
                  <td className="px-2 py-3 border border-gray-300">{suma(reportes,'cantHrDiscipulado')}</td>
                  <td className="px-2 py-3 border border-gray-300">{suma(reportes,'cantRetiroEspiritual')}</td>
                  <td className="px-2 py-3 border border-gray-300">{reportes.reduce((a,r)=>a+Number(r.ofrendaSabado||0),0).toFixed(0)}</td>
                  <td className="px-2 py-3 border border-gray-300">{reportes.reduce((a,r)=>a+Number(r.ofrendaNinos||0),0).toFixed(0)}</td>
                  <td className="px-2 py-3 border border-gray-300">{reportes.reduce((a,r)=>a+Number(r.ofrendaMiercoles||0),0).toFixed(0)}</td>
                  <td className="px-2 py-3 border border-gray-300 bg-yellow-500">{reportes.reduce((a,r)=>a+Number(r.ofrendaSabado||0)+Number(r.ofrendaNinos||0)+Number(r.ofrendaMiercoles||0),0).toFixed(0)}</td>
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
  );
};

export default PanelConsolidadoAdmin;
