// filepath: d:\KULIAH\SEMESTER 4\Rekayasa Perangkat Lunak\code\NewRPL\frontend\src\components\Dashboard.jsx
import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Sidebar from './Sidebar';
import '../styles/Dashboard.css';

function Dashboard() {
    const { user } = useContext(AuthContext);
    
    if (!user) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="dashboard-main">
            {/* Komponen Sidebar */}
            <Sidebar />

            {/* Konten Utama */}
            <div className="dashboard-content">
                <div className="dashboard-header">
                    <div className="search-container">
                        <input type="text" placeholder="Search..." className="search-input" />
                    </div>
                    <div className="header-actions">
                        <button className="btn-new-meeting">
                            <i className="icon-plus"></i> New Meeting
                        </button>
                        <div className="notification-icon">
                            <i className="icon-bell"></i>
                        </div>
                    </div>
                </div>

                <div className="dashboard-body">
                    {/* Bagian Welcome */}
                    <div className="welcome-section">
                        <div className="welcome-text">
                            <h2>Welcome back, {user.nama || 'User'}!</h2>
                            <p>Let's manage your meetings and team schedule</p>
                        </div>
                    </div>

                    <div className="dashboard-grid">
                        {/* Team Overview */}
                        <div className="dashboard-card team-overview">
                            <div className="card-header">
                                <h3>Team Overview</h3>
                                <span className="sub-title">Team status today</span>
                            </div>
                            <div className="team-stats">
                                <div className="stat-item">
                                    <div className="stat-number">0</div>
                                    <div className="stat-label">Total Members</div>
                                </div>
                                <div className="stat-item">
                                    <div className="stat-number">0</div>
                                    <div className="stat-label">Online</div>
                                </div>
                                <div className="stat-item">
                                    <div className="stat-number">0</div>
                                    <div className="stat-label">Meetings Today</div>
                                </div>
                            </div>
                        </div>

                        {/* Upcoming Meetings */}
                        <div className="dashboard-card upcoming-meetings">
                            <div className="card-header">
                                <h3>Upcoming Meetings</h3>
                                <Link to="/meetings" className="view-all">View All</Link>
                            </div>
                            <div className="meetings-list">
                                <div className="no-meetings">
                                    <p>No upcoming meetings</p>
                                    <Link to="/meetings" className="btn-create-meeting">Schedule Meeting</Link>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="dashboard-card quick-actions">
                            <div className="card-header">
                                <h3>Quick Actions</h3>
                            </div>
                            <div className="action-buttons">
                                <Link to="/meetings" className="action-button">
                                    <i className="fas fa-calendar"></i>
                                    <span>Schedule Meeting</span>
                                </Link>
                                <Link to="/my-team" className="action-button">
                                    <i className="fas fa-users"></i>
                                    <span>View Team</span>
                                </Link>
                                <Link to="/settings" className="action-button">
                                    <i className="fas fa-cog"></i>
                                    <span>Settings</span>
                                </Link>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="dashboard-card recent-activity">
                            <div className="card-header">
                                <h3>Recent Activity</h3>
                            </div>
                            <div className="activity-list">
                                <div className="no-activity">
                                    <p>No recent activity</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;