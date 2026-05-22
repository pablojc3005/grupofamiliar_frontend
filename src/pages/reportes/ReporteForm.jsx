import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import api from '../../utils/axios';
import Swal from 'sweetalert2';
import { Save, Users, DollarSign, Loader2, ArrowLeft, Heart, BookOpen, Home, CheckSquare } from 'lucide-react';

const INITIAL_FORM = {
  liderId: '',
  sectorId: '',
  semanaDesde: '',
  semanaHasta: '',
  // Información general
  diezmo: 'false',
  lecturaBiblia: 'false',
  visito: 'false',
  horasOracion: '',
  minutosOracion: '',
  ayuno: 'false',
  // Asistencia
  cantHermanos: '',
  cantAmigos: '',
  cantAdolescentes: '',
  // Conversiones y niños
  cantConvertidos: '',
  cantNinosCristianos: '',
  cantNinosAmigos: '',
  // Visitas
  cantVisitaConsolidacion: '',
  cantVisitaCasaDePaz: '',
  cantVisitaHogar: '',
  // Actividades espirituales
  cultoHoracion: '',
  cantHrMep: '',
  cantHrDiscipulado: '',
  cantRetiroEspiritual: '',
  cantCultoCentral: '',
  // Ofrendas
  ofrendaSabado: '',
  ofrendaNinos: '',
  ofrendaMiercoles: '',
  // Observaciones
  observaciones: '',
};

const Field = ({ label, name, value, onChange, icon, min = '0', step }) => (
  <div>
    <label htmlFor={name} className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
    <div className="relative">
      {icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
          {icon}
        </div>
      )}
      <input
        id={name}
        type="number"
        name={name}
        min={min}
        step={step}
        value={value}
        onChange={onChange}
        className={`w-full ${icon ? 'pl-9' : 'pl-3'} pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all`}
        placeholder="0"
      />
    </div>
  </div>
);

const BoolField = ({ label, name, value, onChange }) => (
  <div>
    <label htmlFor={name} className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
    <select
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all"
    >
      <option value="false">No</option>
      <option value="true">Sí</option>
    </select>
  </div>
);

const Section = ({ title, icon, children, cols = 'grid-cols-2 md:grid-cols-3' }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-3 border-b border-gray-100 flex items-center gap-2">
      <span className="text-indigo-600">{icon}</span>
      <h2 className="text-sm font-bold text-indigo-800 uppercase tracking-wide">{title}</h2>
    </div>
    <div className={`p-5 grid ${cols} gap-4`}>{children}</div>
  </div>
);

const ReporteForm = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ ...INITIAL_FORM, sectorId: user?.sectorId || '', liderId: user?.id || '' });
  const [usuarios, setUsuarios] = useState([]);
  const [sectores, setSectores] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [uRes, sRes] = await Promise.all([api.get('/usuarios'), api.get('/sectores')]);
        const dataU = Array.isArray(uRes.data?.data) ? uRes.data.data : [];
        const dataS = Array.isArray(sRes.data?.data) ? sRes.data.data : [];
        setUsuarios(dataU.filter(u => u.rol === 'LIDER'));
        setSectores(dataS);
      } catch (e) {
        console.error('Error al cargar datos remotos:', e);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'sectorId') {
      setFormData((prev) => ({ ...prev, sectorId: value, liderId: '' }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const toNum = (v) => (v === '' ? 0 : Number(v));
  const toBool = (v) => v === true || v === 'true';

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.sectorId) {
      Swal.fire({ icon: 'warning', title: 'Sin sector asignado', text: 'Por favor, selecciona un sector para el reporte.' });
      return;
    }

    if (!formData.liderId) {
      Swal.fire({ icon: 'warning', title: 'Sin Líder seleccionado', text: 'Por favor, selecciona el líder responsable del reporte.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        sectorId: formData.sectorId,
        liderId: formData.liderId,
        semanaDesde: formData.semanaDesde,
        semanaHasta: formData.semanaHasta,
        // Información general
        diezmo: toBool(formData.diezmo),
        lecturaBiblia: toBool(formData.lecturaBiblia),
        visito: toBool(formData.visito),
        horasOracion: toNum(formData.horasOracion),
        minutosOracion: toNum(formData.minutosOracion),
        ayuno: toBool(formData.ayuno),
        // Asistencia
        cantHermanos: toNum(formData.cantHermanos),
        cantAmigos: toNum(formData.cantAmigos),
        cantAdolescentes: toNum(formData.cantAdolescentes),
        cantConvertidos: toNum(formData.cantConvertidos),
        cantNinosCristianos: toNum(formData.cantNinosCristianos),
        cantNinosAmigos: toNum(formData.cantNinosAmigos),
        // Visitas
        cantVisitaConsolidacion: toNum(formData.cantVisitaConsolidacion),
        cantVisitaCasaDePaz: toNum(formData.cantVisitaCasaDePaz),
        cantVisitaHogar: toNum(formData.cantVisitaHogar),
        // Actividades espirituales
        cultoHoracion: toNum(formData.cultoHoracion),
        cantHrMep: toNum(formData.cantHrMep),
        cantHrDiscipulado: toNum(formData.cantHrDiscipulado),
        cantRetiroEspiritual: toNum(formData.cantRetiroEspiritual),
        cantCultoCentral: toNum(formData.cantCultoCentral),
        // Ofrendas
        ofrendaSabado: toNum(formData.ofrendaSabado),
        ofrendaNinos: toNum(formData.ofrendaNinos),
        ofrendaMiercoles: toNum(formData.ofrendaMiercoles),
        observaciones: formData.observaciones,
        estado: 'ENVIADO',
      };

      const res = await api.post('/reportes', payload);
      const reporteId = res.data?.data?.id;

      if (reporteId) {
        await api.patch(`/reportes/${reporteId}/enviar`);
      }

      await Swal.fire({
        icon: 'success',
        title: '¡Reporte Guardado!',
        text: 'Tu reporte ha sido enviado y registrado correctamente.',
        confirmButtonColor: '#4f46e5',
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      });

      navigate('/lider/dashboard');
    } catch (error) {
      const msg = error.response?.data?.mensaje || error.response?.data?.message || 'Hubo un problema al guardar el reporte.';
      Swal.fire({ icon: 'error', title: 'Error al guardar', text: msg, confirmButtonColor: '#4f46e5' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/lider/dashboard')}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Nuevo Reporte Semanal</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Registra la información del sector esta semana.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Información General */}
        <Section title="Información General" icon={<Users className="w-4 h-4" />} cols="grid-cols-2 md:grid-cols-3">
          {/* Sector */}
          <div className="md:col-span-1">
            <label htmlFor="sectorId" className="block text-xs font-semibold text-gray-600 mb-1.5">Sector *</label>
            <select
              id="sectorId"
              name="sectorId"
              value={formData.sectorId}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all"
              required
            >
              <option value="">Selecciona un sector...</option>
              {sectores.map(s => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>
          </div>
          {/* Líder */}
          <div className="md:col-span-2">
            <label htmlFor="liderId" className="block text-xs font-semibold text-gray-600 mb-1.5">Líder que reporta *</label>
            <select
              id="liderId"
              name="liderId"
              value={formData.liderId}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all"
              required
              disabled={!formData.sectorId}
            >
              <option value="">Selecciona un líder...</option>
              {usuarios.filter(u => u.rol === 'LIDER').map(l => (
                <option key={l.id} value={l.id}>{l.nombres} {l.apellidos}</option>
              ))}
            </select>
          </div>
          {/* Semana */}
          <div>
            <label htmlFor="semanaDesde" className="block text-xs font-semibold text-gray-600 mb-1.5">Semana Desde *</label>
            <input
              type="date"
              id="semanaDesde"
              name="semanaDesde"
              value={formData.semanaDesde}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all"
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
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all"
              required
            />
          </div>

          {/* Separador visual */}
          <div className="md:col-span-3 border-t border-dashed border-indigo-100 pt-1 -mb-1">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Vida espiritual del líder</span>
          </div>

          <BoolField label="Diezmo" name="diezmo" value={formData.diezmo} onChange={handleChange} />
          <BoolField label="Lectura Bíblica" name="lecturaBiblia" value={formData.lecturaBiblia} onChange={handleChange} />
          <BoolField label="Visitó" name="visito" value={formData.visito} onChange={handleChange} />

          {/* Oración — dos campos que visualmente se muestran como "X Hr Y Mn" */}
          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Oración — <span className="font-normal text-indigo-500">
                {toNum(formData.horasOracion) > 0 || toNum(formData.minutosOracion) > 0
                  ? `${toNum(formData.horasOracion)} Hr ${toNum(formData.minutosOracion)} Mn`
                  : 'ingresa horas y minutos'}
              </span>
            </label>
            <div className="flex gap-3">
              <div className="flex-1">
                <input
                  id="horasOracion"
                  type="number"
                  name="horasOracion"
                  min="0"
                  max="23"
                  value={formData.horasOracion}
                  onChange={handleChange}
                  className="w-full pl-3 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all"
                  placeholder="Horas"
                />
              </div>
              <div className="flex items-center text-gray-400 font-bold text-sm">Hr</div>
              <div className="flex-1">
                <input
                  id="minutosOracion"
                  type="number"
                  name="minutosOracion"
                  min="0"
                  max="59"
                  value={formData.minutosOracion}
                  onChange={handleChange}
                  className="w-full pl-3 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all"
                  placeholder="Minutos"
                />
              </div>
              <div className="flex items-center text-gray-400 font-bold text-sm">Mn</div>
            </div>
          </div>

          <BoolField label="¿Hizo Ayuno?" name="ayuno" value={formData.ayuno} onChange={handleChange} />
        </Section>

        {/* Asistencia */}
        <Section title="Asistencia" icon={<Users className="w-4 h-4" />}>
          <Field label="Hermanos" name="cantHermanos" value={formData.cantHermanos} onChange={handleChange} icon={<Users className="w-4 h-4" />} />
          <Field label="Amigos" name="cantAmigos" value={formData.cantAmigos} onChange={handleChange} icon={<Users className="w-4 h-4" />} />
          <Field label="Adolescentes" name="cantAdolescentes" value={formData.cantAdolescentes} onChange={handleChange} icon={<Users className="w-4 h-4" />} />
          <Field label="Niños Cristianos" name="cantNinosCristianos" value={formData.cantNinosCristianos} onChange={handleChange} />
          <Field label="Niños Amigos" name="cantNinosAmigos" value={formData.cantNinosAmigos} onChange={handleChange} />
          <Field label="Convertidos" name="cantConvertidos" value={formData.cantConvertidos} onChange={handleChange} icon={<Heart className="w-4 h-4" />} />
        </Section>

        {/* Visitas */}
        <Section title="Visitas" icon={<Home className="w-4 h-4" />}>
          <Field label="Visita Consolidación" name="cantVisitaConsolidacion" value={formData.cantVisitaConsolidacion} onChange={handleChange} />
          <Field label="Visita Casa de Paz" name="cantVisitaCasaDePaz" value={formData.cantVisitaCasaDePaz} onChange={handleChange} />
          <Field label="Visita Hogar" name="cantVisitaHogar" value={formData.cantVisitaHogar} onChange={handleChange} />
        </Section>

        {/* Actividades Espirituales */}
        <Section title="Actividades Espirituales" icon={<BookOpen className="w-4 h-4" />}>
          <Field label="Culto Oración" name="cultoHoracion" value={formData.cultoHoracion} onChange={handleChange} />
          <Field label="Cantidad MEP" name="cantHrMep" value={formData.cantHrMep} onChange={handleChange} />
          <Field label="Cantidad Discipulado" name="cantHrDiscipulado" value={formData.cantHrDiscipulado} onChange={handleChange} />
          <Field label="Retiro Espiritual" name="cantRetiroEspiritual" value={formData.cantRetiroEspiritual} onChange={handleChange} />
          <Field label="Culto Central" name="cantCultoCentral" value={formData.cantCultoCentral} onChange={handleChange} />
        </Section>

        {/* Ofrendas */}
        <Section title="Ofrendas (S/)" icon={<DollarSign className="w-4 h-4" />}>
          <Field label="Ofrenda Sábado" name="ofrendaSabado" value={formData.ofrendaSabado} onChange={handleChange} step="0.01" icon={<DollarSign className="w-4 h-4" />} />
          <Field label="Ofrenda Niños" name="ofrendaNinos" value={formData.ofrendaNinos} onChange={handleChange} step="0.01" icon={<DollarSign className="w-4 h-4" />} />
          <Field label="Ofrenda Miércoles" name="ofrendaMiercoles" value={formData.ofrendaMiercoles} onChange={handleChange} step="0.01" icon={<DollarSign className="w-4 h-4" />} />
        </Section>

        {/* Observaciones */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <label htmlFor="observaciones" className="block text-sm font-semibold text-gray-700 mb-2">
            Observaciones o Testimonios (Opcional)
          </label>
          <textarea
            id="observaciones"
            name="observaciones"
            rows={3}
            value={formData.observaciones}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all resize-none"
            placeholder="Escribe novedades o testimonios importantes de la reunión..."
          />
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/lider/dashboard')}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors text-sm"
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm shadow-md disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar Reporte
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReporteForm;
