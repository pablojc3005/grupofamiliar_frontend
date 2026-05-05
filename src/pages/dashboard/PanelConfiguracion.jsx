import { useState, useRef } from 'react';
import Swal from 'sweetalert2';
import { ImagePlus, Trash2, CheckCircle } from 'lucide-react';
import logoDefault from '../../assets/logo_asambleas.png';

const PanelConfiguracion = () => {
  const [preview, setPreview] = useState(localStorage.getItem('loginLogo') || logoDefault);
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      Swal.fire({ icon: 'warning', title: 'Formato inválido', text: 'Solo se permiten imágenes (PNG, JPG, etc.).' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreview(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const guardar = () => {
    localStorage.setItem('loginLogo', preview);
    Swal.fire({ icon: 'success', title: 'Logo actualizado', text: 'El logo del login se ha actualizado. Se verá reflejado al recargar la página de login.', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });
  };

  const restaurar = () => {
    localStorage.removeItem('loginLogo');
    setPreview(logoDefault);
    Swal.fire({ icon: 'info', title: 'Logo restaurado', text: 'Se ha restaurado el logo predeterminado.', toast: true, position: 'top-end', timer: 2500, showConfirmButton: false });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-gray-800 mb-1">Logo del Login</h3>
        <p className="text-sm text-gray-500">Configura la imagen que se muestra en la pantalla de inicio de sesión.</p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-8">
        {/* Preview */}
        <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 rounded-2xl p-8 flex flex-col items-center justify-center min-w-[220px] min-h-[200px] shadow-lg">
          <img src={preview} alt="Preview Logo" className="h-28 w-auto drop-shadow-2xl mb-3"
            onError={(e) => { e.target.src = logoDefault; }} />
          <p className="text-white text-sm font-bold">Grupo Familiar AD</p>
          <p className="text-indigo-200 text-xs">Vista previa del login</p>
        </div>

        {/* Controls */}
        <div className="space-y-4 flex-1">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Seleccionar nueva imagen</label>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer" />
            <p className="text-xs text-gray-400 mt-1">Formatos: PNG, JPG, SVG. Recomendado: fondo transparente.</p>
          </div>

          <div className="flex gap-3">
            <button onClick={guardar}
              className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm">
              <CheckCircle className="w-4 h-4" /> Guardar Logo
            </button>
            <button onClick={restaurar}
              className="flex items-center gap-2 border border-gray-200 text-gray-600 px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
              <Trash2 className="w-4 h-4" /> Restaurar Original
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PanelConfiguracion;
