import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiUrl } from '../api/client';
import { ImageUploadPanel } from '../components/admin/ImageUploadPanel';
import { ImageManager } from '../components/admin/ImageManager';
import { TrainerAdminPanel } from '../components/admin/TrainerAdminPanel';
import { RegistrationManager } from '../components/admin/RegistrationManager';
import { TrainingScheduleAdmin } from '../components/admin/TrainingScheduleAdmin';
import { DanceAdminPanel } from '../components/admin/DanceAdminPanel';
import { CarmenAdminPanel } from '../components/admin/CarmenAdminPanel';
import { NewsManager } from '../components/admin/NewsManager';
import { TrainingLocationsAdmin } from '../components/admin/TrainingLocationsAdmin';
import { PartnersSection } from '../components/ui/PartnersSection';

export const DashboardPage: React.FC = () => {  
    const navigate = useNavigate();
    const [role, setRole] = useState<'admin' | 'owner'>(() => {
        const stored = localStorage.getItem('user_role');
        return stored === 'owner' ? 'owner' : 'admin';
    });

    useEffect(() => {
        const stored = localStorage.getItem('user_role');
        if (stored === 'owner' || stored === 'admin') {
            setRole(stored);
        }
    }, []);

    const isOwner = role === 'owner';

    const handleLogout = async () => {
        try {
            await fetch(apiUrl('logout.php'), { credentials: 'include' });
        } catch {
            // Ignore if backend is offline
        }
        localStorage.removeItem('user_role');
        localStorage.removeItem('convex_auth_token');
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-gray-800">
                            {isOwner ? 'Správa TŠ Carmen a přihlášek' : 'Admin Dashboard'}
                        </h1>
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full uppercase tracking-wider ${
                            isOwner ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                            {isOwner ? 'Majitel (Owner)' : 'Administrátor'}
                        </span>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded shadow transition-colors cursor-pointer"
                    >
                        Odhlásit se
                    </button>
                </div>

                {!isOwner && (
                    <>
                        <div className="mb-8">
                            <ImageUploadPanel />
                            <ImageManager />
                        </div>

                        <div className="mb-8">
                            <TrainerAdminPanel />
                        </div>
                    </>
                )}

                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Správa přihlášek</h2>
                    <RegistrationManager />
                </div>

                {!isOwner && (
                    <>
                        <div className="mb-8">
                            <NewsManager />
                        </div>

                        <div className="mb-8">
                            <TrainingLocationsAdmin />
                        </div>

                        <div className="mb-8">
                            <TrainingScheduleAdmin />
                        </div>

                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-800 mb-4">Tréninkový rozvrh</h2>
                            <DanceAdminPanel />
                        </div>
                    </>
                )}

                <div className="mb-8">
                    <CarmenAdminPanel />
                </div>

                {!isOwner && (
                    <div className="mb-8 bg-white p-6 rounded-lg shadow-sm">
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Správa partnerů a dotačních popisků</h2>
                        <p className="text-sm text-gray-600 mb-6">
                            Zde můžete upravovat loga partnerů, jejich pozici i speciální textové deklarace dotací.
                        </p>
                        <PartnersSection editable={true} />
                    </div>
                )}
            </div>
        </div>
    );
};