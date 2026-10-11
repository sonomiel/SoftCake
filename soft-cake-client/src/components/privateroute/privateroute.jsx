import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/useAuth";

const PrivateRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-content-center align-items-center h-screen">
        <div className="text-center">
          <i className="pi pi-spin pi-spinner text-4xl text-primary"></i>
          <p className="mt-2">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;