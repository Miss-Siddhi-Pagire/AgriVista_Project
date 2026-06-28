import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useCookies } from "react-cookie";
import url from "../url";
import { CalendarDays, ListTodo, CheckCircle2, Leaf, Trash2, ArrowLeft } from "lucide-react";

const CropCalendar = () => {
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [cookies] = useCookies(["token"]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("calendar");
  
  // Hardcoded for user check - usually drawn from an AuthContext or local storage
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    // Attempt to verify user and get ID for fetching tasks
    const verifyUser = async () => {
      if (!cookies.token) return;
      try {
        const { data } = await axios.post(
          `${url}/`,
          { tok: cookies.token },
          { withCredentials: true }
        );
        if (data.status) {
          setUserId(data.id);
          fetchTasks(data.id);
        }
      } catch (err) {
        console.error("Auth error", err);
      }
    };
    verifyUser();
  }, [cookies]);

  const fetchTasks = async (uId) => {
    setLoading(true);
    try {
      const response = await axios.get(`${url}/api/tasks?userId=${uId}`);
      if (response.data && response.data.tasks) {
        setTasks(response.data.tasks);
      }
    } catch (err) {
      console.error("Failed to fetch tasks", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskCheck = async (taskId, currentStatus) => {
    try {
      await axios.patch(`${url}/api/tasks/${taskId}`, {
        isCompleted: !currentStatus,
      });
      // In a real app we would optimistically update the state
      setTasks(tasks.map(t => t._id === taskId ? { ...t, isCompleted: !currentStatus } : t));
    } catch (err) {
      console.error("Failed to update task", err);
    }
  };

  const handleTaskDelete = async (taskId) => {
    try {
      await axios.delete(`${url}/api/tasks/${taskId}`);
      setTasks(tasks.filter(t => t._id !== taskId));
    } catch (err) {
      console.error("Failed to delete task", err);
    }
  };

  const handleDateChange = (newDate) => {
    setDate(newDate);
  };

  const formattedDate = format(date, "yyyy-MM-dd");
  
  // Filter tasks for the selected date
  // (Assuming dueDate is stored directly as a Date string like '2026-03-31T00:00:00.000Z')
  const selectedDateTasks = tasks.filter(task => {
    const taskDateStr = new Date(task.dueDate).toISOString().split('T')[0];
    return taskDateStr === formattedDate;
  });

  // Highlight days with tasks
  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const tileDateStr = format(date, "yyyy-MM-dd");
      const dayTasks = tasks.filter(t => new Date(t.dueDate).toISOString().split('T')[0] === tileDateStr);
      if (dayTasks.length > 0) {
        const allCompleted = dayTasks.every(t => t.isCompleted);
        return (
          <div className="d-flex justify-content-center mt-1">
             <div style={{
                height: "8px",
                width: "8px",
                backgroundColor: allCompleted ? "green" : "red",
                borderRadius: "50%"
             }}></div>
          </div>
        );
      }
    }
    return null;
  };

  return (
    <div className="dash-wrap">
      {/* DASHBOARD SIDEBAR */}
      <div className="dash-sidebar">
        <div className="dash-sidebar-title" style={{ marginBottom: '1rem' }}>Navigation</div>
        <div 
          className="sidebar-item"
          onClick={() => navigate('/season-planner')}
          style={{ marginBottom: '1.5rem', backgroundColor: 'var(--mint-light)', color: 'var(--forest)' }}
        >
          <ArrowLeft size={18} /> <span style={{ marginLeft: '10px', fontWeight: 600 }}>Back to Planner</span>
        </div>

        <div className="dash-sidebar-title">Task Views</div>
        <div 
          className={`sidebar-item ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendar')}
        >
          <CalendarDays size={18} /> <span style={{ marginLeft: '10px' }}>Calendar View</span>
        </div>
        <div 
          className={`sidebar-item ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          <ListTodo size={18} /> <span style={{ marginLeft: '10px' }}>Pending Tasks</span>
        </div>
        
        <div className="dash-sidebar-title" style={{ marginTop: '1.5rem' }}>Library</div>
        <div 
          className={`sidebar-item ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <CheckCircle2 size={18} /> <span style={{ marginLeft: '10px' }}>History (Completed)</span>
        </div>
      </div>

      {/* DASHBOARD MAIN */}
      <div className="dash-main">
        <div className="dash-header">
          <h2 style={{ display: 'flex', alignItems: 'center' }}>
            <Leaf className="sidebar-icon" style={{color: "var(--leaf)", marginRight: "10px"}} /> 
            Crop Care Tracker
          </h2>
          <p>Interactive calendar and task manager for your farming activities.</p>
        </div>

        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          
          {/* CALENDAR VIEW */}
          {activeTab === 'calendar' && (
            <div className="dash-grid2">
              <div className="dash-card">
                <div className="dash-card-title">Select Date</div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <Calendar 
                    onChange={handleDateChange} 
                    value={date} 
                    className="border-0 shadow-sm"
                    tileContent={tileContent}
                  />
                </div>
              </div>

              <div className="dash-card">
                <div className="dash-card-title">Tasks for {format(date, "MMMM do, yyyy")}</div>
                {loading ? (
                  <p style={{ color: 'var(--text-muted)' }}>Loading tasks...</p>
                ) : selectedDateTasks.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem', backgroundColor: 'var(--mint-faint)', borderRadius: '8px', border: '1px dashed var(--leaf)' }}>
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>No tasks scheduled for this day.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {selectedDateTasks.map((task) => (
                      <div key={task._id} style={{
                        display: 'flex', alignItems: 'center', padding: '12px', 
                        backgroundColor: task.isCompleted ? '#f9fafb' : '#fff',
                        border: '1px solid #e5e7eb', borderRadius: '8px',
                        transition: 'all 0.2s'
                      }}>
                        <input
                          type="checkbox"
                          checked={task.isCompleted}
                          onChange={() => handleTaskCheck(task._id, task.isCompleted)}
                          style={{ cursor: "pointer", transform: "scale(1.3)", marginRight: '15px', accentColor: 'var(--forest)' }}
                        />
                        <div style={{ flex: 1 }}>
                          <h6 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', color: task.isCompleted ? '#9ca3af' : 'var(--text-dark)', textDecoration: task.isCompleted ? 'line-through' : 'none' }}>
                            {task.title}
                          </h6>
                          {task.description && (
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{task.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PENDING TASKS VIEW */}
          {activeTab === 'pending' && (
            <div className="dash-card">
              <div className="dash-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ListTodo color="#f59e0b" /> Upcoming & Pending Tasks
              </div>
              
              <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
                {tasks.filter(t => !t.isCompleted).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', backgroundColor: 'var(--mint-faint)', borderRadius: '8px', border: '1px dashed var(--leaf)' }}>
                    <p style={{ color: 'var(--forest)', margin: 0, fontWeight: 600 }}>All caught up! You have no pending tasks.</p>
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--forest)', color: 'white' }}>
                        <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.9rem', borderTopLeftRadius: '8px' }}>Date</th>
                        <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.9rem' }}>Task</th>
                        <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.9rem', borderTopRightRadius: '8px', textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.filter(t => !t.isCompleted).sort((a,b) => new Date(a.dueDate) - new Date(b.dueDate)).map(task => (
                        <tr key={task._id} style={{ borderBottom: '1px solid rgba(74,222,128,0.2)' }}>
                          <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: '0.9rem', borderLeft: '1px solid rgba(74,222,128,0.2)' }}>
                            {format(new Date(task.dueDate), "MMM do, yyyy")}
                          </td>
                          <td style={{ padding: '14px 16px', color: 'var(--text-main)', fontWeight: 500 }}>
                            {task.title}
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'center', borderRight: '1px solid rgba(74,222,128,0.2)' }}>
                            <button
                              onClick={() => handleTaskCheck(task._id, false)}
                              style={{ backgroundColor: 'var(--forest)', border: 'none', color: 'white', cursor: 'pointer', padding: '6px 16px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}
                            >
                              Mark Done
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* HISTORY VIEW */}
          {activeTab === 'history' && (
            <div className="dash-card">
              <div className="dash-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 color="var(--leaf)" /> Completed Tasks History
              </div>
              
              <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
                {tasks.filter(t => t.isCompleted).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px dashed #d1d5db' }}>
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>No completed tasks yet.</p>
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f3f4f6', color: '#4b5563' }}>
                        <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.9rem', borderTopLeftRadius: '8px' }}>Date</th>
                        <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.9rem' }}>Completed Task</th>
                        <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.9rem', borderTopRightRadius: '8px', textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.filter(t => t.isCompleted).sort((a,b) => new Date(b.updatedAt || b.dueDate) - new Date(a.updatedAt || a.dueDate)).map(task => (
                        <tr key={task._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: '0.9rem', borderLeft: '1px solid #e5e7eb' }}>
                            {format(new Date(task.dueDate), "MMM do, yyyy")}
                          </td>
                          <td style={{ padding: '14px 16px', color: '#9ca3af', textDecoration: 'line-through' }}>
                            {task.title}
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'center', borderRight: '1px solid #e5e7eb' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                              <button
                                onClick={() => handleTaskCheck(task._id, true)}
                                style={{ backgroundColor: 'transparent', border: 'none', color: '#0D6EFD', cursor: 'pointer', padding: '6px', fontSize: '0.8rem' }}
                                title="Undo"
                              >
                                Undo
                              </button>
                              <button
                                onClick={() => handleTaskDelete(task._id)}
                                style={{ backgroundColor: 'transparent', border: 'none', color: '#e53935', cursor: 'pointer', padding: '6px' }}
                                title="Delete Permanently"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default CropCalendar;
