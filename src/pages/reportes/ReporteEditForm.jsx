import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../utils/axios';
import Swal from 'sweetalert2';
import { Save, Users, DollarSign, Loader2, ArrowLeft, Heart, BookOpen, Home, AlertTriangle } from 'lucide-react';

const Field = ({ label, name, value, onChange, icon, min = '0', step, disabled }) => (
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
        disabled={disabled}
        className={`w-full ${icon ? 'pl-9' : 'pl-3'} pr-3 py-2.5 border border-gray-200 rounded-xl text-sm transition-all outline-none
          ${disabled
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-gray-50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400'}`}
        placeholder="0"
      />
    </div>
  </div>
);

const Section = ({ title, icon, children }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-3 border-b border-gray-100 flex items-center gap-2">
      <span className="text-indigo-600">{icon}</span>
      <h2 className="text-sm font-bold text-indigo-800 uppercase tracking-wide">{title}</h2>
    </div>
    <div className="p-5 grid grid-cols-2 md:grid-cols-3 gap-4">{children}</div>
  </div>
);

const ReporteEditForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [reporte, setReporte] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await api.get(`/reportes/${id}`);
        const data = res.data?.data;
        if (!data) throw new Error('No se encontró el reporte');
        setReporte(data);
        setFormData({
          cantHermanos: data.cantHermanos ?? 0,
          cantAmigos: data.cantAmigos ?? 0,
          cantAdolescentes: data.cantAdolescentes ?? 0,
          cantConvertidos: data.cantConvertidos ?? 0,
          cantNinosCristianos: data.cantNinosCristianos ?? 0,
          cantNinosAmigos: data.cantNinosAmigos ?? 0,
          cantVisitaConsolidacion: data.cantVisitaConsolidacion ?? 0,
          cantVisitaCasaDePaz: data.cantVisitaCasaDePaz ?? 0,
          cantVisitaHogar: data.cantVisitaHogar ?? 0,
          cantHrOracion: data.cantHrOracion ?? 0,
          cantHrMep: data.cantHrMep ?? 0,
          cantHrDiscipulado: data.cantHrDiscipulado ?? 0,
          cantRetiroEspiritual: data.cantRetiroEspiritual ?? 0,
          tiempoOracion: data.tiempoOracion ?? 0,
          ayuno: data.ayuno ?? false,
          ofrendaSabado: data.ofrendaSabado ?? 0,
          ofrendaNinos: data.ofrendaNinos ?? 0,
          ofrendaMiercoles: data.ofrendaMiercoles ?? 0,
          observaciones: data.observaciones ?? '',
        });
      } catch (e) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo cargar el reporte.' });
        navigate('/lider/dashboard');
      } finally {
        setIsLoading(false);
      }
    };
    cargar();
  }, [id]);

  const isBloqueado = reporte && reporte.estado !== 'ENVIADO';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toNum = (v) => (v === '' ? 0 : Number(v));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isBloqueado) return;

    setIsSubmitting(true);
    try {
      const payload = {
        cantHermanos: toNum(formData.cantHermanos),
        cantAmigos: toNum(formData.cantAmigos),
        cantAdolescentes: toNum(formData.cantAdolescentes),
        cantConvertidos: toNum(formData.cantConvertidos),
        cantNinosCristianos: toNum(formData.cantNinosCristianos),
        cantNinosAmigos: toNum(formData.cantNinosAmigos),
        cantVisitaConsolidacion: toNum(formData.cantVisitaConsolidacion),
        cantVisitaCasaDePaz: toNum(formData.cantVisitaCasaDePaz),
        cantVisitaHogar: toNum(formData.cantVisitaHogar),
        cantHrOracion: toNum(formData.cantHrOracion),
        cantHrMep: toNum(formData.cantHrMep),
        cantHrDiscipulado: toNum(formData.cantHrDiscipulado),
        cantRetiroEspiritual: toNum(formData.cantRetiroEspiritual),
        tiempoOracion: toNum(formData.tiempoOracion),
        ayuno: Boolean(formData.ayuno === true || formData.ayuno === 'true'),
        ofrendaSabado: toNum(formData.ofrendaSabado),
        ofrendaNinos: toNum(formData.ofrendaNinos),
        ofrendaMiercoles: toNum(formData.ofrendaMiercoles),
        observaciones: formData.observaciones,
      };

      await api.put(`/reportes/${id}`, payload);

      await Swal.fire({
        icon: 'success',
        title: '¡Reporte Actualizado!',
        text: 'Los cambios han sido guardados correctamente.',
        confirmButtonColor: '#4f46e5',
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      });
      navigate('/lider/dashboard');
    } catch (error) {
      const msg = error.response?.data?.mensaje || 'Hubo un problema al actualizar el reporte.';
      Swal.fire({ icon: 'error', title: 'Error al guardar', text: msg, confirmButtonColor: '#4f46e5' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-gray-800">Editar Reporte Semanal</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Semana: <span className="font-semibold text-gray-700">{reporte?.semanaDesde}</span> al <span className="font-semibold text-gray-700">{reporte?.semanaHasta}</span>
            {' · '}<span className="text-gray-400">{reporte?.sectorNombre}</span>
          </p>
        </div>
      </div>

      {/* Aviso si está bloqueado */}
      {isBloqueado && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl px-5 py-4">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">
            Este reporte está en estado <strong>{reporte.estado}</strong> y no puede ser modificado.
            Solo los reportes en estado <strong>ENVIADO</strong> pueden editarse.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Asistencia */}
        <Section title="Asistencia" icon={<Users className="w-4 h-4" />}>
          <Field label="Hermanos" name="cantHermanos" value={formData.cantHermanos} onChange={handleChange} icon={<Users className="w-4 h-4" />} disabled={isBloqueado} />
          <Field label="Amigos" name="cantAmigos" value={formData.cantAmigos} onChange={handleChange} icon={<Users className="w-4 h-4" />} disabled={isBloqueado} />
          <Field label="Adolescentes" name="cantAdolescentes" value={formData.cantAdolescentes} onChange={handleChange} icon={<Users className="w-4 h-4" />} disabled={isBloqueado} />
          <Field label="Niños Cristianos" name="cantNinosCristianos" value={formData.cantNinosCristianos} onChange={handleChange} disabled={isBloqueado} />
          <Field label="Niños Amigos" name="cantNinosAmigos" value={formData.cantNinosAmigos} onChange={handleChange} disabled={isBloqueado} />
          <Field label="Convertidos" name="cantConvertidos" value={formData.cantConvertidos} onChange={handleChange} icon={<Heart className="w-4 h-4" />} disabled={isBloqueado} />
        </Section>

        {/* Visitas */}
        <Section title="Visitas" icon={<Home className="w-4 h-4" />}>
          <Field label="Visita Consolidación" name="cantVisitaConsolidacion" value={formData.cantVisitaConsolidacion} onChange={handleChange} disabled={isBloqueado} />
          <Field label="Visita Casa de Paz" name="cantVisitaCasaDePaz" value={formData.cantVisitaCasaDePaz} onChange={handleChange} disabled={isBloqueado} />
          <Field label="Visita Hogar" name="cantVisitaHogar" value={formData.cantVisitaHogar} onChange={handleChange} disabled={isBloqueado} />
        </Section>

        {/* Actividades Espirituales */}
        <Section title="Actividades Espirituales" icon={<BookOpen className="w-4 h-4" />}>
          <Field label="Horas de Oración" name="cantHrOracion" value={formData.cantHrOracion} onChange={handleChange} disabled={isBloqueado} />
          <Field label="Horas MEP" name="cantHrMep" value={formData.cantHrMep} onChange={handleChange} disabled={isBloqueado} />
          <Field label="Horas Discipulado" name="cantHrDiscipulado" value={formData.cantHrDiscipulado} onChange={handleChange} disabled={isBloqueado} />
          <Field label="Retiro Espiritual" name="cantRetiroEspiritual" value={formData.cantRetiroEspiritual} onChange={handleChange} disabled={isBloqueado} />
          <Field label="Tiempo Oración (min)" name="tiempoOracion" value={formData.tiempoOracion} onChange={handleChange} disabled={isBloqueado} />
          <div>
            <label htmlFor="ayuno" className="block text-xs font-semibold text-gray-600 mb-1.5">¿Hizo Ayuno?</label>
            <select
              id="ayuno"
              name="ayuno"
              value={formData.ayuno}
              onChange={handleChange}
              disabled={isBloqueado}
              className={`w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none transition-all
                ${isBloqueado ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-50 hover:bg-white focus:ring-2 focus:ring-indigo-400'}`}
            >
              <option value="false">No</option>
              <option value="true">Sí</option>
            </select>
          </div>
        </Section>

        {/* Ofrendas */}
        <Section title="Ofrendas (S/)" icon={<DollarSign className="w-4 h-4" />}>
          <Field label="Ofrenda Sábado" name="ofrendaSabado" value={formData.ofrendaSabado} onChange={handleChange} step="0.01" icon={<DollarSign className="w-4 h-4" />} disabled={isBloqueado} />
          <Field label="Ofrenda Niños" name="ofrendaNinos" value={formData.ofrendaNinos} onChange={handleChange} step="0.01" icon={<DollarSign className="w-4 h-4" />} disabled={isBloqueado} />
          <Field label="Ofrenda Miércoles" name="ofrendaMiercoles" value={formData.ofrendaMiercoles} onChange={handleChange} step="0.01" icon={<DollarSign className="w-4 h-4" />} disabled={isBloqueado} />
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
            disabled={isBloqueado}
            className={`w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none transition-all resize-none
              ${isBloqueado ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-indigo-400'}`}
            placeholder="Escribe novedades o testimonios importantes..."
          />
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/lider/dashboard')}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors text-sm"
          >
            Cancelar
          </button>
          {!isBloqueado && (
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm shadow-md disabled:opacity-60"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Guardar Cambios
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ReporteEditForm;
