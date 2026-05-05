import { useState, useEffect } from 'react';
import api from '../../utils/axios';
import Swal from 'sweetalert2';
import { Loader2, Search, DollarSign, Layers, Building2, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const today = new Date().toISOString().split('T')[0];
const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

const Tab = ({ label, icon, active, onClick }) => (
  <button onClick={onClick} className={`flex items-center gap-2 pb-3 px-1 text-sm font-semibold transition-colors border-b-2 ${active ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
    {icon} {label}
  </button>
);

const PanelFinanzasAdmin = () => {
  const [subTab, setSubTab] = useState('grupo');
  const [sectores, setSectores] = useState([]);
  const [sectorId, setSectorId] = useState('');
  const [desde, setDesde] = useState(firstDay);
  const [hasta, setHasta] = useState(today);
  const [datosGrupo, setDatosGrupo] = useState([]);
  const [datosSector, setDatosSector] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/sectores').then(r => setSectores(Array.isArray(r.data?.data) ? r.data.data : [])).catch(() => {});
  }, []);

  const buscarGrupo = async () => {
    setLoading(true);
    try {
      const params = { desde, hasta };
      if (sectorId) params.sectorId = sectorId;
      const res = await api.get('/finanzas/ofrendas/grupo', { params });
      setDatosGrupo(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch { Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo cargar.' }); }
    finally { setLoading(false); }
  };

  const buscarSector = async () => {
    setLoading(true);
    try {
      const res = await api.get('/finanzas/ofrendas/sector', { params: { desde, hasta } });
      setDatosSector(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch { Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo cargar.' }); }
    finally { setLoading(false); }
  };

  const buscar = () => subTab === 'grupo' ? buscarGrupo() : buscarSector();
  const totalGrupo = datosGrupo.reduce((a, d) => a + Number(d.totalOfrenda || 0), 0);
  const totalSector = datosSector.reduce((a, d) => a + Number(d.totalOfrenda || 0), 0);

  // ── Export Ofrendas por Grupo ──
  const exportGrupoExcel = () => {
    if (!datosGrupo.length) return;
    const rows = datosGrupo.map((d, i) => ({
      '#': i + 1,
      'Grupo': d.grupoNombre,
      'Líder': d.liderNombre,
      'Sector': d.sectorNombre,
      'Ofrenda Sábado S/': Number(d.ofrendaSabado || 0).toFixed(2),
      'Ofrenda Niños S/': Number(d.ofrendaNinos || 0).toFixed(2),
      'Ofrenda Miérc. S/': Number(d.ofrendaMiercoles || 0).toFixed(2),
      'Total S/': Number(d.totalOfrenda || 0).toFixed(2),
    }));
    rows.push({ '#': '', 'Grupo': 'TOTAL GENERAL', 'Líder': '', 'Sector': '', 'Ofrenda Sábado S/': '', 'Ofrenda Niños S/': '', 'Ofrenda Miérc. S/': '', 'Total S/': totalGrupo.toFixed(2) });
    const ws = XLSX.utils.json_to_sheet([]);
    XLSX.utils.sheet_add_aoa(ws, [['Ofrendas por Grupo Familiar']], { origin: 'A1' });
    XLSX.utils.sheet_add_aoa(ws, [[`Período: ${desde} → ${hasta}`]], { origin: 'A2' });
    XLSX.utils.sheet_add_json(ws, rows, { origin: 'A4' });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ofrendas Grupo');
    XLSX.writeFile(wb, `Ofrendas_Grupo_${desde}_${hasta}.xlsx`);
  };

  const exportGrupoPDF = () => {
    if (!datosGrupo.length) return;
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(14); doc.setTextColor(55, 48, 163);
    doc.text('Ofrendas por Grupo Familiar', 14, 14);
    doc.setFontSize(9); doc.setTextColor(100);
    doc.text(`Período: ${desde} → ${hasta}  |  Generado: ${new Date().toLocaleDateString('es-PE')}`, 14, 21);
    const headers = ['#', 'Grupo', 'Líder', 'Sector', 'Sábado S/', 'Niños S/', 'Miérc. S/', 'Total S/'];
    const body = datosGrupo.map((d, i) => [i + 1, d.grupoNombre, d.liderNombre, d.sectorNombre, Number(d.ofrendaSabado || 0).toFixed(2), Number(d.ofrendaNinos || 0).toFixed(2), Number(d.ofrendaMiercoles || 0).toFixed(2), Number(d.totalOfrenda || 0).toFixed(2)]);
    body.push(['', 'TOTAL GENERAL', '', '', '', '', '', totalGrupo.toFixed(2)]);
    autoTable(doc, { startY: 26, head: [headers], body, theme: 'grid', styles: { fontSize: 8, cellPadding: 3 }, headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' }, didParseCell: (data) => { if (data.row.index === body.length - 1) { data.cell.styles.fillColor = [253, 224, 71]; data.cell.styles.fontStyle = 'bold'; data.cell.styles.textColor = [15, 23, 42]; } } });
    doc.save(`Ofrendas_Grupo_${desde}_${hasta}.pdf`);
  };

  // ── Export Ofrendas por Sector ──
  const exportSectorExcel = () => {
    if (!datosSector.length) return;
    const rows = datosSector.map((d, i) => ({
      '#': i + 1,
      'Sector': d.sectorNombre,
      'Grupos': d.cantGrupos,
      'Ofrenda Sábado S/': Number(d.ofrendaSabado || 0).toFixed(2),
      'Ofrenda Niños S/': Number(d.ofrendaNinos || 0).toFixed(2),
      'Ofrenda Miérc. S/': Number(d.ofrendaMiercoles || 0).toFixed(2),
      'Total S/': Number(d.totalOfrenda || 0).toFixed(2),
    }));
    rows.push({ '#': '', 'Sector': 'TOTAL GENERAL', 'Grupos': '', 'Ofrenda Sábado S/': '', 'Ofrenda Niños S/': '', 'Ofrenda Miérc. S/': '', 'Total S/': totalSector.toFixed(2) });
    const ws = XLSX.utils.json_to_sheet([]);
    XLSX.utils.sheet_add_aoa(ws, [['Ofrendas por Sector']], { origin: 'A1' });
    XLSX.utils.sheet_add_aoa(ws, [[`Período: ${desde} → ${hasta}`]], { origin: 'A2' });
    XLSX.utils.sheet_add_json(ws, rows, { origin: 'A4' });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ofrendas Sector');
    XLSX.writeFile(wb, `Ofrendas_Sector_${desde}_${hasta}.xlsx`);
  };

  const exportSectorPDF = () => {
    if (!datosSector.length) return;
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(14); doc.setTextColor(55, 48, 163);
    doc.text('Ofrendas por Sector', 14, 14);
    doc.setFontSize(9); doc.setTextColor(100);
    doc.text(`Período: ${desde} → ${hasta}  |  Generado: ${new Date().toLocaleDateString('es-PE')}`, 14, 21);
    const headers = ['#', 'Sector', 'Grupos', 'Sábado S/', 'Niños S/', 'Miérc. S/', 'Total S/'];
    const body = datosSector.map((d, i) => [i + 1, d.sectorNombre, d.cantGrupos, Number(d.ofrendaSabado || 0).toFixed(2), Number(d.ofrendaNinos || 0).toFixed(2), Number(d.ofrendaMiercoles || 0).toFixed(2), Number(d.totalOfrenda || 0).toFixed(2)]);
    body.push(['', 'TOTAL GENERAL', '', '', '', '', totalSector.toFixed(2)]);
    autoTable(doc, { startY: 26, head: [headers], body, theme: 'grid', styles: { fontSize: 8, cellPadding: 3 }, headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' }, didParseCell: (data) => { if (data.row.index === body.length - 1) { data.cell.styles.fillColor = [253, 224, 71]; data.cell.styles.fontStyle = 'bold'; data.cell.styles.textColor = [15, 23, 42]; } } });
    doc.save(`Ofrendas_Sector_${desde}_${hasta}.pdf`);
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-4 border-b border-gray-200">
        <Tab label="Ofrendas por Grupo" icon={<Building2 className="w-4 h-4" />} active={subTab === 'grupo'} onClick={() => setSubTab('grupo')} />
        <Tab label="Ofrendas por Sector" icon={<Layers className="w-4 h-4" />} active={subTab === 'sector'} onClick={() => setSubTab('sector')} />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-wrap gap-3 items-end">
        <div><label className="block text-xs font-semibold text-gray-500 mb-1">Desde</label><input type="date" value={desde} onChange={e => setDesde(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-400 outline-none" /></div>
        <div><label className="block text-xs font-semibold text-gray-500 mb-1">Hasta</label><input type="date" value={hasta} onChange={e => setHasta(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-400 outline-none" /></div>
        {subTab === 'grupo' && (
          <div><label className="block text-xs font-semibold text-gray-500 mb-1">Sector</label>
            <select value={sectorId} onChange={e => setSectorId(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-400 outline-none min-w-[150px]">
              <option value="">Todos</option>
              {sectores.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>
        )}
        <button onClick={buscar} disabled={loading} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
          <Search className="w-4 h-4" /> Buscar
        </button>
      </div>

      {loading ? <div className="py-10 text-center"><Loader2 className="w-7 h-7 animate-spin mx-auto text-indigo-500" /></div> : (
        <>
          {subTab === 'grupo' && datosGrupo.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-3 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/50">
                <div>
                  <h3 className="font-bold text-gray-800 text-sm">Ofrendas por Grupo Familiar</h3>
                  <span className="text-xs text-gray-400">Total: S/ {totalGrupo.toFixed(2)}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={exportGrupoExcel}
                    className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 flex items-center gap-1.5 transition-colors shadow-sm">
                    <Download className="w-3.5 h-3.5" /> Excel
                  </button>
                  <button onClick={exportGrupoPDF}
                    className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 flex items-center gap-1.5 transition-colors shadow-sm">
                    <Download className="w-3.5 h-3.5" /> PDF
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3">Grupo / Líder</th>
                      <th className="px-4 py-3">Sector</th>
                      <th className="px-4 py-3 text-right">Sábado S/</th>
                      <th className="px-4 py-3 text-right">Niños S/</th>
                      <th className="px-4 py-3 text-right">Miérc. S/</th>
                      <th className="px-4 py-3 text-right font-bold">Total S/</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {datosGrupo.map((d, i) => (
                      <tr key={i} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3"><p className="font-medium text-gray-900">{d.grupoNombre}</p><p className="text-xs text-gray-500">{d.liderNombre}</p></td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{d.sectorNombre}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{Number(d.ofrendaSabado || 0).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{Number(d.ofrendaNinos || 0).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{Number(d.ofrendaMiercoles || 0).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-600">{Number(d.totalOfrenda || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot><tr className="bg-yellow-50 font-bold border-t-2 border-yellow-300">
                    <td colSpan={5} className="px-4 py-3 text-gray-800">TOTAL GENERAL</td>
                    <td className="px-4 py-3 text-right text-emerald-700">S/ {totalGrupo.toFixed(2)}</td>
                  </tr></tfoot>
                </table>
              </div>
            </div>
          )}

          {subTab === 'sector' && datosSector.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-3 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/50">
                <div>
                  <h3 className="font-bold text-gray-800 text-sm">Ofrendas por Sector</h3>
                  <span className="text-xs text-gray-400">Total: S/ {totalSector.toFixed(2)}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={exportSectorExcel}
                    className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 flex items-center gap-1.5 transition-colors shadow-sm">
                    <Download className="w-3.5 h-3.5" /> Excel
                  </button>
                  <button onClick={exportSectorPDF}
                    className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 flex items-center gap-1.5 transition-colors shadow-sm">
                    <Download className="w-3.5 h-3.5" /> PDF
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3">Sector</th>
                      <th className="px-4 py-3 text-center">Grupos</th>
                      <th className="px-4 py-3 text-right">Sábado S/</th>
                      <th className="px-4 py-3 text-right">Niños S/</th>
                      <th className="px-4 py-3 text-right">Miérc. S/</th>
                      <th className="px-4 py-3 text-right font-bold">Total S/</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {datosSector.map((d, i) => (
                      <tr key={i} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-medium text-gray-900">{d.sectorNombre}</td>
                        <td className="px-4 py-3 text-center text-gray-500">{d.cantGrupos}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{Number(d.ofrendaSabado || 0).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{Number(d.ofrendaNinos || 0).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{Number(d.ofrendaMiercoles || 0).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-600">{Number(d.totalOfrenda || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot><tr className="bg-yellow-50 font-bold border-t-2 border-yellow-300">
                    <td colSpan={5} className="px-4 py-3 text-gray-800">TOTAL GENERAL</td>
                    <td className="px-4 py-3 text-right text-emerald-700">S/ {totalSector.toFixed(2)}</td>
                  </tr></tfoot>
                </table>
              </div>
            </div>
          )}

          {((subTab === 'grupo' && datosGrupo.length === 0) || (subTab === 'sector' && datosSector.length === 0)) && (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
              <DollarSign className="w-10 h-10 mx-auto mb-2 text-gray-200" />
              <p>Selecciona un rango y presiona Buscar.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PanelFinanzasAdmin;
