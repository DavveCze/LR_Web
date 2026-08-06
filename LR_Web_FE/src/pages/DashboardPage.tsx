import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ImageUploadPanel } from '../components/admin/ImageUploadPanel';
import { ImageManager } from '../components/admin/ImageManager';
import { TrainerAdminPanel } from '../components/admin/TrainerAdminPanel';
import { RegistrationManager } from '../components/admin/RegistrationManager';
import { TrainingSchedule } from '../components/schedule/TrainingSchedule';
import { TrainingScheduleAdmin } from '../components/admin/TrainingScheduleAdmin';
import { DanceAdminPanel } from '../components/admin/DanceAdminPanel';

// Typy vycházející z databáze a frontend struktury
interface RegistrationItem {
    id: number;
    category: string;
    headline: string;
    content: string;
    link: string;
    cost: string;
    isActive: boolean;
}

export const DashboardPage: React.FC = () => {  
    const navigate = useNavigate();

    const handleLogout = async () => {
        await fetch('http://localhost:8080/api/logout.php', { credentials: 'include' });
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
            </div>
        </div>
    );
}