import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, LogIn, AlertCircle, ShoppingCart } from 'lucide-react';
import { authService } from '../services/authService';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const data = await authService.login(email, password);
            if (data.user.rol === 'ADMIN') {
                navigate('/admin');
            } else {
                navigate('/vendor');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    const quickAccess = (roleEmail) => {
        setEmail(roleEmail);
        setPassword('test123');
    };

    return (
        <div className="pos-container">
            {/* Background Decor */}
            <div className="blob blob-blue" />
            <div className="blob blob-purple" />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="glass-card"
            >
                <div className="card-header">
                    <motion.div
                        initial={{ scale: 0.5, rotate: -10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.2 }}
                        className="logo-container"
                    >
                        <img src="/images/image.png" alt="ZMGI Logo" className="logo-image" />
                    </motion.div>
                    <h1 className="app-title">ZMGI.POS</h1>
                    <p className="app-subtitle">sistema de punto de venta</p>
                </div>

                <form onSubmit={handleLogin} className="login-form">
                    <div className="form-group">
                        <span className="label">Correo Institucional</span>
                        <div className="input-wrapper">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="pos-input"
                                placeholder="usuario@negocio.com"
                                required
                            />
                            <Mail className="input-icon" size={18} />
                        </div>
                    </div>

                    <div className="form-group">
                        <span className="label">Contraseña</span>
                        <div className="input-wrapper">
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pos-input"
                                placeholder="••••••••"
                                required
                            />
                            <Lock className="input-icon" size={18} />
                        </div>
                    </div>

                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0, y: -10 }}
                                animate={{ opacity: 1, height: 'auto', y: 0 }}
                                exit={{ opacity: 0, height: 0, y: -10 }}
                                className="error-box"
                            >
                                <AlertCircle size={16} />
                                <span>{error}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button
                        type="submit"
                        disabled={loading}
                        className="pos-button"
                    >
                        {loading ? (
                            <div className="spinner" />
                        ) : (
                            <>
                                <span>Iniciar Sesión</span>
                                <LogIn size={18} />
                            </>
                        )}
                    </button>
                </form>

                <div className="demo-section">
                    <div className="demo-divider">
                        <div className="line" />
                        <span className="demo-text">Acceso Rápido</span>
                        <div className="line" />
                    </div>
                    <div className="demo-buttons">
                        <button
                            type="button"
                            className="demo-btn"
                            onClick={() => quickAccess('admin@pos.com')}
                        >
                            ADMIN
                        </button>
                        <button
                            type="button"
                            className="demo-btn"
                            onClick={() => quickAccess('vendedor@pos.com')}
                        >
                            VENDEDOR
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
