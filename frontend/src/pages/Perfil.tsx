import { useState, useRef, type ChangeEvent, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import { MainLayout } from '../components/layout';

export default function Perfil() {
  const { user, setUser } = useAuth();
  const [nombre, setNombre] = useState(user?.nombre || '');
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(user?.fotoPerfil || null);
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(user?.fotoPerfil || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manejar selección de imagen
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamaño (máx 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('La imagen debe ser menor a 2MB');
      return;
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      toast.error('El archivo debe ser una imagen');
      return;
    }

    // Convertir a base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setFotoPerfil(base64String);
      setPreviewImage(base64String);
    };
    reader.readAsDataURL(file);
  };

  // Eliminar foto de perfil
  const handleRemovePhoto = () => {
    setFotoPerfil(null);
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Guardar cambios
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!nombre.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    try {
      setLoading(true);

      const updateData: { nombre?: string; fotoPerfil?: string } = {};

      // Solo enviar campos que cambiaron
      if (nombre !== user?.nombre) {
        updateData.nombre = nombre;
      }

      if (fotoPerfil !== user?.fotoPerfil) {
        updateData.fotoPerfil = fotoPerfil || '';
      }

      if (Object.keys(updateData).length === 0) {
        toast.error('No hay cambios para guardar');
        setLoading(false);
        return;
      }

      const updatedUser = await authService.updateProfile(updateData);

      // Actualizar usuario en contexto y localStorage
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));

      toast.success('Perfil actualizado exitosamente');
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      toast.error('No se pudo actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-semibold text-gray-900 mb-8 flex items-center">
          <svg className="w-8 h-8 mr-3 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Mi Perfil
        </h2>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit}>
            {/* Foto de perfil */}
            <div className="flex flex-col items-center mb-8 pb-8 border-b border-gray-200">
              <div className="relative mb-4">
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Foto de perfil"
                    className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-300">
                    <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                >
                  {previewImage ? 'Cambiar foto' : 'Subir foto'}
                </button>

                {previewImage && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium text-sm"
                  >
                    Eliminar foto
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />

              <p className="text-xs text-gray-500 mt-3">
                Formatos permitidos: JPG, PNG, GIF (máx. 2MB)
              </p>
            </div>

            {/* Información del perfil */}
            <div className="space-y-6">
              {/* Nombre */}
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre completo
                </label>
                <input
                  type="text"
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ingresa tu nombre"
                  required
                />
              </div>

              {/* Email (solo lectura) */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={user?.email || ''}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">El email no se puede modificar</p>
              </div>

              {/* Rol (solo lectura) */}
              <div>
                <label htmlFor="rol" className="block text-sm font-medium text-gray-700 mb-2">
                  Rol
                </label>
                <input
                  type="text"
                  id="rol"
                  value={user?.rol || ''}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed capitalize"
                  disabled
                />
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setNombre(user?.nombre || '');
                  setFotoPerfil(user?.fotoPerfil || null);
                  setPreviewImage(user?.fotoPerfil || null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}
