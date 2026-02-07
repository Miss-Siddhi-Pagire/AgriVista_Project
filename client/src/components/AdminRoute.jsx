import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import url from '../url';

const AdminRoute = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(null);
    const token = Cookies.get('token');

    useEffect(() => {
        const verifyAdmin = async () => {
            if (!token) {
                setIsAuthenticated(false);
                return;
            }

            try {
                // We use a specific verification route or just try to access a protected resource
                // Since we haven't created a specific "verify me" route for admins that returns the role expressly without middleware issues in the plan,
                // we can rely on the fact that the middleware now works.
                // However, the best way is to try hitting a protected route like /stats
                const { data } = await axios.get(`${url}/api/admin/stats`, {
                    withCredentials: true,
                    // The middleware looks for check body 'tok' OR cookie 'token'/'admin_token'
                    // Axios withCredentials sends cookies. 
                });

                if (data.success) {
                    setIsAuthenticated(true);
                } else {
                    setIsAuthenticated(false);
                }
            } catch (error) {
                console.error("Admin verification failed:", error);
                setIsAuthenticated(false);
            }
        };

        verifyAdmin();
    }, [token]);

    if (isAuthenticated === null) {
        return <div>Loading...</div>; // Or a nice spinner
    }

    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default AdminRoute;
