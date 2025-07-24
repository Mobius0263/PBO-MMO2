import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Sidebar from './Sidebar';
import { getUsers } from '../services/userService';
import { getUpcomingMeetings } from '../services/meetingService';
import '../styles/Dashboard.css';

function Dashboard() {
    const { user } = useContext(AuthContext);
    const [teamMembers, setTeamMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [upcomingMeetings, setUpcomingMeetings] = useState([]);
    const [meetingsLoading, setMeetingsLoading] = useState(true);

    // Fetch team members data
    useEffect(() => {
        const fetchTeamMembers = async () => {
            try {
                setLoading(true);
                const response = await getUsers();
                // Ensure response is an array
                setTeamMembers(Array.isArray(response) ? response : []);
                setError(null);
            } catch (err) {
                console.error('Error fetching team members:', err);
                setError('Failed to load team members data');
                setTeamMembers([]); // Set empty array on error
            } finally {
                setLoading(false);
            }
        };

        fetchTeamMembers();
    }, []);

    // Fetch upcoming meetings
    useEffect(() => {
        const fetchMeetings = async () => {
            try {
                setMeetingsLoading(true);
                const meetings = await getUpcomingMeetings();
                // Ensure meetings is an array
                setUpcomingMeetings(Array.isArray(meetings) ? meetings : []);
            } catch (err) {
                console.error('Error fetching upcoming meetings:', err);
                setUpcomingMeetings([]); // Set empty array on error
            } finally {
                setMeetingsLoading(false);
            }
        };

        fetchMeetings();
    }, []);

    // Count online users (currently just a placeholder)
    const onlineUsers = 0; // In a real app, you would track this with user status
    
    // Ensure arrays are always valid
    const safeTeamMembers = Array.isArray(teamMembers) ? teamMembers : [];
    const safeUpcomingMeetings = Array.isArray(upcomingMeetings) ? upcomingMeetings : [];

    if (!user) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading user data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <h2>Something went wrong</h2>
                <p>{error}</p>
                <button onClick={() => window.location.reload()}>Reload Page</button>
            </div>
        );
    }

    return (
        <div className="dashboard-main">
            <Sidebar />

            <div className="dashboard-content">
                <div className="dashboard-header">
                    <div className="search-container">
                        <input type="text" placeholder="Search..." className="search-input" />
                    </div>
                    <div className="header-actions">
                        <Link to="/meetings" className="btn-new-meeting">
                            <i className="fas fa-plus"></i> New Meeting
                        </Link>
                        <div className="notification-icon">
                            <i className="fas fa-bell"></i>
                        </div>
                    </div>
                </div>

                <div className="dashboard-body">
                    <div className="welcome-section">
                        <div className="welcome-text">
                            <h2>Welcome back, {user.nama || 'User'}!</h2>
                            <p>Let's manage your meetings and team schedule</p>
                        </div>
                    </div>

                    <div className="dashboard-grid">
                        <div className="dashboard-card team-overview">
                            <div className="card-header">
                                <h3>Team Overview</h3>
                                <span className="sub-title">Team status today</span>
                            </div>
                            <div className="team-stats">
                                <div className="stat-item">
                                    <div className="stat-number">{loading ? '...' : safeTeamMembers.length}</div>
                                    <div className="stat-label">Total Members</div>
                                </div>
                                <div className="stat-item">
                                    <div className="stat-number">{onlineUsers}</div>
                                    <div className="stat-label">Online</div>
                                </div>
                                <div className="stat-item">
                                    <div className="stat-number">{meetingsLoading ? '...' : safeUpcomingMeetings.length}</div>
                                    <div className="stat-label">Upcoming Meetings</div>
                                </div>
                            </div>
                        </div>

                        <div className="dashboard-card upcoming-meetings">
                            <div className="card-header">
                                <h3>Upcoming Meetings</h3>
                                <Link to="/meetings" className="view-all">View All</Link>
                            </div>
                            <div className="meetings-list">
                                {meetingsLoading ? (
                                    <div className="loading-spinner"></div>
                                ) : safeUpcomingMeetings.length > 0 ? (
                                    safeUpcomingMeetings.map(meeting => (
                                        <div key={meeting?.id || Math.random()} className="meeting-item">
                                            <div className="meeting-time">
                                                <div className="time">{meeting?.time || 'TBD'}</div>
                                                <div className="date">{meeting?.date || 'TBD'}</div>
                                            </div>
                                            <div className="meeting-details">
                                                <h4>{meeting?.title || 'Untitled Meeting'}</h4>
                                                <p>{meeting?.description || 'No description'}</p>
                                            </div>
                                            <Link to={`/meetings`} className="btn-join">Join</Link>
                                        </div>
                                    ))
                                ) : (
                                    <div className="no-meetings">
                                        <p>No upcoming meetings</p>
                                        <Link to="/meetings" className="btn-schedule">Schedule Meeting</Link>
                                    </div>
                                )}
                            </div>
                        </div>

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