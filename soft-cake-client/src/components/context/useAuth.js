import { useState } from "react";
import axios from "axios";
import { usePermisos } from "./permisoscontext";

export const useAuth = () => {
  const {
    login: loginPermisos,
    logout: logoutPermisos,
    usuario,
  } = usePermisos();

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const login = async (username, password) => {
    setLoading(true);
    setError(null);

    try {
      const API_URL = import.meta.env.VITE_API_URL;
      if (!API_URL) throw new Error("URL de API no configurada");

      const response = await axios.post(
        `${API_URL}catalogos/us/VALIDAR.php`,
        { username: username.trim(), password },
        {
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          timeout: 15000,
        }
      );

      const data = response.data;

      // ✅ El PHP ya maneja todo — solo verificar success
      if (!data.success) {
        throw new Error(data.mensaje || "Error en la autenticación");
      }

      loginPermisos(data);
      return { success: true, data };

    } catch (err) {
      let errorMessage = "Error al iniciar sesión";

      if (err.response) {
        errorMessage =
          err.response.data?.mensaje ||
          err.response.data?.error ||
          `Error ${err.response.status}: ${err.response.statusText}`;
      } else if (err.request) {
        errorMessage = "Error de conexión. Verifica tu internet o contacta al administrador.";
      } else {
        errorMessage = err.message;
      }

      setError(errorMessage);
      return { success: false, error: errorMessage };

    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    logoutPermisos();
    setError(null);
  };

  const isAuthenticated = !!usuario;
  const clearError = () => setError(null);

  return {
    usuario,
    loading,
    error,
    login,
    logout,
    isAuthenticated,
    clearError,
  };
};