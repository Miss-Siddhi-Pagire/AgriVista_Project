import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import url from "../url";
import toast, { Toaster } from "react-hot-toast";

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("overview");
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [posts, setPosts] = useState([]); // Forum posts
    const [trends, setTrends] = useState([]); // Market Trends
    const [loading, setLoading] = useState(true);

    // Trend Form State
    const [trendForm, setTrendForm] = useState({ title: "", description: "", category: "Trend" });
    const [trendImage, setTrendImage] = useState(null); // File object
    const [editingTrendId, setEditingTrendId] = useState(null); // ID if editing

    // User Detail Modal State
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [userDetails, setUserDetails] = useState(null);
    const [detailTab, setDetailTab] = useState("yield"); // yield, fertilizer, crops, posts

    // Colors from the design system
    const colors = {
        primaryGreen: "#6A8E23", // Olive Green
        deepGreen: "#4A6317",
        creamBg: "#F9F8F3",
        white: "#ffffff",
        textDark: "#2C3322",
        danger: "#d32f2f",
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Stats
            const statsRes = await axios.get(`${url}/api/admin/stats`, { withCredentials: true });
            if (statsRes.data.success) setStats(statsRes.data.stats);

            // 2. Fetch Users
            const usersRes = await axios.get(`${url}/api/admin/users/all`, { withCredentials: true });
            if (usersRes.data.success) setUsers(usersRes.data.users);

            // 3. Fetch Posts (Forum)
            const postsRes = await axios.get(`${url}/api/admin/posts/all`, { withCredentials: true });
            if (postsRes.data.success) setPosts(postsRes.data.posts);

            // 4. Fetch Market Trends
            const trendsRes = await axios.get(`${url}/trends/all`); // Public route but ok to use here
            if (trendsRes.data.success) setTrends(trendsRes.data.trends);

        } catch (error) {
            console.error("Error fetching admin data", error);
            toast.error("Failed to load dashboard data");
            if (error.response && error.response.status === 401) navigate("/login");
        } finally {
            setLoading(false);
        }
    };

    // Fetch specifics when a user is selected
    const handleViewUser = async (userId) => {
        setSelectedUserId(userId);
        setUserDetails(null); // Clear previous
        try {
            const { data } = await axios.get(`${url}/api/admin/users/${userId}/full`, { withCredentials: true });
            if (data.success) {
                setUserDetails(data.data); // Contains yields, fertilizers, crops, posts, comments
            }
        } catch (error) {
            console.error("Error fetching user details", error);
            toast.error("Failed to fetch user details");
        }
    };

    const closeUserModal = () => {
        setSelectedUserId(null);
        setUserDetails(null);
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Are you sure you want to delete this user? This cannot be undone.")) return;

        try {
            await axios.delete(`${url}/api/admin/users/${userId}`, { withCredentials: true });
            toast.success("User deleted successfully");
            setUsers(users.filter((u) => u._id !== userId));
            setStats({ ...stats, users: stats.users - 1 });
        } catch (error) {
            console.error("Delete failed", error);
            toast.error("Failed to delete user");
        }
    };

    const handleDeletePost = async (postId) => {
        if (!window.confirm("Delete this post?")) return;
        try {
            await axios.delete(`${url}/api/admin/post/${postId}`, { withCredentials: true });
            toast.success("Post deleted");
            setPosts(posts.filter(p => p._id !== postId));
            setStats({ ...stats, posts: stats.posts - 1 });
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete post");
        }
    };



    // ... (existing helper functions)

    const handleTrendSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append("title", trendForm.title);
        formData.append("description", trendForm.description);
        formData.append("category", trendForm.category);
        if (trendImage) {
            formData.append("image", trendImage);
        }

        try {
            let res;
            if (editingTrendId) {
                // Update
                res = await axios.put(`${url}/api/admin/trends/${editingTrendId}`, formData, {
                    withCredentials: true,
                    headers: { "Content-Type": "multipart/form-data" }
                });
                if (res.data.success) {
                    toast.success("Trend updated!");
                    setTrends(trends.map(t => t._id === editingTrendId ? res.data.trend : t));
                }
            } else {
                // Create
                res = await axios.post(`${url}/api/admin/trends/add`, formData, {
                    withCredentials: true,
                    headers: { "Content-Type": "multipart/form-data" }
                });
                if (res.data.success) {
                    toast.success("Trend published!");
                    setTrends([res.data.trend, ...trends]);
                }
            }

            // Reset Form (Professional Reset)
            setTrendForm({ title: "", description: "", category: "Trend" });
            setTrendImage(null);
            setEditingTrendId(null);

            // Reset file input manually if needed using ref, but state null is okay for logic
            document.getElementById('trend-file-input').value = "";

        } catch (error) {
            console.error(error);
            toast.error(editingTrendId ? "Failed to update trend" : "Failed to publish trend");
        }
    };

    const handleEditTrend = (trend) => {
        setTrendForm({
            title: trend.title,
            description: trend.description,
            category: trend.category
        });
        setEditingTrendId(trend._id);
        // We don't set image here as it's file input, user uploads new one if they want to change it
        window.scrollTo(0, 0); // Scroll to form
    };

    // ... delete existing handleDeleteTrend

    const handleDeleteTrend = async (id) => {
        if (!window.confirm("Delete this trend?")) return;
        try {
            await axios.delete(`${url}/api/admin/trends/${id}`, { withCredentials: true });
            toast.success("Trend deleted");
            setTrends(trends.filter(t => t._id !== id));
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete trend");
        }
    };

    const handleLogout = () => {
        Cookies.remove('token');
        Cookies.remove('id');
        Cookies.remove('username');
        Cookies.remove('role'); // If we set it
        navigate('/login');
    }

    if (loading) return <div style={{ padding: "50px", textAlign: "center" }}>Loading Dashboard...</div>;

    return (
        <div style={styles.container}>
            {/* Sidebar / Navigation */}
            <div style={styles.sidebar}>
                <h2 style={styles.brand}>AgriVista Admin</h2>
                <ul style={styles.navList}>
                    <li
                        style={activeTab === "overview" ? styles.navItemActive : styles.navItem}
                        onClick={() => setActiveTab("overview")}
                    >
                        Overview
                    </li>
                    <li
                        style={activeTab === "users" ? styles.navItemActive : styles.navItem}
                        onClick={() => setActiveTab("users")}
                    >
                        User Management
                    </li>
                    <li
                        style={activeTab === "forum" ? styles.navItemActive : styles.navItem}
                        onClick={() => setActiveTab("forum")}
                    >
                        Forum Moderation
                    </li>
                    <li
                        style={activeTab === "trends" ? styles.navItemActive : styles.navItem}
                        onClick={() => setActiveTab("trends")}
                    >
                        Market Trends
                    </li>
                    <li style={styles.navItem} onClick={handleLogout}>
                        Logout
                    </li>
                </ul>
            </div>

            {/* Main Content */}
            <div style={styles.content}>
                <h1 style={styles.header}>{capitalize(activeTab)}</h1>

                {activeTab === "overview" && stats && (
                    <div style={styles.statsGrid}>
                        <StatCard title="Total Users" value={stats.users} color="#4A6317" />
                        <StatCard title="Total Posts" value={stats.posts} color="#6A8E23" />
                        <StatCard title="Yield Predictions" value={stats.yieldPredictions} color="#2C3322" />
                        <StatCard title="Fertilizer Checks" value={stats.fertilizerPredictions} color="#8FBC8F" />
                    </div>
                )}

                {activeTab === "users" && (
                    <div style={styles.tableContainer}>
                        <table style={styles.table}>
                            <thead>
                                <tr style={styles.tableHeader}>
                                    <th style={styles.th}>Photo</th>
                                    <th style={styles.th}>Name</th>
                                    <th style={styles.th}>Email</th>
                                    <th style={styles.th}>Role</th>
                                    <th style={styles.th}>Joined</th>
                                    <th style={styles.th}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user._id} style={styles.tableRow}>
                                        <td style={styles.td}>
                                            <img
                                                src={user.profilePhoto || "https://via.placeholder.com/40"}
                                                alt="user"
                                                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                                            />
                                        </td>
                                        <td style={styles.td}>{user.name}</td>
                                        <td style={styles.td}>{user.email}</td>
                                        <td style={styles.td}>{user.role || "User"}</td>
                                        <td style={styles.td}>{new Date(user.createdAt).toLocaleDateString()}</td>
                                        <td style={styles.td}>
                                            <button style={styles.viewBtn} onClick={() => handleViewUser(user._id)}>View Data</button>
                                            <button
                                                style={styles.deleteBtn}
                                                onClick={() => handleDeleteUser(user._id)}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === "forum" && (
                    <div style={styles.tableContainer}>
                        <table style={styles.table}>
                            <thead>
                                <tr style={styles.tableHeader}>
                                    <th style={styles.th}>Image</th>
                                    <th style={styles.th}>Headline</th>
                                    <th style={styles.th}>Author</th>
                                    <th style={styles.th}>Likes</th>
                                    <th style={styles.th}>Comments</th>
                                    <th style={styles.th}>Posted On</th>
                                    <th style={styles.th}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {posts.map((post) => (
                                    <tr key={post._id} style={styles.tableRow}>
                                        <td style={styles.td}>
                                            {post.image ? (
                                                <img
                                                    src={`${url}${post.image}`}
                                                    alt="post"
                                                    style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                                                />
                                            ) : (
                                                <span style={{ color: '#aaa', fontSize: '0.8rem' }}>No Image</span>
                                            )}
                                        </td>
                                        <td style={styles.td}>{post.heading}</td>
                                        <td style={styles.td}>{post.creatorname}</td>
                                        <td style={styles.td}>{post.likes ? post.likes.length : 0}</td>
                                        <td style={styles.td}>{post.commentsCount || 0}</td>
                                        <td style={styles.td}>{new Date(post.createdAt).toLocaleDateString()}</td>
                                        <td style={styles.td}>
                                            <button
                                                style={styles.deleteBtn}
                                                onClick={() => handleDeletePost(post._id)}
                                            >
                                                Delete Post
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === "trends" && (
                    <div style={{ ...styles.tableContainer, display: 'block' }}>
                        <div style={styles.card}>
                            <h3 style={styles.name}>{editingTrendId ? "Edit Market Trend" : "Publish New Market Trend"}</h3>
                            <form onSubmit={handleTrendSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <input
                                    type="text"
                                    placeholder="Trend Title"
                                    value={trendForm.title}
                                    onChange={(e) => setTrendForm({ ...trendForm, title: e.target.value })}
                                    style={styles.input}
                                    required
                                />
                                <textarea
                                    placeholder="Description"
                                    value={trendForm.description}
                                    onChange={(e) => setTrendForm({ ...trendForm, description: e.target.value })}
                                    style={{ ...styles.input, minHeight: '80px' }}
                                    required
                                />
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#666' }}>
                                        {editingTrendId ? "Update Image (Optional)" : "Upload Image"}
                                    </label>
                                    <input
                                        id="trend-file-input"
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setTrendImage(e.target.files[0])}
                                        style={styles.input}
                                        required={!editingTrendId}
                                    />
                                </div>
                                <select
                                    value={trendForm.category}
                                    onChange={(e) => setTrendForm({ ...trendForm, category: e.target.value })}
                                    style={styles.input}
                                >
                                    <option value="Trend">General Trend</option>
                                    <option value="Risk">Market Risk</option>
                                    <option value="New Crop">New Crop Intro</option>
                                    <option value="Technology">Agri-Tech</option>
                                </select>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button type="submit" style={styles.viewBtn}>
                                        {editingTrendId ? "Update Trend" : "Publish Trend"}
                                    </button>
                                    {editingTrendId && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditingTrendId(null);
                                                setTrendForm({ title: "", description: "", category: "Trend" });
                                                setTrendImage(null);
                                                document.getElementById('trend-file-input').value = "";
                                            }}
                                            style={{ ...styles.deleteBtn, backgroundColor: '#666' }}
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>

                        <h3 style={{ marginTop: '30px', color: '#2C3322' }}>Active Trends</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px', marginTop: '15px' }}>
                            {trends.map(t => (
                                <div key={t._id} style={styles.card}>
                                    <div style={styles.imageWrapper}>
                                        <img src={t.image} alt={t.title} style={styles.image} />
                                    </div>
                                    <div style={styles.cardBody}>
                                        <span style={{ fontSize: '0.8rem', color: '#6A8E23', fontWeight: 'bold', textTransform: 'uppercase' }}>{t.category}</span>
                                        <h4 style={styles.name}>{t.title}</h4>
                                        <p style={styles.desc}>{t.description.substring(0, 60)}...</p>
                                        <div style={{ marginTop: '10px' }}>
                                            <button onClick={() => handleEditTrend(t)} style={styles.viewBtn}>Edit</button>
                                            <button onClick={() => handleDeleteTrend(t._id)} style={styles.deleteBtn}>Delete</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* USER DETAIL MODAL */}
            {
                selectedUserId && (
                    <div style={styles.modalOverlay}>
                        <div style={styles.modalContent}>
                            <button style={styles.closeBtn} onClick={closeUserModal}>X</button>
                            <h2>User Data Insights</h2>
                            {!userDetails ? <p>Loading user data...</p> : (
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '15px' }}>
                                        <img
                                            src={userDetails.profilePhoto || "https://via.placeholder.com/80"}
                                            alt={userDetails.name}
                                            style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: `3px solid ${colors.primaryGreen}` }}
                                        />
                                        <div>
                                            <h3 style={{ margin: 0, color: colors.deepGreen }}>{userDetails.name}</h3>
                                            <p style={{ margin: 0, color: '#666' }}>{userDetails.email}</p>
                                        </div>
                                    </div>

                                    <div style={styles.modalTabs}>
                                        {['yield', 'fertilizer', 'crops', 'posts'].map(tab => (
                                            <button
                                                key={tab}
                                                style={detailTab === tab ? styles.tabActive : styles.tab}
                                                onClick={() => setDetailTab(tab)}
                                            >
                                                {capitalize(tab)}
                                            </button>
                                        ))}
                                    </div>
                                    <div style={styles.modalBody}>
                                        {detailTab === 'yield' && (
                                            userDetails.yields.length === 0 ? <p>No yield predictions found.</p> :
                                                <ul style={styles.dataList}>
                                                    {userDetails.yields.map(y => (
                                                        <li key={y._id} style={styles.dataItem}>
                                                            <strong>{y.Crop}</strong>: Predicted Yield {y.PredictedYield} (Rainfall: {y.Rainfall}, Temp: {y.Temperature})
                                                        </li>
                                                    ))}
                                                </ul>
                                        )}
                                        {detailTab === 'fertilizer' && (
                                            userDetails.fertilizers.length === 0 ? <p>No fertilizer checks found.</p> :
                                                <ul style={styles.dataList}>
                                                    {userDetails.fertilizers.map(f => (
                                                        <li key={f._id} style={styles.dataItem}>
                                                            <strong>{f.Crop}</strong> ({f.SoilType}): Recommended {f.RecommendedFertilizer}
                                                        </li>
                                                    ))}
                                                </ul>
                                        )}
                                        {detailTab === 'crops' && (
                                            userDetails.crops.length === 0 ? <p>No specific crop data logged.</p> :
                                                <ul style={styles.dataList}>
                                                    {userDetails.crops.map(c => (
                                                        <li key={c._id} style={styles.dataItem}>
                                                            Crops: {c.Crop1}, {c.Crop2}, {c.Crop3}, {c.Crop4}, {c.Crop5}
                                                        </li>
                                                    ))}
                                                </ul>
                                        )}
                                        {detailTab === 'posts' && (
                                            userDetails.posts.length === 0 ? <p>No posts made by this user.</p> :
                                                <ul style={styles.dataList}>
                                                    {userDetails.posts.map(p => (
                                                        <li key={p._id} style={styles.dataItem}>
                                                            <strong>{p.heading}</strong>: {p.content.substring(0, 50)}...
                                                        </li>
                                                    ))}
                                                </ul>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }

            <Toaster />
        </div >
    );
};

const StatCard = ({ title, value, color }) => (
    <div style={{ ...styles.card, borderTop: `5px solid ${color}` }}>
        <h3 style={styles.cardValue}>{value}</h3>
        <p style={styles.cardTitle}>{title}</p>
    </div>
);

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const styles = {
    container: {
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#F9F8F3",
        fontFamily: "'Inter', sans-serif",
    },
    sidebar: {
        width: "250px",
        backgroundColor: "#2C3322",
        color: "#fff",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
    },
    brand: {
        marginBottom: "40px",
        fontSize: "1.5rem",
        fontWeight: "bold",
        color: "#6A8E23",
    },
    navList: {
        listStyle: "none",
        padding: 0,
    },
    navItem: {
        padding: "15px",
        cursor: "pointer",
        borderRadius: "8px",
        marginBottom: "10px",
        transition: "background 0.3s",
        color: "#ddd",
    },
    navItemActive: {
        padding: "15px",
        cursor: "pointer",
        borderRadius: "8px",
        marginBottom: "10px",
        backgroundColor: "#6A8E23",
        color: "#fff",
        fontWeight: "bold",
    },
    content: {
        flex: 1,
        padding: "40px",
        overflowY: "auto",
    },
    header: {
        color: "#2C3322",
        marginBottom: "30px",
    },
    statsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "20px",
    },
    card: {
        backgroundColor: "#fff",
        padding: "20px",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        textAlign: "center",
    },
    cardValue: {
        fontSize: "2.5rem",
        margin: "0 0 10px 0",
        color: "#2C3322",
    },
    cardTitle: {
        color: "#666",
        margin: 0,
    },
    tableContainer: {
        backgroundColor: "#fff",
        borderRadius: "12px",
        padding: "20px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        overflowX: "auto",
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
    },
    tableHeader: {
        backgroundColor: "#f4f4f4",
        textAlign: "left",
    },
    th: {
        padding: "12px",
        color: "#555",
        fontWeight: "600",
    },
    tableRow: {
        borderBottom: "1px solid #eee",
    },
    td: {
        padding: "12px",
        color: "#333",
    },
    deleteBtn: {
        backgroundColor: "#d32f2f",
        color: "#fff",
        border: "none",
        padding: "5px 10px",
        borderRadius: "4px",
        cursor: "pointer",
        marginLeft: "5px"
    },
    viewBtn: {
        backgroundColor: "#6A8E23",
        color: "#fff",
        border: "none",
        padding: "5px 10px",
        borderRadius: "4px",
        cursor: "pointer",
        marginRight: "5px"
    },
    modalOverlay: {
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
    },
    modalContent: {
        backgroundColor: '#fff',
        padding: '30px',
        borderRadius: '12px',
        width: '600px',
        maxHeight: '80vh',
        overflowY: 'auto',
        position: 'relative'
    },
    closeBtn: {
        position: 'absolute',
        top: '10px',
        right: '10px',
        border: 'none',
        background: 'none',
        fontSize: '1.5rem',
        cursor: 'pointer'
    },
    modalTabs: {
        display: 'flex',
        borderBottom: '1px solid #ddd',
        marginBottom: '15px'
    },
    tab: {
        padding: '10px 20px',
        border: 'none',
        background: 'none',
        cursor: 'pointer',
        color: '#666'
    },
    tabActive: {
        padding: '10px 20px',
        border: 'none',
        background: 'none',
        cursor: 'pointer', // Fixed typo
        color: '#6A8E23',
        borderBottom: '2px solid #6A8E23',
        fontWeight: 'bold'
    },
    dataList: {
        listStyle: 'none',
        padding: 0
    },
    dataItem: {
        padding: '10px',
        borderBottom: '1px solid #eee',
        fontSize: '0.9rem'
    }
};

export default AdminDashboard;