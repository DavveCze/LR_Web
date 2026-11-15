import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { convex } from '../convex';
import { apiUrl } from '../api/client';

export const ProtectedRoute: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(() => {
    const convexToken = localStorage.getItem('convex_auth_token') || sessionStorage.getItem('convex_auth_token');
    if (convex && convexToken) return true;

    const localRole = localStorage.getItem('user_role');
    if (localRole === 'admin' || localRole === 'owner') return true;

    return null;
  });

  useEffect(() => {
    if (isAuthenticated !== null) return;

    fetch(apiUrl('check-auth.php'), {
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => {
        setIsAuthenticated(data.status === 'success');
      })
      .catch(() => setIsAuthenticated(false));
  }, [isAuthenticated]);

  if (isAuthenticated === null) {
    return (
      <div className="flex justify-center items-center h-screen bg-neutral-900 text-white">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          <span>Ověřování přístupu...</span>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};
