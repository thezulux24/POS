import React from 'react';
import { authService } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import { Crown, LogOut } from 'lucide-react';

const AdminTerminal = () => {
    const user = authService.getCurrentUser();
    const navigate = useNavigate();

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-[#0f1115] text-white flex flex-col items-center justify-center p-8">
            <div className="bg-[#1a1d23] border border-[#2d3139] rounded-2xl p-12 max-w-2xl w-full text-center space-y-6 shadow-2xl">
                <div className="bg-[#fbbf24]/10 p-4 rounded-full w-fit mx-auto">
                </div>
                <h1 className="text-4xl font-bold tracking-tight">Panel de Administración</h1>
                <p className="text-[#9ca3af] text-lg">
                    Bienvenido, <span className="text-white font-medium">{user?.nombre}</span>.
                </p>
                <div className="bg-[#2d3139]/50 border border-[#4a4f59] rounded-xl p-8 my-8">
                    <p className="text-sm font-mono text-[#6b7280] uppercase tracking-[0.2em]">Estado del Desarrollo</p>
                    <div className="mt-4 flex flex-col items-center space-y-2">
                        <div className="w-full bg-[#1a1d23] h-2 rounded-full overflow-hidden">
                            <div className="bg-[#fbbf24] h-full w-[25%]" />
                        </div>
                        <p className="text-[#fbbf24] font-medium italic">"Módulo de gestión de inventario en construcción..."</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 mx-auto text-[#ef4444] hover:bg-[#ef4444]/10 px-6 py-2 rounded-lg transition-colors"
                >
                    <LogOut size={20} />
                    Cerrar sesión
                </button>
            </div>
        </div>
    );
};

export default AdminTerminal;
