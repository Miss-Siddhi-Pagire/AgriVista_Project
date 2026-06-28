import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import Cookies from 'js-cookie';

const ProtectedRoute = () => {
    const token = Cookies.get('token');

    // If no token exists, the user is not authenticated
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // If token exists, allow access to the nested routes
    return <Outlet />;
};

export default ProtectedRoute;
