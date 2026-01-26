import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, FileText, Activity, Droplets, Trash2 } from 'lucide-react';

const AdminDashboard = () => {
    const [stats, setStats] = useState({ users: 0, posts: 0, yield: 0, fertilizer: 0 });
    const [users, setUsers] = useState([]);
    const token = localStorage.getItem("adminToken"); // Assumes you store token on login

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const config = { data: { tok: token } }; // Sending 'tok' in body as per your middleware
            
            const statsRes = await axios.get('http://localhost:7000/api/admin/stats', config);
            setStats(statsRes.data.stats);

            const usersRes = await axios.get('http://localhost:7000/api/admin/users/all', config);
            setUsers(usersRes.data.users);
        } catch (err) {
            console.error("Error fetching admin data", err);
        }
    };

    const deleteUser = async (userId) => {
        if (window.confirm("Are you sure? This will delete all farmer history.")) {
            await axios.delete(`http://localhost:7000/api/admin/users/${userId}`, { data: { tok: token } });
            fetchData();
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* Sidebar */}
            <div className="w-64 bg-green-800 text-white p-6 shadow-xl">
                <h1 className="text-2xl font-bold mb-10">AgriVista Admin</h1>
                <nav className="space-y-4">
                    <div className="flex items-center space-x-3 p-2 bg-green-700 rounded cursor-pointer">
                        <Activity size={20} /> <span>Dashboard</span>
                    </div>
                    <div className="flex items-center space-x-3 p-2 hover:bg-green-700 rounded cursor-pointer">
                        <Users size={20} /> <span>Manage Farmers</span>
                    </div>
                    <div className="flex items-center space-x-3 p-2 hover:bg-green-700 rounded cursor-pointer">
                        <FileText size={20} /> <span>Community Posts</span>
                    </div>
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-8">
                <header className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-semibold text-gray-800">System Overview</h2>
                    <button className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">Logout</button>
                </header>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                    <StatCard icon={<Users className="text-blue-600" />} label="Total Farmers" value={stats.users} />
                    <StatCard icon={<FileText className="text-orange-600" />} label="Forum Posts" value={stats.posts} />
                    <StatCard icon={<Activity className="text-green-600" />} label="Yield Queries" value={stats.yieldPredictions} />
                    <StatCard icon={<Droplets className="text-purple-600" />} label="Fertilizer Tips" value={stats.fertilizerRecords} />
                </div>

                {/* User Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="p-4 border-b bg-gray-50 font-bold">Recent Registered Farmers</div>
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-100 text-sm uppercase text-gray-600">
                                <th className="p-4">Name</th>
                                <th className="p-4">Email</th>
                                <th className="p-4">District</th>
                                <th className="p-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user._id} className="border-b hover:bg-gray-50">
                                    <td className="p-4">{user.name}</td>
                                    <td className="p-4">{user.email}</td>
                                    <td className="p-4">{user.address?.district || 'N/A'}</td>
                                    <td className="p-4 text-red-600 cursor-pointer" onClick={() => deleteUser(user._id)}>
                                        <Trash2 size={18} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ icon, label, value }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center space-x-4">
        <div className="p-3 bg-gray-100 rounded-lg">{icon}</div>
        <div>
            <p className="text-gray-500 text-sm">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
        </div>
    </div>
);

export default AdminDashboard;