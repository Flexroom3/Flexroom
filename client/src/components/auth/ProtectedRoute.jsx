import React from 'react';
import { Navigate } from 'react-router-dom';

export function getStoredUser() {
    try {
        const raw = sessionStorage.getItem('flexroom_user');
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

const ProtectedRoute = ({ role, children }) => {
    const token = sessionStorage.getItem('flexroom_token');
    const user = getStoredUser();

    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }
    if (user.role !== role) {
        return <Navigate to={user.role === 'evaluator' ? '/evaluator' : '/student'} replace />;
    }
    return children;
};

export default ProtectedRoute;
