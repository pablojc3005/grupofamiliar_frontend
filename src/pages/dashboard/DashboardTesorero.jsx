import { useState, useEffect } from 'react';
import api from '../../utils/axios';
import Swal from 'sweetalert2';
import { DollarSign, TrendingUp, TrendingDown, RefreshCw, Loader2, PlusCircle, Trash2, Scale, Building2, Layers, Search, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const TIPO_COLOR = { INGRESO: 'text-emerald-600 bg-emerald-50', EGRESO: 'text-red-500 bg-red-50' };
const today = new Date().toISOString().split('T')[0];
const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

const Tab = ({ label, icon, active, onClick }) => (
  <button onClick={onClick} className={`flex items-center gap-2 pb-3 px-1 text-sm font-semibold transition-colors border-b-2 ${active ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
    {icon} {label}
  </button>
);

const PanelOfrendasGrupo = () => {
  const [datos, setDatos] = useState([]);
  const [sectores, setSectores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [desde, setDesde] = useState(firstDay);
  const [hasta, setHasta] = useState(today);
  const [sectorId, setSectorId] = useState('');

  useEffect(() => { api.get('/sectores').then(r => setSectores(Array.isArray(r.data?.data) ? r.data.data : [])); }, []);

  const buscar = async () => {
    setLoading(true);
    try {
      const params = { desde, hasta };
      if (sectorId) params.sectorId = sectorId;
      const res = await api.get('/finanzas/ofrendas/grupo', { params });
      setDatos(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch { Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo cargar.' }); }
    finally { setLoading(false); }
  };

  const totalGlobal = datos.reduce((a, d) => a + Number(d.totalOfrenda || 0), 0);

  const exportExcel = () => {
    if (!datos.length) return;
    const rows = datos.map((d, i) => ({ '#': i + 1, 'Grupo': d.grupoNombre, 'Líder': d.liderNombre, 'Sector': d.sectorNombre, 'Ofrenda Sábado S/': Number(d.ofrendaSabado || 0).toFixed(2), 'Ofrenda Niños S/': Number(d.ofrendaNinos || 0).toFixed(2), 'Ofrenda Miérc. S/': Number(d.ofrendaMiercoles || 0).toFixed(2), 'Total S/': Number(d.totalOfrenda || 0).toFixed(2) }));
    rows.push({ '#': '', 'Grupo': 'TOTAL GENERAL', 'Líder': '', 'Sector': '', 'Ofrenda Sábado S/': '', 'Ofrenda Niños S/': '', 'Ofrenda Miérc. S/': '', 'Total S/': totalGlobal.toFixed(2) });
    const ws = XLSX.utils.json_to_sheet([]); XLSX.utils.sheet_add_aoa(ws, [['Ofrendas por Grupo Familiar']], { origin: 'A1' }); XLSX.utils.sheet_add_aoa(ws, [[`Período: ${desde} → ${hasta}`]], { origin: 'A2' }); XLSX.utils.sheet_add_json(ws, rows, { origin: 'A4' });
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Ofrendas Grupo'); XLSX.writeFile(wb, `Ofrendas_Grupo_${desde}_${hasta}.xlsx`);
  };

  const exportPDF = () => {
    if (!datos.length) return;
    const doc = new jsPDF({ orientation: 'landscape' }); doc.setFontSize(14); doc.setTextColor(55, 48, 163); doc.text('Ofrendas por Grupo Familiar', 14, 14); doc.setFontSize(9); doc.setTextColor(100); doc.text(`Período: ${desde} → ${hasta}  |  Generado: ${new Date().toLocaleDateString('es-PE')}`, 14, 21);
    const headers = ['#', 'Grupo', 'Líder', 'Sector', 'Sábado S/', 'Niños S/', 'Miérc. S/', 'Total S/']; const body = datos.map((d, i) => [i + 1, d.grupoNombre, d.liderNombre, d.sectorNombre, Number(d.ofrendaSabado || 0).toFixed(2), Number(d.ofrendaNinos || 0).toFixed(2), Number(d.ofrendaMiercoles || 0).toFixed(2), Number(d.totalOfrenda || 0).toFixed(2)]); body.push(['', 'TOTAL GENERAL', '', '', '', '', '', totalGlobal.toFixed(2)]);
    autoTable(doc, { startY: 26, head: [headers], body, theme: 'grid', styles: { fontSize: 8, cellPadding: 3 }, headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' }, didParseCell: (data) => { if (data.row.index === body.length - 1) { data.cell.styles.fillColor = [253, 224, 71]; data.cell.styles.fontStyle = 'bold'; data.cell.styles.textColor = [15, 23, 42]; } } });
    doc.save(`Ofrendas_Grupo_${desde}_${hasta}.pdf`);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-wrap gap-3 items-end">
        <div><label className="block text-xs font-semibold text-gray-500 mb-1">Desde</label><input type="date" value={desde} onChange={e => setDesde(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-400 outline-none" /></div>
        <div><label className="block text-xs font-semibold text-gray-500 mb-1">Hasta</label><input type="date" value={hasta} onChange={e => setHasta(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-400 outline-none" /></div>
        <div><label className="block text-xs font-semibold text-gray-500 mb-1">Sector</label>
          <select value={sectorId} onChange={e => setSectorId(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-400 outline-none min-w-[150px]">
            <option value="">Todos</option>
            {sectores.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
        </div>
        <button onClick={buscar} disabled={loading} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
          <Search className="w-4 h-4" /> Buscar
        </button>
      </div>
      {loading ? <div className="py-10 text-center"><Loader2 className="w-7 h-7 animate-spin mx-auto text-indigo-500" /></div> : datos.length > 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/50">
            <div>
              <h3 className="font-bold text-gray-800 text-sm">Ofrendas por Grupo Familiar</h3>
              <span className="text-xs text-gray-400">Total: S/ {totalGlobal.toFixed(2)}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={exportExcel} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 flex items-center gap-1.5 transition-colors shadow-sm"><Download className="w-3.5 h-3.5" /> Excel</button>
              <button onClick={exportPDF} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 flex items-center gap-1.5 transition-colors shadow-sm"><Download className="w-3.5 h-3.5" /> PDF</button>
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
                {datos.map((d, i) => (
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
                <td className="px-4 py-3 text-right text-emerald-700">S/ {totalGlobal.toFixed(2)}</td>
              </tr></tfoot>
            </table>
          </div>
        </div>
      ) : <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400"><DollarSign className="w-10 h-10 mx-auto mb-2 text-gray-200" /><p>Selecciona un rango y presiona Buscar.</p></div>}
    </div>
  );
};

const PanelOfrendasSector = () => {
  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [desde, setDesde] = useState(firstDay);
  const [hasta, setHasta] = useState(today);

  const buscar = async () => {
    setLoading(true);
    try {
      const res = await api.get('/finanzas/ofrendas/sector', { params: { desde, hasta } });
      setDatos(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch { Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo cargar.' }); }
    finally { setLoading(false); }
  };

  const totalGlobal = datos.reduce((a, d) => a + Number(d.totalOfrenda || 0), 0);

  const exportExcel = () => {
    if (!datos.length) return;
    const rows = datos.map((d, i) => ({ '#': i + 1, 'Sector': d.sectorNombre, 'Grupos': d.cantGrupos, 'Ofrenda Sábado S/': Number(d.ofrendaSabado || 0).toFixed(2), 'Ofrenda Niños S/': Number(d.ofrendaNinos || 0).toFixed(2), 'Ofrenda Miérc. S/': Number(d.ofrendaMiercoles || 0).toFixed(2), 'Total S/': Number(d.totalOfrenda || 0).toFixed(2) }));
    rows.push({ '#': '', 'Sector': 'TOTAL GENERAL', 'Grupos': '', 'Ofrenda Sábado S/': '', 'Ofrenda Niños S/': '', 'Ofrenda Miérc. S/': '', 'Total S/': totalGlobal.toFixed(2) });
    const ws = XLSX.utils.json_to_sheet([]); XLSX.utils.sheet_add_aoa(ws, [['Ofrendas por Sector']], { origin: 'A1' }); XLSX.utils.sheet_add_aoa(ws, [[`Período: ${desde} → ${hasta}`]], { origin: 'A2' }); XLSX.utils.sheet_add_json(ws, rows, { origin: 'A4' });
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Ofrendas Sector'); XLSX.writeFile(wb, `Ofrendas_Sector_${desde}_${hasta}.xlsx`);
  };

  const exportPDF = () => {
    if (!datos.length) return;
    const doc = new jsPDF({ orientation: 'landscape' }); doc.setFontSize(14); doc.setTextColor(55, 48, 163); doc.text('Ofrendas por Sector', 14, 14); doc.setFontSize(9); doc.setTextColor(100); doc.text(`Período: ${desde} → ${hasta}  |  Generado: ${new Date().toLocaleDateString('es-PE')}`, 14, 21);
    const headers = ['#', 'Sector', 'Grupos', 'Sábado S/', 'Niños S/', 'Miérc. S/', 'Total S/']; const body = datos.map((d, i) => [i + 1, d.sectorNombre, d.cantGrupos, Number(d.ofrendaSabado || 0).toFixed(2), Number(d.ofrendaNinos || 0).toFixed(2), Number(d.ofrendaMiercoles || 0).toFixed(2), Number(d.totalOfrenda || 0).toFixed(2)]); body.push(['', 'TOTAL GENERAL', '', '', '', '', totalGlobal.toFixed(2)]);
    autoTable(doc, { startY: 26, head: [headers], body, theme: 'grid', styles: { fontSize: 8, cellPadding: 3 }, headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' }, didParseCell: (data) => { if (data.row.index === body.length - 1) { data.cell.styles.fillColor = [253, 224, 71]; data.cell.styles.fontStyle = 'bold'; data.cell.styles.textColor = [15, 23, 42]; } } });
    doc.save(`Ofrendas_Sector_${desde}_${hasta}.pdf`);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-wrap gap-3 items-end">
        <div><label className="block text-xs font-semibold text-gray-500 mb-1">Desde</label><input type="date" value={desde} onChange={e => setDesde(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-400 outline-none" /></div>
        <div><label className="block text-xs font-semibold text-gray-500 mb-1">Hasta</label><input type="date" value={hasta} onChange={e => setHasta(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-400 outline-none" /></div>
        <button onClick={buscar} disabled={loading} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
          <Search className="w-4 h-4" /> Buscar
        </button>
      </div>
      {loading ? <div className="py-10 text-center"><Loader2 className="w-7 h-7 animate-spin mx-auto text-indigo-500" /></div> : datos.length > 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/50">
            <div>
              <h3 className="font-bold text-gray-800 text-sm">Ofrendas por Sector</h3>
              <span className="text-xs text-gray-400">Total: S/ {totalGlobal.toFixed(2)}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={exportExcel} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 flex items-center gap-1.5 transition-colors shadow-sm"><Download className="w-3.5 h-3.5" /> Excel</button>
              <button onClick={exportPDF} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 flex items-center gap-1.5 transition-colors shadow-sm"><Download className="w-3.5 h-3.5" /> PDF</button>
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
                {datos.map((d, i) => (
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
                <td className="px-4 py-3 text-right text-emerald-700">S/ {totalGlobal.toFixed(2)}</td>
              </tr></tfoot>
            </table>
          </div>
        </div>
      ) : <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400"><Layers className="w-10 h-10 mx-auto mb-2 text-gray-200" /><p>Selecciona un rango y presiona Buscar.</p></div>}
    </div>
  );
};

const DashboardTesorero = () => {
  const [activeTab, setActiveTab] = useState('movimientos');
  const [movimientos, setMovimientos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [periodos, setPeriodos] = useState([]);
  const [periodoSel, setPeriodoSel] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ monto: '', descripcion: '', fecha: today, idCategoria: '', idPeriodo: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [movRes, catRes] = await Promise.all([
        api.get('/finanzas/movimientos'),
        api.get('/finanzas/categorias'),
      ]);
      setMovimientos(Array.isArray(movRes.data?.data) ? movRes.data.data : []);
      setCategorias(Array.isArray(catRes.data?.data) ? catRes.data.data : []);
    } catch (e) { console.error(e); }
    // Periodos es opcional - no falla el dashboard si no existe
    try {
      const perRes = await api.get('/periodos');
      setPeriodos(Array.isArray(perRes.data?.data) ? perRes.data.data : []);
    } catch { /* endpoint opcional, continúa sin periodos */ }
    finally { setLoading(false); }
  };


  useEffect(() => { fetchData(); }, []);

  const movFiltrados = periodoSel ? movimientos.filter(m => String(m.periodo?.id || m.idPeriodo) === periodoSel) : movimientos;
  const handleChange = e => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleCrear = async e => {
    e.preventDefault();
    if (!formData.idCategoria || !formData.monto || !formData.fecha) { Swal.fire({ icon: 'warning', title: 'Campos requeridos', text: 'Complete categoría, monto y fecha.' }); return; }
    try {
      const cat = categorias.find(c => String(c.id) === String(formData.idCategoria));
      await api.post('/finanzas/movimientos', { monto: Number(formData.monto), descripcion: formData.descripcion, fecha: formData.fecha, idCategoria: Number(formData.idCategoria), idPeriodo: formData.idPeriodo ? Number(formData.idPeriodo) : undefined, categoria: cat ? { id: cat.id } : undefined, periodo: formData.idPeriodo ? { id: Number(formData.idPeriodo) } : undefined });
      Swal.fire({ icon: 'success', title: '¡Registrado!', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
      setShowForm(false); setFormData({ monto: '', descripcion: '', fecha: today, idCategoria: '', idPeriodo: '' }); fetchData();
    } catch (err) { Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.mensaje || 'No se pudo registrar.' }); }
  };

  const handleEliminar = async id => {
    const ok = await Swal.fire({ title: '¿Eliminar movimiento?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc2626' });
    if (!ok.isConfirmed) return;
    try { await api.delete(`/finanzas/movimientos/${id}`); Swal.fire({ icon: 'success', title: 'Eliminado', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false }); fetchData(); }
    catch { Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo eliminar.' }); }
  };

  const totalIngresos = movFiltrados.filter(m => m.categoria?.tipo === 'INGRESO').reduce((s, m) => s + Number(m.monto || 0), 0);
  const totalEgresos = movFiltrados.filter(m => m.categoria?.tipo === 'EGRESO').reduce((s, m) => s + Number(m.monto || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-800">Tesorero 💰</h1><p className="text-gray-500 text-sm mt-1">Gestión financiera y ofrendas.</p></div>
        <button onClick={fetchData} className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-xl hover:bg-gray-50 shadow-sm text-sm font-medium self-start">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Actualizar
        </button>
      </div>

      <div className="flex gap-4 border-b border-gray-200">
        <Tab label="Movimientos" icon={<DollarSign className="w-4 h-4" />} active={activeTab === 'movimientos'} onClick={() => setActiveTab('movimientos')} />
        <Tab label="Ofrendas por Grupo" icon={<Building2 className="w-4 h-4" />} active={activeTab === 'grupos'} onClick={() => setActiveTab('grupos')} />
        <Tab label="Ofrendas por Sector" icon={<Layers className="w-4 h-4" />} active={activeTab === 'sectores'} onClick={() => setActiveTab('sectores')} />
      </div>

      {activeTab === 'movimientos' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4"><div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><TrendingUp className="w-7 h-7" /></div><div><p className="text-xs text-gray-500 uppercase tracking-wide">Ingresos</p><p className="text-2xl font-bold text-emerald-600">S/ {totalIngresos.toFixed(2)}</p></div></div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4"><div className="p-3 bg-red-50 text-red-500 rounded-xl"><TrendingDown className="w-7 h-7" /></div><div><p className="text-xs text-gray-500 uppercase tracking-wide">Egresos</p><p className="text-2xl font-bold text-red-500">S/ {totalEgresos.toFixed(2)}</p></div></div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4"><div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Scale className="w-7 h-7" /></div><div><p className="text-xs text-gray-500 uppercase tracking-wide">Balance</p><p className={`text-2xl font-bold ${totalIngresos - totalEgresos >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>S/ {(totalIngresos - totalEgresos).toFixed(2)}</p></div></div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
            <label className="text-sm font-medium text-gray-600">Periodo:</label>
            <select value={periodoSel} onChange={e => setPeriodoSel(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-400 outline-none">
              <option value="">Todos</option>
              {periodos.map(p => <option key={p.id} value={p.id}>{p.descripcion || `${p.fechaInicio} → ${p.fechaFin}`}</option>)}
            </select>
            <button onClick={() => setShowForm(s => !s)} className="ml-auto flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 shadow-sm text-sm font-medium"><PlusCircle className="w-4 h-4" /> Nuevo Movimiento</button>
          </div>
          {showForm && (
            <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-6">
              <h2 className="text-base font-bold text-gray-800 mb-4">Registrar Movimiento</h2>
              <form onSubmit={handleCrear} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Categoría *</label><select name="idCategoria" value={formData.idCategoria} onChange={handleChange} required className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-400 outline-none"><option value="">Seleccionar...</option>{categorias.map(c => <option key={c.id} value={c.id}>{c.nombre} ({c.tipo})</option>)}</select></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Monto S/ *</label><input type="number" name="monto" step="0.01" min="0" value={formData.monto} onChange={handleChange} required className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-400 outline-none" placeholder="0.00" /></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Fecha *</label><input type="date" name="fecha" value={formData.fecha} onChange={handleChange} required className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-400 outline-none" /></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Periodo</label><select name="idPeriodo" value={formData.idPeriodo} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-400 outline-none"><option value="">Sin periodo</option>{periodos.map(p => <option key={p.id} value={p.id}>{p.descripcion || p.id}</option>)}</select></div>
                <div className="md:col-span-2"><label className="block text-xs font-semibold text-gray-600 mb-1.5">Descripción</label><input type="text" name="descripcion" value={formData.descripcion} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-400 outline-none" placeholder="Descripción opcional..." /></div>
                <div className="md:col-span-3 flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50">Cancelar</button>
                  <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 flex items-center gap-2"><DollarSign className="w-4 h-4" /> Registrar</button>
                </div>
              </form>
            </div>
          )}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2"><DollarSign className="w-5 h-5 text-indigo-500" /><h2 className="text-lg font-bold text-gray-800">Movimientos</h2></div>
            {loading ? <div className="p-10 text-center"><Loader2 className="w-7 h-7 animate-spin mx-auto text-indigo-500" /></div> : movFiltrados.length === 0 ? <div className="p-10 text-center text-gray-400"><DollarSign className="w-10 h-10 mx-auto mb-2 text-gray-200" /><p>No hay movimientos registrados.</p></div> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b"><tr><th className="px-5 py-3">Fecha</th><th className="px-5 py-3">Categoría</th><th className="px-5 py-3">Tipo</th><th className="px-5 py-3">Monto S/</th><th className="px-5 py-3">Descripción</th><th className="px-5 py-3 text-right">Acción</th></tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {movFiltrados.map(m => (
                      <tr key={m.id} className="hover:bg-gray-50/50">
                        <td className="px-5 py-3 text-gray-600">{m.fecha}</td>
                        <td className="px-5 py-3 font-medium text-gray-800">{m.categoria?.nombre || '—'}</td>
                        <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${TIPO_COLOR[m.categoria?.tipo] || 'text-gray-500 bg-gray-100'}`}>{m.categoria?.tipo || '—'}</span></td>
                        <td className={`px-5 py-3 font-bold ${m.categoria?.tipo === 'INGRESO' ? 'text-emerald-600' : 'text-red-500'}`}>S/ {Number(m.monto || 0).toFixed(2)}</td>
                        <td className="px-5 py-3 text-gray-500 truncate max-w-xs">{m.descripcion || '—'}</td>
                        <td className="px-5 py-3 text-right"><button onClick={() => handleEliminar(m.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
      {activeTab === 'grupos' && <PanelOfrendasGrupo />}
      {activeTab === 'sectores' && <PanelOfrendasSector />}
    </div>
  );
};

export default DashboardTesorero;
