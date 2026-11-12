import { api } from "@/lib/api";
import { useEffect, useState } from "react";
import {  Navigate, Outlet  } from "react-router";

const ProtectedRoutes = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    
    const getMe = async () => {
      try {
        await api.get("/auth/me");
        setIsAuthenticated(true);
      } catch (err) {
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    getMe();
  }, []);

  if(loading) return null;

  return isAuthenticated ? <Outlet /> : <Navigate to = "/" replace />;
};

export default ProtectedRoutes;
