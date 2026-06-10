import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import api from '../../utils/axios';
import Swal from 'sweetalert2';
import { 
  Save, Send, Loader2, ArrowLeft, Calendar, 
  Users, Plus, Trash2, Shield, Heart, Home, AlertCircle
} from 'lucide-react';

const INITIAL_FORM = {
  semanaDesde: '',
  semanaHasta: '',
  diezmo: 'false',
  lecturaBiblia: 'false',
  ayuno: 'false',
  cultoLiderazgo: 'false',
  horasOracion: '',
  minutosOracion: '',
  planificacionGrupo: '',
  planificacionFecha: '',
  planificacionHora: '',
  planificacionPositivos: '',
  planificacionNegativos: '',
  firma: '',
};

// Componente SignaturePad con soporte responsivo y táctil completo
const SignaturePad = ({ value, onChange, disabled }) => {
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#1e1b4b'; // Indigo oscuro
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = value;
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [value]);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    // Mapear coordenadas considerando el escalado del Canvas por CSS
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const startDrawing = (e) => {
    if (disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    isDrawing.current = true;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e) => {
    if (!isDrawing.current || disabled) return;
    if (e.cancelable) e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (disabled) return;
    isDrawing.current = false;
    const canvas = canvasRef.current;
    if (canvas) {
      onChange(canvas.toDataURL('image/png'));
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onChange('');
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-gray-600 mb-1">Firma Manuscrita (Dibuja con tu dedo o lápiz en la pantalla) *</label>
      <div className="border border-indigo-100 bg-indigo-50/20 rounded-2xl overflow-hidden relative shadow-inner" style={{ height: '220px' }}>
        <canvas
          ref={canvasRef}
          width={600}
          height={220}
          className="w-full h-full cursor-crosshair touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!disabled && (
          <button
            type="button"
            onClick={clear}
            className="absolute bottom-3 right-3 bg-white text-gray-700 hover:text-red-500 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all shadow-sm"
          >
            Limpiar firma
          </button>
        )}
      </div>
    </div>
  );
};

const Section = ({ title, icon, children, cols = 'grid-cols-2 md:grid-cols-3' }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-gray-100 flex items-center gap-2">
      <span className="text-indigo-600">{icon}</span>
      <h2 className="text-xs font-extrabold text-indigo-800 uppercase tracking-wider">{title}</h2>
    </div>
    <div className={`p-5 grid ${cols} gap-4`}>{children}</div>
  </div>
);

const ReporteSectorialForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  // Estados del formulario
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [atenciones, setAtenciones] = useState([]);
  const [supervisiones, setSupervisiones] = useState([]);
  const [evaluacionesEquipo, setEvaluacionesEquipo] = useState([]);
  
  // Listado de grupos del sector
  const [gruposSector, setGruposSector] = useState([]);

  // Cargar grupos del sector
  useEffect(() => {
    const fetchGrupos = async () => {
      const sId = user?.sectorId;
      if (!sId) return;
      try {
        const res = await api.get(`/grupos-familiares/sector/${sId}`);
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        setGruposSector(list);
        
        // Si no estamos editando, inicializar evaluaciones con todos los grupos del sector vacíos
        if (!id) {
          setEvaluacionesEquipo(list.map(g => ({
            grupoId: g.id,
            grupoNombre: g.nombre,
            evaluacion: ''
          })));
        }
      } catch (err) {
        console.error("Error al cargar grupos del sector:", err);
      }
    };
    fetchGrupos();
  }, [user?.sectorId, id]);

  // Cargar datos si estamos en modo edición
  useEffect(() => {
    if (!id) return;
    const fetchReporte = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/reportes-sectoriales/${id}`);
        const r = res.data?.data;
        if (r) {
          setFormData({
            semanaDesde: r.semanaDesde || '',
            semanaHasta: r.semanaHasta || '',
            diezmo: String(r.diezmo),
            lecturaBiblia: String(r.lecturaBiblia),
            ayuno: String(r.ayuno),
            cultoLiderazgo: String(r.cultoLiderazgo),
            horasOracion: r.horasOracion !== 0 ? String(r.horasOracion) : '',
            minutosOracion: r.minutosOracion !== 0 ? String(r.minutosOracion) : '',
            planificacionGrupo: r.planificacionGrupo || '',
            planificacionFecha: r.planificacionFecha || '',
            planificacionHora: r.planificacionHora || '',
            planificacionPositivos: r.planificacionPositivos || '',
            planificacionNegativos: r.planificacionNegativos || '',
            firma: r.firma || '',
          });

          // Parsear campos JSON con validación
          setAtenciones(r.atencionesJson ? JSON.parse(r.atencionesJson) : []);
          setSupervisiones(r.supervisionesJson ? JSON.parse(r.supervisionesJson) : []);
          
          const evalsGuardadas = r.evaluacionesEquipoJson ? JSON.parse(r.evaluacionesEquipoJson) : [];
          // Asegurar que si hay grupos nuevos en el sector, aparezcan listados
          setEvaluacionesEquipo(prev => {
            const list = gruposSector.length > 0 ? gruposSector : evalsGuardadas;
            return list.map(g => {
              const guardada = evalsGuardadas.find(e => String(e.grupoId) === String(g.grupoId || g.id));
              return {
                grupoId: g.id || g.grupoId,
                grupoNombre: g.nombre || g.grupoNombre,
                evaluacion: guardada ? guardada.evaluacion : ''
              };
            });
          });
        }
      } catch (e) {
        console.error(e);
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo cargar el reporte para editar.' });
        navigate('/supervisor/reporte-sectorial');
      } finally {
        setLoading(false);
      }
    };
    if (gruposSector.length > 0 || id) {
      fetchReporte();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, gruposSector.length]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- Manejo de Atenciones (Dinámico) ---
  const addAtencion = () => {
    setAtenciones(prev => [...prev, { lider: '', lugar: 'CASA', fecha: '', hora: '', motivo: '', resultado: '' }]);
  };

  const removeAtencion = (index) => {
    setAtenciones(prev => prev.filter((_, i) => i !== index));
  };

  const handleAtencionChange = (index, field, val) => {
    setAtenciones(prev => prev.map((item, i) => i === index ? { ...item, [field]: val } : item));
  };

  // --- Manejo de Supervisiones (Dinámico) ---
  const addSupervision = () => {
    setSupervisiones(prev => [...prev, { grupoId: '', grupoNombre: '', fecha: '', hora: '', positivos: '', negativos: '' }]);
  };

  const removeSupervision = (index) => {
    setSupervisiones(prev => prev.filter((_, i) => i !== index));
  };

  const handleSupervisionChange = (index, field, val) => {
    setSupervisiones(prev => {
      const copy = [...prev];
      if (field === 'grupoId') {
        const g = gruposSector.find(x => String(x.id) === String(val));
        copy[index].grupoId = val;
        copy[index].grupoNombre = g ? g.nombre : '';
      } else {
        copy[index][field] = val;
      }
      return copy;
    });
  };

  // --- Manejo de Evaluaciones (Grupos del sector) ---
  const handleEvaluacionChange = (index, val) => {
    setEvaluacionesEquipo(prev => prev.map((item, i) => i === index ? { ...item, evaluacion: val } : item));
  };

  // --- Envío ---
  const buildPayload = () => {
    const toNum = (v) => v === '' ? 0 : Number(v);
    const toBool = (v) => v === true || v === 'true';

    return {
      id: id ? Number(id) : null,
      sectorId: user?.sectorId,
      supervisorId: user?.id,
      semanaDesde: formData.semanaDesde,
      semanaHasta: formData.semanaHasta,
      diezmo: toBool(formData.diezmo),
      lecturaBiblia: toBool(formData.lecturaBiblia),
      ayuno: toBool(formData.ayuno),
      cultoLiderazgo: toBool(formData.cultoLiderazgo),
      horasOracion: toNum(formData.horasOracion),
      minutosOracion: toNum(formData.minutosOracion),
      // Listas a JSON
      atencionesJson: JSON.stringify(atenciones),
      supervisionesJson: JSON.stringify(supervisiones),
      evaluacionesEquipoJson: JSON.stringify(evaluacionesEquipo),
      // Planificación
      planificacionGrupo: formData.planificacionGrupo,
      planificacionFecha: formData.planificacionFecha || null,
      planificacionHora: formData.planificacionHora,
      planificacionPositivos: formData.planificacionPositivos,
      planificacionNegativos: formData.planificacionNegativos,
      // Firma
      firma: formData.firma,
      estado: 'BORRADOR'
    };
  };

  const handleSubmit = async (e, actionType = 'save') => {
    e.preventDefault();

    if (!formData.firma) {
      Swal.fire({
        icon: 'warning',
        title: 'Firma Requerida',
        text: 'Por favor, firma el reporte en el canvas inferior antes de guardar o enviar.'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = buildPayload();
      
      // 1. Guardar reporte (POST crea o actualiza en BORRADOR)
      const res = await api.post('/reportes-sectoriales', payload);
      const savedId = res.data?.data?.id;

      // 2. Si la acción es enviar, ejecutar PATCH para cambiar estado
      if (actionType === 'send' && savedId) {
        await api.patch(`/reportes-sectoriales/${savedId}/enviar`);
        await Swal.fire({
          icon: 'success',
          title: '¡Reporte Enviado!',
          text: 'Tu reporte semanal ha sido enviado correctamente al Supervisor General.',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        await Swal.fire({
          icon: 'success',
          title: 'Borrador Guardado',
          text: 'Los cambios se han guardado correctamente en borrador.',
          timer: 2000,
          showConfirmButton: false
        });
      }

      navigate('/supervisor/reporte-sectorial');
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Error al procesar',
        text: err.response?.data?.mensaje || 'Hubo un error al guardar el reporte.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <span className="text-gray-500 text-sm ml-3">Cargando datos del reporte...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/supervisor/reporte-sectorial')}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {id ? 'Editar Reporte Sectorial' : 'Nuevo Reporte Sectorial'}
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Llene la información de su sector correspondiente a la semana.
          </p>
        </div>
      </div>

      <form className="space-y-6">
        {/* Fechas de la semana */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-500" /> Período del Reporte
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="semanaDesde" className="block text-xs font-semibold text-gray-600 mb-1.5">Semana Desde *</label>
              <input
                type="date"
                id="semanaDesde"
                name="semanaDesde"
                value={formData.semanaDesde}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-indigo-400 outline-none transition-all"
                required
              />
            </div>
            <div>
              <label htmlFor="semanaHasta" className="block text-xs font-semibold text-gray-600 mb-1.5">Semana Hasta *</label>
              <input
                type="date"
                id="semanaHasta"
                name="semanaHasta"
                value={formData.semanaHasta}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-indigo-400 outline-none transition-all"
                required
              />
            </div>
          </div>
        </div>

        {/* Vida Devocional */}
        <Section title="Vida Devocional" icon={<Shield className="w-4 h-4" />}>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Oración personal diaria</label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                name="horasOracion"
                min="0"
                max="23"
                value={formData.horasOracion}
                onChange={handleChange}
                placeholder="Horas"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-indigo-400 outline-none transition-all"
              />
              <span className="text-xs font-bold text-gray-400">Hr</span>
              <input
                type="number"
                name="minutosOracion"
                min="0"
                max="59"
                value={formData.minutosOracion}
                onChange={handleChange}
                placeholder="Minutos"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-indigo-400 outline-none transition-all"
              />
              <span className="text-xs font-bold text-gray-400">Mn</span>
            </div>
          </div>

          <div>
            <label htmlFor="lecturaBiblia" className="block text-xs font-semibold text-gray-600 mb-1.5">Lectura Bíblica (Capítulos)</label>
            <select
              id="lecturaBiblia"
              name="lecturaBiblia"
              value={formData.lecturaBiblia}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-indigo-400 outline-none transition-all"
            >
              <option value="false">No</option>
              <option value="true">Sí</option>
            </select>
          </div>

          <div>
            <label htmlFor="ayuno" className="block text-xs font-semibold text-gray-600 mb-1.5">¿Ayunó en la semana?</label>
            <select
              id="ayuno"
              name="ayuno"
              value={formData.ayuno}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-indigo-400 outline-none transition-all"
            >
              <option value="false">No</option>
              <option value="true">Sí</option>
            </select>
          </div>

          <div>
            <label htmlFor="cultoLiderazgo" className="block text-xs font-semibold text-gray-600 mb-1.5">Asistió al Culto de Liderazgo</label>
            <select
              id="cultoLiderazgo"
              name="cultoLiderazgo"
              value={formData.cultoLiderazgo}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-indigo-400 outline-none transition-all"
            >
              <option value="false">No</option>
              <option value="true">Sí</option>
            </select>
          </div>

          <div>
            <label htmlFor="diezmo" className="block text-xs font-semibold text-gray-600 mb-1.5">Diezmo Mensual</label>
            <select
              id="diezmo"
              name="diezmo"
              value={formData.diezmo}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-indigo-400 outline-none transition-all"
            >
              <option value="false">No</option>
              <option value="true">Sí</option>
            </select>
          </div>
        </Section>

        {/* Atención Personalizada */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <h2 className="text-xs font-extrabold text-indigo-800 uppercase tracking-wider">Atención Personalizada</h2>
            </div>
            <button
              type="button"
              onClick={addAtencion}
              className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Añadir Atención
            </button>
          </div>
          <div className="p-5 space-y-4">
            {atenciones.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-xs flex flex-col items-center gap-2">
                <AlertCircle className="w-6 h-6 text-gray-300" />
                No hay atenciones personales añadidas.
              </div>
            ) : (
              <div className="space-y-4">
                {atenciones.map((a, idx) => (
                  <div key={idx} className="p-4 border border-gray-100 bg-gray-50/50 rounded-xl relative space-y-3">
                    <button
                      type="button"
                      onClick={() => removeAtencion(idx)}
                      className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors"
                      title="Eliminar atención"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="text-xs font-bold text-indigo-600 mb-1">Registro #{idx + 1}</div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1">Líder / Miembro del Alma *</label>
                        <input
                          type="text"
                          required
                          value={a.lider}
                          onChange={e => handleAtencionChange(idx, 'lider', e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg text-xs bg-white focus:ring-1 focus:ring-indigo-400 outline-none"
                          placeholder="Nombre del líder o miembro"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1">Lugar de Atención</label>
                        <select
                          value={a.lugar}
                          onChange={e => handleAtencionChange(idx, 'lugar', e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg text-xs bg-white focus:ring-1 focus:ring-indigo-400 outline-none"
                        >
                          <option value="CASA">CASA</option>
                          <option value="TEMPLO">TEMPLO</option>
                          <option value="OTRO LUGAR">OTRO LUGAR</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">Fecha</label>
                          <input
                            type="date"
                            value={a.fecha}
                            onChange={e => handleAtencionChange(idx, 'fecha', e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg text-xs bg-white focus:ring-1 focus:ring-indigo-400 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">Hora</label>
                          <input
                            type="text"
                            value={a.hora}
                            onChange={e => handleAtencionChange(idx, 'hora', e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg text-xs bg-white focus:ring-1 focus:ring-indigo-400 outline-none"
                            placeholder="Ej. 18:30"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1">Motivo</label>
                        <input
                          type="text"
                          value={a.motivo}
                          onChange={e => handleAtencionChange(idx, 'motivo', e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg text-xs bg-white focus:ring-1 focus:ring-indigo-400 outline-none"
                          placeholder="Detallar el motivo..."
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1">Resultado</label>
                        <input
                          type="text"
                          value={a.resultado}
                          onChange={e => handleAtencionChange(idx, 'resultado', e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg text-xs bg-white focus:ring-1 focus:ring-indigo-400 outline-none"
                          placeholder="Resultados obtenidos..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Reunión de Planificación */}
        <Section title="Supervisando la Reunión de Planificación" icon={<Home className="w-4 h-4" />} cols="grid-cols-1 md:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Grupo Visitado</label>
            <select
              name="planificacionGrupo"
              value={formData.planificacionGrupo}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-indigo-400 outline-none transition-all"
            >
              <option value="">Selecciona un grupo...</option>
              {gruposSector.map(g => (
                <option key={g.id} value={g.nombre}>{g.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Fecha</label>
            <input
              type="date"
              name="planificacionFecha"
              value={formData.planificacionFecha}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-indigo-400 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Hora de Llegada</label>
            <input
              type="text"
              name="planificacionHora"
              value={formData.planificacionHora}
              onChange={handleChange}
              placeholder="Ej. 19:30"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-indigo-400 outline-none transition-all"
            />
          </div>
          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Aspectos Positivos de la Reunión</label>
            <textarea
              name="planificacionPositivos"
              value={formData.planificacionPositivos}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-indigo-400 outline-none transition-all resize-none"
              placeholder="Describa los aspectos positivos observados..."
            />
          </div>
          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Aspectos Débiles de la Reunión</label>
            <textarea
              name="planificacionNegativos"
              value={formData.planificacionNegativos}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-indigo-400 outline-none transition-all resize-none"
              placeholder="Describa los aspectos débiles observados..."
            />
          </div>
        </Section>

        {/* Reunión Evangelística */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-indigo-600" />
              <h2 className="text-xs font-extrabold text-indigo-800 uppercase tracking-wider">Supervisando la Reunión Evangelística</h2>
            </div>
            <button
              type="button"
              onClick={addSupervision}
              className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Añadir Reunión
            </button>
          </div>
          <div className="p-5 space-y-4">
            {supervisiones.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-xs flex flex-col items-center gap-2">
                <AlertCircle className="w-6 h-6 text-gray-300" />
                No hay supervisiones de reuniones evangelísticas añadidas.
              </div>
            ) : (
              <div className="space-y-4">
                {supervisiones.map((s, idx) => (
                  <div key={idx} className="p-4 border border-gray-100 bg-gray-50/50 rounded-xl relative space-y-3">
                    <button
                      type="button"
                      onClick={() => removeSupervision(idx)}
                      className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors"
                      title="Eliminar registro"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="text-xs font-bold text-indigo-600 mb-1">Registro #{idx + 1}</div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1">Grupo Visitado *</label>
                        <select
                          required
                          value={s.grupoId}
                          onChange={e => handleSupervisionChange(idx, 'grupoId', e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg text-xs bg-white focus:ring-1 focus:ring-indigo-400 outline-none"
                        >
                          <option value="">Selecciona un grupo...</option>
                          {gruposSector.map(g => (
                            <option key={g.id} value={g.id}>{g.nombre}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1">Fecha</label>
                        <input
                          type="date"
                          value={s.fecha}
                          onChange={e => handleSupervisionChange(idx, 'fecha', e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg text-xs bg-white focus:ring-1 focus:ring-indigo-400 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1">Hora de llegada</label>
                        <input
                          type="text"
                          value={s.hora}
                          onChange={e => handleSupervisionChange(idx, 'hora', e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg text-xs bg-white focus:ring-1 focus:ring-indigo-400 outline-none"
                          placeholder="Ej. 19:15"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1">Aspectos Positivos de la Reunión</label>
                        <textarea
                          rows={2}
                          value={s.positivos}
                          onChange={e => handleSupervisionChange(idx, 'positivos', e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg text-xs bg-white focus:ring-1 focus:ring-indigo-400 outline-none resize-none"
                          placeholder="Aspectos positivos..."
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1">Aspectos Débiles de la Reunión</label>
                        <textarea
                          rows={2}
                          value={s.negativos}
                          onChange={e => handleSupervisionChange(idx, 'negativos', e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg text-xs bg-white focus:ring-1 focus:ring-indigo-400 outline-none resize-none"
                          placeholder="Aspectos débiles..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Evaluación de Trabajo en Equipo */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <h2 className="text-xs font-extrabold text-indigo-800 uppercase tracking-wider">Evaluación de Trabajo en Equipo</h2>
          </div>
          <div className="p-5 space-y-4 divide-y divide-gray-100">
            {evaluacionesEquipo.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-xs flex flex-col items-center gap-2">
                <AlertCircle className="w-6 h-6 text-gray-300" />
                No hay grupos familiares registrados en su sector para evaluar.
              </div>
            ) : (
              evaluacionesEquipo.map((item, idx) => (
                <div key={item.grupoId} className={`pt-4 ${idx === 0 ? 'pt-0' : ''} space-y-2`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-700">{item.grupoNombre}</span>
                    <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full uppercase">Grupo Familiar</span>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-1">Fortalezas, debilidades o comentarios del grupo</label>
                    <textarea
                      rows={2}
                      value={item.evaluacion}
                      onChange={e => handleEvaluacionChange(idx, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-indigo-400 outline-none transition-all resize-none"
                      placeholder="Ingrese fortalezas, debilidades, etc. de este grupo..."
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Firma Canvas */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <SignaturePad
            value={formData.firma}
            onChange={(val) => setFormData(prev => ({ ...prev, firma: val }))}
            disabled={isSubmitting}
          />
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/supervisor/reporte-sectorial')}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors text-sm"
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          
          <button
            type="button"
            onClick={(e) => handleSubmit(e, 'save')}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl border border-indigo-200 text-indigo-700 font-semibold hover:bg-indigo-50 transition-colors flex items-center gap-2 text-sm bg-white"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar Borrador
          </button>

          <button
            type="button"
            onClick={(e) => handleSubmit(e, 'send')}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm shadow-md"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Enviar Reporte
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReporteSectorialForm;
