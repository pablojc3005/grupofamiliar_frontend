import { useState, useEffect, useMemo } from 'react';
import api from '../../utils/axios';
import { 
  Globe, Users, RefreshCw, Loader2, TrendingUp, Layers, 
  Calendar, ArrowRight, DollarSign, Heart, Baby, Home, Shield 
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, AreaChart, Area
} from 'recharts';

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

const Stat = ({ label, value, icon: Icon, colorClass }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
    <div className="flex justify-between items-start mb-3">
      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">{label}</p>
      {Icon && <div className={`p-2 rounded-lg ${colorClass}`}><Icon className="w-4 h-4" /></div>}
    </div>
    <p className="text-2xl font-bold text-gray-800">{value ?? '—'}</p>
  </div>
);

const DashboardGeneral = () => {
  const [reportes, setReportes] = useState([]);
  const [sectores, setSectores] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros de fecha seguros
  const todayObj = new Date();
  const pad = n => n.toString().padStart(2, '0');
  const todayStr = `${todayObj.getFullYear()}-${pad(todayObj.getMonth() + 1)}-${pad(todayObj.getDate())}`;
  const firstDayOfMonthStr = `${todayObj.getFullYear()}-${pad(todayObj.getMonth() + 1)}-01`;
  
  const [semanaDesde, setSemanaDesde] = useState(firstDayOfMonthStr);
  const [semanaHasta, setSemanaHasta] = useState(todayStr);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [repRes, secRes] = await Promise.all([
        api.get('/consolidados/historico/general'),
        api.get('/sectores'),
      ]);
      setReportes(Array.isArray(repRes.data?.data) ? repRes.data.data : []);
      setSectores(Array.isArray(secRes.data?.data) ? secRes.data.data : []);
    } catch (e) {
      console.error('Error fetching data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtrar reportes
  const reportesFiltrados = useMemo(() => {
    return reportes.filter(r => {
      const d = r.semanaDesde;
      if (!d) return true;
      if (semanaDesde && d < semanaDesde) return false;
      if (semanaHasta && d > semanaHasta) return false;
      return true;
    });
  }, [reportes, semanaDesde, semanaHasta]);

  // Helpers
  const sum = (arr, field) => arr.reduce((acc, curr) => acc + (curr[field] ?? 0), 0);
  const sumOfrendas = (arr) => arr.reduce((acc, curr) => acc + (Number(curr.ofrendaSabado)||0) + (Number(curr.ofrendaNinos)||0) + (Number(curr.ofrendaMiercoles)||0), 0);

  // Agrupar por semana
  const { reportesPorSemana, semanasOrdenadas } = useMemo(() => {
    const agrupados = reportesFiltrados.reduce((acc, curr) => {
      const sem = curr.semanaDesde;
      if (!acc[sem]) acc[sem] = [];
      acc[sem].push(curr);
      return acc;
    }, {});
    return {
      reportesPorSemana: agrupados,
      semanasOrdenadas: Object.keys(agrupados).sort()
    };
  }, [reportesFiltrados]);

  // Totales del periodo filtrado
  const totales = useMemo(() => {
    return {
      asistencia: sum(reportesFiltrados, 'cantHermanos') + sum(reportesFiltrados, 'cantAmigos') + sum(reportesFiltrados, 'cantAdolescentes'),
      convertidos: sum(reportesFiltrados, 'cantConvertidos'),
      ofrenda: sumOfrendas(reportesFiltrados),
      grupos: reportesFiltrados.length,
      hermanos: sum(reportesFiltrados, 'cantHermanos'),
      amigos: sum(reportesFiltrados, 'cantAmigos'),
      adolescentes: sum(reportesFiltrados, 'cantAdolescentes'),
      ninosCristianos: sum(reportesFiltrados, 'cantNinosCristianos'),
      vConsolidacion: sum(reportesFiltrados, 'cantVisitaConsolidacion'),
      vCasaDePaz: sum(reportesFiltrados, 'cantVisitaCasaDePaz'),
      vHogar: sum(reportesFiltrados, 'cantVisitaHogar'),
      retiro: sum(reportesFiltrados, 'cantRetiroEspiritual'),
    };
  }, [reportesFiltrados]);

  // Chart 1: Crecimiento General por Semana
  const chartDataGeneral = useMemo(() => semanasOrdenadas.map(sem => {
    const reps = reportesPorSemana[sem];
    return {
      semana: sem.slice(5),
      Hermanos: sum(reps, 'cantHermanos'),
      Amigos: sum(reps, 'cantAmigos'),
      Convertidos: sum(reps, 'cantConvertidos'),
      Adolescentes: sum(reps, 'cantAdolescentes'),
    };
  }), [semanasOrdenadas, reportesPorSemana]);

  // Chart 2: Comparativa por Sector (Acumulado en el periodo)
  const chartDataSector = useMemo(() => sectores.map(s => {
    const reps = reportesFiltrados.filter(r => r.grupoFamiliar?.sector?.id === s.id);
    return {
      sector: s.nombre?.replace(/Sector /i, '')?.replace(/SECTOR /i, '') || s.nombre,
      Hermanos: sum(reps, 'cantHermanos'),
      Amigos: sum(reps, 'cantAmigos'),
      Convertidos: sum(reps, 'cantConvertidos'),
      Adolescentes: sum(reps, 'cantAdolescentes')
    };
  }), [sectores, reportesFiltrados]);

  // Chart 3: Asistencia por Sector a lo largo del tiempo
  const chartDataSectorLine = useMemo(() => semanasOrdenadas.map(sem => {
    const reps = reportesPorSemana[sem];
    const point = { semana: sem.slice(5) };
    sectores.forEach(s => {
      const repsSector = reps.filter(r => r.grupoFamiliar?.sector?.id === s.id);
      const label = s.nombre?.replace(/Sector /i, '')?.replace(/SECTOR /i, '') || s.nombre;
      point[label] = sum(repsSector, 'cantHermanos') + sum(repsSector, 'cantAmigos') + sum(repsSector, 'cantAdolescentes');
    });
    return point;
  }), [semanasOrdenadas, reportesPorSemana, sectores]);

  // Table: Histórico General (agrupado por semana)
  const tableData = useMemo(() => semanasOrdenadas.map(sem => {
    const reps = reportesPorSemana[sem];
    return {
      semanaDesde: sem,
      semanaHasta: reps[0].semanaHasta,
      asistencia: sum(reps, 'cantHermanos') + sum(reps, 'cantAmigos') + sum(reps, 'cantAdolescentes'),
      convertidos: sum(reps, 'cantConvertidos'),
      ofrenda: sumOfrendas(reps),
      grupos: reps.length
    };
  }).reverse(), [semanasOrdenadas, reportesPorSemana]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-xl border border-gray-100 z-50 min-w-[150px]">
          <p className="font-bold text-gray-800 mb-3 border-b border-gray-100 pb-2">{label}</p>
          <div className="space-y-2">
            {payload.map((entry, index) => (
              <div key={index} className="flex justify-between items-center gap-4 text-sm font-medium">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: entry.color }}></div>
                  <span className="text-gray-600">{entry.name}</span>
                </div>
                <span className="text-gray-900">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Globe className="w-6 h-6 text-indigo-500" /> Vista General
          </h1>
          <p className="text-gray-500 text-sm mt-1">Consolidado interactivo de todos los sectores.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100 transition-colors focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input type="date" value={semanaDesde} onChange={e => setSemanaDesde(e.target.value)} className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer" />
            <ArrowRight className="w-4 h-4 text-gray-300" />
            <input type="date" value={semanaHasta} onChange={e => setSemanaHasta(e.target.value)} className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer" />
          </div>
          <button onClick={fetchData} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-colors text-sm font-semibold">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refrescar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
            <p className="text-sm font-medium text-gray-500">Analizando métricas...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Tarjeta principal (Hero) */}
          <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 rounded-3xl p-6 lg:p-8 text-white shadow-xl shadow-indigo-200/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
            
            <p className="text-indigo-100 text-sm font-medium mb-1 relative z-10 uppercase tracking-wider">Métricas del Periodo Seleccionado</p>
            <h2 className="text-xl font-bold mb-6 relative z-10 flex items-center gap-2">
              <Calendar className="w-5 h-5 opacity-80" /> {semanaDesde} <ArrowRight className="w-4 h-4 opacity-50" /> {semanaHasta}
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-8 relative z-10">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 hover:bg-white/20 transition-colors">
                <p className="text-indigo-100 text-xs mb-1 flex items-center gap-1"><Users className="w-3 h-3" /> Total Asistencia</p>
                <p className="text-4xl font-black">{totales.asistencia}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 hover:bg-white/20 transition-colors">
                <p className="text-indigo-100 text-xs mb-1 flex items-center gap-1"><Heart className="w-3 h-3" /> Convertidos</p>
                <p className="text-4xl font-black">{totales.convertidos}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 hover:bg-white/20 transition-colors">
                <p className="text-indigo-100 text-xs mb-1 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Ofrenda Total S/</p>
                <p className="text-4xl font-black">{totales.ofrenda.toFixed(2)}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 hover:bg-white/20 transition-colors">
                <p className="text-indigo-100 text-xs mb-1 flex items-center gap-1"><Home className="w-3 h-3" /> Reportes Evaluados</p>
                <p className="text-4xl font-black">{totales.grupos}</p>
              </div>
            </div>
          </div>

          {/* Stats Secundarios */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Stat label="Hermanos" value={totales.hermanos} icon={Users} colorClass="bg-blue-50 text-blue-600" />
            <Stat label="Amigos" value={totales.amigos} icon={Heart} colorClass="bg-amber-50 text-amber-600" />
            <Stat label="Adolescentes" value={totales.adolescentes} icon={Users} colorClass="bg-rose-50 text-rose-600" />
            <Stat label="Niños Crist." value={totales.ninosCristianos} icon={Baby} colorClass="bg-emerald-50 text-emerald-600" />
            <Stat label="V. Consolidación" value={totales.vConsolidacion} icon={Home} colorClass="bg-purple-50 text-purple-600" />
            <Stat label="V. Casa de Paz" value={totales.vCasaDePaz} icon={Home} colorClass="bg-cyan-50 text-cyan-600" />
            <Stat label="V. Hogar" value={totales.vHogar} icon={Home} colorClass="bg-indigo-50 text-indigo-600" />
            <Stat label="Retiro Espiritual" value={totales.retiro} icon={Shield} colorClass="bg-fuchsia-50 text-fuchsia-600" />
          </div>

          {/* Gráficas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfica 1 */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-500" /> Evolución de Asistencia
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">Comparativa a lo largo de las semanas</p>
                </div>
              </div>
              <div className="h-[300px]">
                {chartDataGeneral.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartDataGeneral} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorHerm" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorAmig" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="semana" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 12, paddingTop: 20 }} iconType="circle" />
                      <Area type="monotone" dataKey="Hermanos" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorHerm)" />
                      <Area type="monotone" dataKey="Amigos" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorAmig)" />
                      <Area type="monotone" dataKey="Convertidos" stroke="#10b981" strokeWidth={3} fillOpacity={0} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 text-sm">Sin datos en este periodo</div>
                )}
              </div>
            </div>

            {/* Gráfica 2 */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-fuchsia-500" /> Acumulado por Sector
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">Total de asistencia por sector en el periodo</p>
                </div>
              </div>
              <div className="h-[300px]">
                {chartDataSector.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartDataSector} barSize={24} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="sector" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                      <Tooltip cursor={{ fill: '#f3f4f6' }} content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 12, paddingTop: 20 }} iconType="circle" />
                      <Bar dataKey="Hermanos" stackId="a" fill="#6366f1" radius={[0, 0, 4, 4]} />
                      <Bar dataKey="Amigos" stackId="a" fill="#f59e0b" />
                      <Bar dataKey="Adolescentes" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 text-sm">Sin datos en este periodo</div>
                )}
              </div>
            </div>

            {/* Gráfica 3 (Ancho completo) */}
            <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-500" /> Tendencia de Asistencia por Sector
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">Evolución de cada sector a través del tiempo</p>
                </div>
              </div>
              <div className="h-[350px]">
                {chartDataSectorLine.length > 0 && sectores.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartDataSectorLine} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="semana" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 12, paddingTop: 20 }} iconType="circle" />
                      {sectores.map((s, i) => {
                        const label = s.nombre?.replace(/Sector /i, '')?.replace(/SECTOR /i, '') || s.nombre;
                        return <Line key={s.id} type="monotone" dataKey={label} stroke={COLORS[i % COLORS.length]} strokeWidth={3} dot={{ strokeWidth: 2, r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} />;
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 text-sm">Sin datos en este periodo</div>
                )}
              </div>
            </div>
          </div>

          {/* Histórico Tabla */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              <h2 className="text-lg font-bold text-gray-800">Desglose por Semanas</h2>
            </div>
            {tableData.length === 0 ? (
              <div className="p-16 text-center text-gray-400">
                <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Globe className="w-8 h-8 text-gray-300" />
                </div>
                <p className="font-medium text-gray-500">No hay datos históricos en el rango seleccionado.</p>
                <p className="text-xs mt-1">Intenta ampliar las fechas de búsqueda.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 font-semibold tracking-wider">Semana</th>
                      <th className="px-6 py-4 font-semibold tracking-wider">Asistencia Total</th>
                      <th className="px-6 py-4 font-semibold tracking-wider">Convertidos</th>
                      <th className="px-6 py-4 font-semibold tracking-wider">Ofrenda S/</th>
                      <th className="px-6 py-4 font-semibold tracking-wider">Reportes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {tableData.map((row, i) => (
                      <tr key={i} className="hover:bg-indigo-50/30 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-800">
                          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-xs mr-2">{row.semanaDesde}</span> 
                          <span className="text-gray-400">→</span> 
                          <span className="text-gray-500 ml-2 text-xs">{row.semanaHasta}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {row.asistencia}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-emerald-600 font-bold">{row.convertidos}</td>
                        <td className="px-6 py-4 text-gray-800 font-semibold">S/ {row.ofrenda.toFixed(2)}</td>
                        <td className="px-6 py-4 text-gray-500">{row.grupos}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardGeneral;
