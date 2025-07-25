import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext, isAdmin, isLeader } from '../context/AuthContext';
import Sidebar from './Sidebar';
import { getUsers } from '../services/userService';
import { getUpcomingMeetings, getMeetings } from '../services/meetingService';
import '../styles/Dashboard.css';

function Dashboard() {
    const { user } = useContext(AuthContext);
    const [teamMembers, setTeamMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [upcomingMeetings, setUpcomingMeetings] = useState([]);
    const [meetingsLoading, setMeetingsLoading] = useState(true);
    const [pastMeetings, setPastMeetings] = useState([]);
    const [pastMeetingsLoading, setPastMeetingsLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isDateSelected, setIsDateSelected] = useState(false);
    const [selectedDateMeetings, setSelectedDateMeetings] = useState([]);

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

    // Fetch past meetings where user is a participant
    useEffect(() => {
        const fetchPastMeetings = async () => {
            try {
                setPastMeetingsLoading(true);

                // Get all meetings to filter past ones where user is a participant
                const allMeetings = await getMeetings();
                const now = new Date();

                // Filter for past meetings where user is a participant
                const past = Array.isArray(allMeetings) ? allMeetings.filter(meeting => {
                    const meetingDate = new Date(`${meeting.date}T${meeting.time}`);
                    const isInPast = meetingDate < now;

                    // Check if all members or if user is a participant
                    const isParticipant = meeting.allMembers ||
                        (Array.isArray(meeting.participants) &&
                            meeting.participants.some(p => p.id === user.id || p === user.id));

                    return isInPast && isParticipant;
                }) : [];

                setPastMeetings(past);
            } catch (err) {
                console.error('Error fetching past meetings:', err);
                setPastMeetings([]);
            } finally {
                setPastMeetingsLoading(false);
            }
        };

        if (user) {
            fetchPastMeetings();
        }
    }, [user]);

    // Count online users (currently just a placeholder)
    const onlineUsers = 0; // In a real app, you would track this with user status

    // Ensure arrays are always valid
    const safeTeamMembers = Array.isArray(teamMembers) ? teamMembers : [];
    const safeUpcomingMeetings = Array.isArray(upcomingMeetings) ? upcomingMeetings : [];

    // Add this useEffect to handle date selection filtering
    useEffect(() => {
        if (isDateSelected && Array.isArray(upcomingMeetings)) {
            // Filter meetings for the selected date
            const filteredMeetings = upcomingMeetings.filter(meeting => {
                const meetingDate = new Date(`${meeting.date}`);
                return (
                    meetingDate.getFullYear() === selectedDate.getFullYear() &&
                    meetingDate.getMonth() === selectedDate.getMonth() &&
                    meetingDate.getDate() === selectedDate.getDate()
                );
            });
            setSelectedDateMeetings(filteredMeetings);
        }
    }, [selectedDate, upcomingMeetings, isDateSelected]);

    // Add this function to handle date selection
    const handleDateSelection = (date) => {
        setSelectedDate(date);
        setIsDateSelected(true);
    };

    // Add this function to clear date selection
    const clearDateSelection = () => {
        setIsDateSelected(false);
    };

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
                        {(isAdmin(user) || isLeader(user)) && (
                            <Link to="/meetings" className="btn-new-meeting">
                                <i className="fas fa-plus"></i> New Meeting
                            </Link>
                        )}
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
                                    <div className="stat-number">{meetingsLoading ? '...' : safeUpcomingMeetings.length}</div>
                                    <div className="stat-label">Upcoming Meetings</div>
                                </div>
                            </div>
                        </div>

                        {/* Mini Calendar Card */}
                        <div className="dashboard-card mini-calendar">
                            <div className="card-header">
                                <h3>Calendar</h3>
                            </div>
                            <div className="calendar-mini">
                                <div className="weekdays-mini">
                                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                                        <div key={index} className="weekday-mini">{day}</div>
                                    ))}
                                </div>
                                <div className="days-mini">
                                    {(() => {
                                        // Calendar code remains unchanged
                                        const year = new Date().getFullYear();
                                        const month = new Date().getMonth();

                                        // Get first day of the month and last day of the month
                                        const firstDay = new Date(year, month, 1);
                                        const lastDay = new Date(year, month + 1, 0);

                                        // Get the day of the week for first day (0-6, 0 is Sunday)
                                        const firstDayOfWeek = firstDay.getDay();

                                        const days = [];

                                        // Add empty cells for days before the first day of month
                                        for (let i = 0; i < firstDayOfWeek; i++) {
                                            days.push(<div key={`empty-${i}`} className="day-mini empty"></div>);
                                        }

                                        // Add days of the month
                                        for (let i = 1; i <= lastDay.getDate(); i++) {
                                            const currentDate = new Date(year, month, i);
                                            const isToday = currentDate.toDateString() === new Date().toDateString();
                                            const isSelected = isDateSelected &&
                                                currentDate.toDateString() === selectedDate.toDateString();

                                            days.push(
                                                <div
                                                    key={i}
                                                    className={`day-mini ${isToday ? 'today-mini' : ''} ${isSelected ? 'selected-mini' : ''}`}
                                                    onClick={() => handleDateSelection(new Date(year, month, i))}
                                                >
                                                    {i}
                                                </div>
                                            );
                                        }

                                        return days;
                                    })()}
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

                        <div className="dashboard-card recent-activity">
                            <div className="card-header">
                                <h3>Recent Activity</h3>
                            </div>
                            <div className="activity-list">
                                {pastMeetingsLoading ? (
                                    <div className="loading-spinner"></div>
                                ) : pastMeetings.length > 0 ? (
                                    pastMeetings.map(meeting => (
                                        <div key={meeting?.id || Math.random()} className="meeting-item">
                                            <div className="meeting-time">
                                                <div className="time">{meeting?.time || 'TBD'}</div>
                                                <div className="date">{meeting?.date || 'TBD'}</div>
                                            </div>
                                            <div className="meeting-details">
                                                <h4>{meeting?.title || 'Untitled Meeting'}</h4>
                                                <p>{meeting?.description || 'No description'}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="no-activity">
                                        <p>No recent activity</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Selected date meetings card - only shown when a date is selected */}
                        {isDateSelected && (
                            <div className="dashboard-card selected-date-meetings">
                                <div className="card-header">
                                    <h3>Meetings on {selectedDate.toLocaleDateString()}</h3>
                                    <button
                                        onClick={clearDateSelection}
                                        className="btn-clear-selection"
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: '#6c5ce7',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '5px'
                                        }}
                                    >
                                        <i className="fas fa-times"></i> Clear
                                    </button>
                                </div>
                                <div className="meetings-list">
                                    {selectedDateMeetings.length > 0 ? (
                                        selectedDateMeetings.map(meeting => (
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
                                            <p>No meetings scheduled for this date</p>
                                            {(isAdmin(user) || isLeader(user)) && (
                                                <Link to="/meetings" className="btn-schedule">Schedule Meeting</Link>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;