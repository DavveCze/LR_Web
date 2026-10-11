import React from 'react';
import { useNavigate } from 'react-router-dom';
import { apiUrl } from '../api/client';
import { ImageUploadPanel } from '../components/admin/ImageUploadPanel';
import { ImageManager } from '../components/admin/ImageManager';
import { TrainerAdminPanel } from '../components/admin/TrainerAdminPanel';
import { RegistrationManager } from '../components/admin/RegistrationManager';
import { TrainingScheduleAdmin } from '../components/admin/TrainingScheduleAdmin';
import { DanceAdminPanel } from '../components/admin/DanceAdminPanel';
import { CarmenAdminPanel } from '../components/admin/CarmenAdminPanel';
import { PartnersSection } from '../components/ui/PartnersSection';

export const DashboardPage: React.FC = () => {  
    const navigate = useNavigate();

    const handleLogout = async () => {
        await fetch(apiUrl('logout.php'), { credentials: 'include' });
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
                    <button 
                        onClick={handleLogout}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded shadow"
                    >
                        Odhlásit se
                    </button>
                </div>

                <div className="mb-8">
                    <ImageUploadPanel />

                    <ImageManager />
                </div>

                <div className="mb-8">
                    <TrainerAdminPanel />
                </div>

                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Registrace</h2>
                    <RegistrationManager />
                </div>

                <div className="mb-8">
                    <TrainingScheduleAdmin />
                </div>

                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Tréninkový rozvrh</h2>
                    <DanceAdminPanel />
                </div>

                <div className="mb-8">
                    <CarmenAdminPanel />
                </div>

                <div className="mb-8 bg-white p-6 rounded-lg shadow-sm">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Správa partnerů a dotačních popisků</h2>
                    <p className="text-sm text-gray-600 mb-6">
                        Zde můžete upravovat loga partnerů, jejich pozici i speciální textové deklarace dotací.
                    </p>
                    <PartnersSection editable={true} />
                </div>
            </div>
        </div>
    );
}