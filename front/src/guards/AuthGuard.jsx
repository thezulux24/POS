import { Navigate } from 'react-router-dom';
import { authService } from '../services/authService';

export const AuthGuard = ({ children, allowedRoles }) => {
    const user = authService.getCurrentUser();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.rol)) {
        // Redirect based on role if they are in the wrong place
        const redirectPath = user.rol === 'ADMIN' ? '/admin' : '/vendor';
        return <Navigate to={redirectPath} replace />;
    }

    return children;
};
