import { createContext, useContext, useState, useEffect, useCallback } from "react";

const PermisosContext = createContext();
export const usePermisos = () => useContext(PermisosContext);

export const PermisosProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(null);
  const [idsModulos, setIdsModulos] = useState([]);
  const [idsPermisos, setIdsPermisos] = useState([]);
  const [idsRoles, setIdsRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [miTabId] = useState(() => crypto.randomUUID());

  // ✅ Extraído como función reutilizable para usarla también en el listener
  const cargarDesdeSessionStorage = useCallback(() => {
    const loginData = JSON.parse(sessionStorage.getItem("login") || "{}");

    if (!loginData.token || loginData.tabId !== miTabId) {
      setToken(null);
      setUsuario(null);
      setIdsModulos([]);
      setIdsPermisos([]);
      sessionStorage.removeItem("login");
      setLoading(false);
      return;
    }

    setToken(loginData.token);
    setUsuario(loginData.usuario || null);
    setIdsModulos(loginData.ids_modulos || []);
    setIdsPermisos(loginData.ids_permisos || []);
    setIdsRoles(loginData.ids_roles || []);
    setLoading(false);
  }, [miTabId]);

  useEffect(() => {
    cargarDesdeSessionStorage();

    // ✅ Escuchar cambios externos en el sessionStorage
    window.addEventListener("storage", cargarDesdeSessionStorage);
    return () => window.removeEventListener("storage", cargarDesdeSessionStorage);
  }, [cargarDesdeSessionStorage]);

  const login = (data) => {
    const userData = data.data;

    const usuarioInfo = {
      id:            userData.id_usuario  || null,
      id_emisor:     userData.id_emisor   || null,
      id_usuario:     userData.id_usuario || null,
      username:      userData.username    || null,
      nombre_emisor: userData.nombre      || null,  // ✅ campo nombre de m_datos_emisor
      domicilio:     userData.domicilio   || null,
      telefono:      userData.telefono    || null,
      logo:          userData.logo        || null,
      dias_restantes:  userData.dias_restantes ?? null,
    };

    // ✅ Tu SP devuelve GROUP_CONCAT como strings: "1,2,3" → convertir a arrays de números
    const parsearIds = (valor) =>
      valor ? String(valor).split(",").map(Number).filter(Boolean) : [];

    const modulos  = parsearIds(userData.ids_modulos);
    const permisos = parsearIds(userData.ids_permisos);
    const roles = parsearIds(userData.ids_roles);

    setToken(data.token);
    setUsuario(usuarioInfo);
    setIdsModulos(modulos);
    setIdsPermisos(permisos);
    setIdsRoles(roles);

    sessionStorage.setItem(
      "login",
      JSON.stringify({
        token:        data.token,
        tabId:        miTabId,
        usuario:      usuarioInfo,
        ids_modulos:  modulos,
        ids_permisos: permisos,
        ids_roles: roles
      })
    );
  };

  const logout = () => {
    setToken(null);
    setUsuario(null);
    setIdsModulos([]);
    setIdsPermisos([]);
    setIdsRoles([]);
    sessionStorage.removeItem("login");
  };

  const tienePermiso  = (permisoRequerido) => idsPermisos.includes(Number(permisoRequerido));
  const tieneModulo   = (moduloRequerido)  => idsModulos.includes(Number(moduloRequerido));
  const tieneRol  = (rolRequerido) => idsRoles.includes(Number(rolRequerido));


  const tienePermisoEnModulo = (permisoRequerido, moduloRequerido) =>
    tieneModulo(moduloRequerido) && tienePermiso(permisoRequerido);

  // ✅ Corregido: devuelve solo los permisos si el módulo existe, array vacío si no
  const obtenerPermisosDeModulo = (moduloRequerido) =>
    tieneModulo(moduloRequerido) ? idsPermisos : [];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-2">Cargando permisos...</p>
        </div>
      </div>
    );
  }

  return (
    <PermisosContext.Provider
      value={{
        usuario,
        token,
        idsModulos,
        idsPermisos,
        idsRoles,
        login,
        logout,
        tienePermiso,
        tienePermisoEnModulo,
        tieneRol,
        obtenerPermisosDeModulo,
        tieneModulo,
        loading,
      }}
    >
      {children}
    </PermisosContext.Provider>
  );
};
