import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

export const ProtectedRoute: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
        // Zkontroluje session na backendu
        fetch('http://localhost:8080/api/check-auth.php', {
            credentials: 'include',
        })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') {
                    setIsAuthenticated(true);
                } else {
                    setIsAuthenticated(false);
                }
            })
            .catch(() => setIsAuthenticated(false));
    }, []);

    if (isAuthenticated === null) {
        return <div className="flex justify-center items-center h-screen">Ověřování přístupu...</div>;
    }

    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};