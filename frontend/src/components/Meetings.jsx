import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getUsers } from '../services/userService';
import { createMeeting, getMeetings } from '../services/meetingService';
import Sidebar from './Sidebar';
import '../styles/Meetings.css';

function Meetings() {
    const { user } = useContext(AuthContext);
    const [month, setMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [view, setView] = useState('upcoming');
    const [showNewMeetingModal, setShowNewMeetingModal] = useState(false);
    const [meetings, setMeetings] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
    const [isDateSelected, setIsDateSelected] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [showMeetingDetailModal, setShowMeetingDetailModal] = useState(false);
    const [selectedMeeting, setSelectedMeeting] = useState(null);
    const navigate = useNavigate();

    // Function to open meeting details modal
    const openMeetingDetails = (meeting) => {
        setSelectedMeeting(meeting);
        setShowMeetingDetailModal(true);
    };

    // Function to close meeting details modal
    const closeMeetingDetails = () => {
        setShowMeetingDetailModal(false);
        setSelectedMeeting(null);
    };

    // Fungsi untuk menentukan apakah user memiliki akses untuk membuat meeting
    const hasPermissionToCreateMeeting = (user) => {
        return user && (user.role === 'Admin' || user.role === 'Team Leader');
    };

    // New meeting form state
    const [newMeetingData, setNewMeetingData] = useState({
        title: '',
        description: '',
        date: '',
        time: '',
        duration: 60,
        participants: [],
        allMembers: false
    });

    // Load meetings from API instead of localStorage
    useEffect(() => {
        const fetchMeetings = async () => {
            try {
                console.log('Fetching all meetings...');
                const response = await getMeetings();
                if (Array.isArray(response)) {
                    console.log(`Successfully fetched ${response.length} meetings`);
                    setMeetings(response);
                } else {
                    console.warn('Unexpected response format:', response);
                    setMeetings([]);
                }
            } catch (error) {
                console.error('Error fetching meetings:', error);
                setMeetings([]); // Set empty array to avoid undefined errors
            }
        };

        fetchMeetings();
    }, []);

    // Load team members
    useEffect(() => {
        const fetchTeamMembers = async () => {
            try {
                const users = await getUsers();
                setTeamMembers(users);
            } catch (error) {
                console.error('Error fetching team members:', error);
            }
        };
        fetchTeamMembers();
    }, []);

    // Auto-update countdown every minute
    useEffect(() => {
        const interval = setInterval(() => {
            setMeetings(prevMeetings => {
                const now = new Date();
                // Remove meetings that have passed
                const activeMeetings = prevMeetings.filter(meeting => {
                    const meetingDate = new Date(`${meeting.date}T${meeting.time}`);
                    const endTime = new Date(meetingDate.getTime() + meeting.duration * 60000);
                    return endTime > now;
                });

                // Update localStorage if meetings were removed
                if (activeMeetings.length !== prevMeetings.length) {
                    localStorage.setItem('meetings', JSON.stringify(activeMeetings));
                }

                return activeMeetings;
            });
        }, 60000); // Update every minute

        return () => clearInterval(interval);
    }, []);

    // Calculate countdown for a meeting
    const getCountdown = (meetingDate, meetingTime) => {
        const now = new Date();
        const meeting = new Date(`${meetingDate}T${meetingTime}`);
        const diff = meeting.getTime() - now.getTime();

        if (diff <= 0) return null;

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (days >= 2) {
            return `${days} days`;
        } else if (days >= 1) {
            return `${days} day${days > 1 ? 's' : ''} ${hours}h`;
        } else if (hours >= 6) {
            return `${hours} hours`;
        } else if (hours >= 1) {
            return `${hours}h ${minutes}m`;
        } else if (minutes >= 1) {
            return `${minutes} minutes`;
        } else {
            return '<1 minute';
        }
    };

    // Format duration for display in modal
    const formatDuration = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) {
            return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
        }
        return `${mins}m`;
    };

    // Format time for display in modal
    const formatTime = (timeString) => {
        if (!timeString) return '';
        try {
            const [hours, minutes] = timeString.split(':').map(Number);
            return new Date(0, 0, 0, hours, minutes).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return timeString;
        }
    };

    // Handle new meeting form submission
    const handleCreateMeeting = async (e) => {
        e.preventDefault();

        if (!newMeetingData.title || !newMeetingData.date || !newMeetingData.time) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            // Create meeting using API
            const participantIds = newMeetingData.allMembers
                ? []
                : newMeetingData.participants.map(p => p.id);

            const meetingToCreate = {
                title: newMeetingData.title,
                description: newMeetingData.description,
                date: newMeetingData.date,
                time: newMeetingData.time,
                duration: parseInt(newMeetingData.duration),
                allMembers: newMeetingData.allMembers,
                participants: participantIds
            };

            const newMeeting = await createMeeting(meetingToCreate);

            // Update local state with the newly created meeting
            setMeetings(prevMeetings => [...prevMeetings, newMeeting]);

            // Reset form and close modal
            setNewMeetingData({
                title: '',
                description: '',
                date: '',
                time: '',
                duration: 60,
                participants: [],
                allMembers: false
            });
            setShowNewMeetingModal(false);
        } catch (error) {
            console.error('Error creating meeting:', error);
            alert('Failed to create meeting. Please try again.');
        }
    };

    // Handle participant selection
    const toggleParticipant = (member) => {
        setNewMeetingData(prev => {
            const isSelected = prev.participants.some(p => p.id === member.id);
            if (isSelected) {
                return {
                    ...prev,
                    participants: prev.participants.filter(p => p.id !== member.id)
                };
            } else {
                return {
                    ...prev,
                    participants: [...prev.participants, member]
                };
            }
        });
    };

    // Handle "All Members" toggle
    const toggleAllMembers = () => {
        setNewMeetingData(prev => ({
            ...prev,
            allMembers: !prev.allMembers,
            participants: !prev.allMembers ? [] : prev.participants
        }));
    };

    // Filter meetings based on view and current time
    const getFilteredMeetings = () => {
        const now = new Date();

        return meetings.filter(meeting => {
            const meetingDate = new Date(`${meeting.date}T${meeting.time}`);
            const endTime = new Date(meetingDate.getTime() + meeting.duration * 60000);

            // Remove meetings that have completely passed
            if (endTime <= now) return false;

            switch (view) {
                case 'upcoming':
                    return meetingDate >= now;
                case 'past':
                    return meetingDate < now && endTime > now; // Currently ongoing
                case 'all':
                    return true;
                default:
                    return true;
            }
        });
    };

    // Get today's meetings
    const getTodaysMeetings = () => {
        const today = new Date().toDateString();
        return getFilteredMeetings().filter(meeting => {
            const meetingDate = new Date(`${meeting.date}T${meeting.time}`);
            return meetingDate.toDateString() === today;
        });
    };

    // Get tomorrow's meetings
    const getTomorrowsMeetings = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toDateString();

        return getFilteredMeetings().filter(meeting => {
            const meetingDate = new Date(`${meeting.date}T${meeting.time}`);
            return meetingDate.toDateString() === tomorrowStr;
        });
    };

    // Generate calendar data
    const generateCalendarDays = () => {
        const year = month.getFullYear();
        const monthIndex = month.getMonth();

        const days = [];

        // Get first day of the month and last day of the month
        const firstDay = new Date(year, monthIndex, 1);
        const lastDay = new Date(year, monthIndex + 1, 0);

        // Get the day of the week for first day (0-6, 0 is Sunday)
        const firstDayOfWeek = firstDay.getDay();

        // Add days from previous month to fill the first row
        const prevMonthLastDay = new Date(year, monthIndex, 0).getDate();
        for (let i = firstDayOfWeek - 1; i >= 0; i--) {
            days.push({
                day: prevMonthLastDay - i,
                month: monthIndex - 1,
                year: year,
                isCurrentMonth: false
            });
        }

        // Add all days from current month
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push({
                day: i,
                month: monthIndex,
                year: year,
                isCurrentMonth: true,
                isToday: new Date(year, monthIndex, i).toDateString() === new Date().toDateString(),
                isSelected: new Date(year, monthIndex, i).toDateString() === selectedDate.toDateString()
            });
        }

        // Fill remaining slots with days from next month
        const totalCells = Math.ceil((firstDayOfWeek + lastDay.getDate()) / 7) * 7;
        const nextMonthDays = totalCells - days.length;
        for (let i = 1; i <= nextMonthDays; i++) {
            days.push({
                day: i,
                month: monthIndex + 1,
                year: year,
                isCurrentMonth: false
            });
        }

        return days;
    };

    // Previous month
    const prevMonth = () => {
        setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1));
    };

    // Next month
    const nextMonth = () => {
        setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1));
    };

    // Get meetings for today and tomorrow
    const todaysMeetings = getTodaysMeetings();
    const tomorrowsMeetings = getTomorrowsMeetings();

    // List of weekday names
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const renderParticipants = (participants) => {
        if (!participants || participants.length === 0) {
            return <div className="no-participants">No participants</div>;
        }

        return (
            <div className="participants-detail">
                {participants.slice(0, 3).map((participant, index) => (
                    <div key={participant?.id || index} className="participant-avatar">
                        {participant?.profileImage ? (
                            <img
                                src={participant.profileImage}
                                alt={participant.nama || 'User'}
                                className="participant-img"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.style.display = 'none';
                                    e.target.parentNode.innerHTML = `<div class="text-avatar">${participant?.nama?.charAt(0) || '?'}</div>`;
                                }}
                            />
                        ) : (
                            <div className="text-avatar">
                                {participant?.nama?.charAt(0) || '?'}
                            </div>
                        )}
                    </div>
                ))}
                {participants.length > 3 && (
                    <div className="participant-more">+{participants.length - 3}</div>
                )}
            </div>
        );
    };

    // Update the meetings-view-tabs section to only show Upcoming tab
    useEffect(() => {
        setView('upcoming');
    }, []);

    // Handle date selection
    const handleDateSelection = (date) => {
        setSelectedDate(date);
        setIsDateSelected(true);
        // When selecting a new date, hide search results
        setShowSearchResults(false);
    };

    // Clear date selection
    const clearDateSelection = () => {
        setIsDateSelected(false);
    };

    // Handle search
    const handleSearch = () => {
        if (!searchTerm.trim()) return;

        const results = meetings.filter(meeting =>
            meeting.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setSearchResults(results);
        setShowSearchResults(true);
        // When searching, hide any selected date view
        setIsDateSelected(false);
    };

    // Modify the existing click handler for calendar days
    // Replace the onClick event in the calendar days div:
    // onClick={() => handleDateSelection(new Date(day.year, day.month, day.day))}

    // Add this function to get meetings for selected date
    const getSelectedDateMeetings = () => {
        const selectedDateStr = selectedDate.toDateString();
        return meetings.filter(meeting => {
            const meetingDate = new Date(`${meeting.date}T${meeting.time}`);
            return meetingDate.toDateString() === selectedDateStr;
        });
    };

    // Update the search bar input and icon
    // Replace the search-bar div with this:
    return (
        <div className="dashboard-main">
            <Sidebar />

            <div className="dashboard-content">
                <div className="meetings-header">
                    <h2>Meetings</h2>

                    <div className="meetings-actions">
                        <div className="search-bar">
                            <input
                                type="text"
                                placeholder="Search meetings..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            />
                            <i className="fas fa-search" onClick={handleSearch} style={{ cursor: 'pointer' }}></i>
                        </div>
                        {hasPermissionToCreateMeeting(user) && (
                            <button
                                className="btn-new-meeting"
                                onClick={() => setShowNewMeetingModal(true)}
                            >
                                <i className="fas fa-plus"></i> New Meeting
                            </button>
                        )}
                    </div>
                </div>

                <div className="meetings-view-tabs">
                    <button
                        className="active"
                        onClick={() => setView('upcoming')}
                    >
                        Upcoming
                    </button>
                </div>

                <div className="calendar-container">
                    <div className="calendar-header">
                        <button className="btn-prev-month" onClick={prevMonth}>
                            <i className="fas fa-chevron-left"></i>
                        </button>
                        <h3>{month.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                        <button className="btn-next-month" onClick={nextMonth}>
                            <i className="fas fa-chevron-right"></i>
                        </button>
                    </div>

                    <div className="calendar-grid">
                        <div className="weekdays">
                            {weekdays.map(day => (
                                <div key={day} className="weekday">{day}</div>
                            ))}
                        </div>
                        <div className="days">
                            {generateCalendarDays().map((day, index) => (
                                <div
                                    key={index}
                                    className={`day ${!day.isCurrentMonth ? 'other-month' : ''} ${day.isToday ? 'today' : ''} ${day.isSelected ? 'selected' : ''}`}
                                    onClick={() => handleDateSelection(new Date(day.year, day.month, day.day))}
                                >
                                    {day.day}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Selected Date Meetings */}
                {isDateSelected && (
                    <div className="meetings-section">
                        <div className="section-header">
                            <h3>Meetings on {selectedDate.toLocaleDateString()}</h3>
                            <button className="btn-clear" onClick={clearDateSelection}>
                                <i className="fas fa-times"></i> Clear
                            </button>
                        </div>
                        <div className="meeting-list">
                            {getSelectedDateMeetings().length > 0 ? (
                                getSelectedDateMeetings().map(meeting => (
                                    <div key={meeting.id} className="meeting-item">
                                        <div className="meeting-time">
                                            <div className="time">{meeting.time}</div>
                                            <div className="duration">{meeting.duration} min</div>
                                            <div className="countdown">
                                                {getCountdown(meeting.date, meeting.time)}
                                            </div>
                                        </div>
                                        <div className="meeting-details">
                                            <h4>{meeting.title}</h4>
                                            <p>{meeting.description}</p>
                                            <div className="meeting-participants">
                                                {meeting.allMembers ? (
                                                    <div className="all-members-badge">
                                                        <i className="fas fa-users"></i>
                                                        All members
                                                    </div>
                                                ) : (
                                                    renderParticipants(meeting.participants)
                                                )}
                                            </div>
                                        </div>
                                        <div className="meeting-actions">
                                            <button
                                                className="btn-details"
                                                onClick={() => openMeetingDetails(meeting)}
                                            >
                                                Details
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="no-meetings">
                                    <p>No meetings scheduled for this date</p>
                                    {hasPermissionToCreateMeeting(user) && (
                                        <button
                                            className="btn-new-meeting"
                                            onClick={() => setShowNewMeetingModal(true)}
                                        >
                                            <i className="fas fa-plus"></i> Schedule Meeting
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Search Results */}
                {showSearchResults && (
                    <div className="meetings-section">
                        <div className="section-header">
                            <h3>Search Results: "{searchTerm}"</h3>
                            <button className="btn-clear" onClick={() => setShowSearchResults(false)}>
                                <i className="fas fa-times"></i> Clear Search
                            </button>
                        </div>
                        <div className="meeting-list">
                            {searchResults.length > 0 ? (
                                searchResults.map(meeting => (
                                    <div key={meeting.id} className="meeting-item">
                                        <div className="meeting-time">
                                            <div className="time">{meeting.time}</div>
                                            <div className="duration">{meeting.duration} min</div>
                                            <div className="countdown">
                                                {getCountdown(meeting.date, meeting.time)}
                                            </div>
                                        </div>
                                        <div className="meeting-details">
                                            <h4>{meeting.title}</h4>
                                            <p>{meeting.description}</p>
                                            <div className="meeting-participants">
                                                {meeting.allMembers ? (
                                                    <div className="all-members-badge">
                                                        <i className="fas fa-users"></i>
                                                        All members
                                                    </div>
                                                ) : (
                                                    renderParticipants(meeting.participants)
                                                )}
                                            </div>
                                        </div>
                                        <div className="meeting-actions">
                                            <button
                                                className="btn-details"
                                                onClick={() => openMeetingDetails(meeting)}
                                            >
                                                Details
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="no-meetings">
                                    <p>No meetings found matching "{searchTerm}"</p>
                                    {hasPermissionToCreateMeeting(user) && (
                                        <button
                                            className="btn-new-meeting"
                                            onClick={() => setShowNewMeetingModal(true)}
                                        >
                                            <i className="fas fa-plus"></i> Schedule Meeting
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="meetings-section">
                    <h3>Today's Meetings</h3>
                    <div className="meeting-list">
                        {todaysMeetings.length > 0 ? (
                            todaysMeetings.map(meeting => (
                                <div key={meeting.id} className="meeting-item">
                                    <div className="meeting-time">
                                        <div className="time">{meeting.time}</div>
                                        <div className="duration">{meeting.duration} min</div>
                                        <div className="countdown">
                                            {getCountdown(meeting.date, meeting.time)}
                                        </div>
                                    </div>
                                    <div className="meeting-details">
                                        <h4>{meeting.title}</h4>
                                        <p>{meeting.description}</p>
                                        <div className="meeting-participants">
                                            {meeting.allMembers ? (
                                                <div className="all-members-badge">
                                                    <i className="fas fa-users"></i>
                                                    All members
                                                </div>
                                            ) : (
                                                renderParticipants(meeting.participants)
                                            )}
                                        </div>
                                    </div>
                                    <div className="meeting-actions">
                                        <button
                                            className="btn-details"
                                            onClick={() => openMeetingDetails(meeting)}
                                        >
                                            Details
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="no-meetings">
                                <p>No meetings scheduled for today</p>
                                {hasPermissionToCreateMeeting(user) && (
                                    <button
                                        className="btn-new-meeting"
                                        onClick={() => setShowNewMeetingModal(true)}
                                    >
                                        <i className="fas fa-plus"></i> Schedule Meeting
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="meetings-section">
                    <h3>Tomorrow's Meetings</h3>
                    <div className="meeting-list">
                        {tomorrowsMeetings.length > 0 ? (
                            tomorrowsMeetings.map(meeting => (
                                <div key={meeting.id} className="meeting-item">
                                    <div className="meeting-time">
                                        <div className="time">{meeting.time}</div>
                                        <div className="duration">{meeting.duration} min</div>
                                        <div className="countdown">
                                            {getCountdown(meeting.date, meeting.time)}
                                        </div>
                                    </div>
                                    <div className="meeting-details">
                                        <h4>{meeting.title}</h4>
                                        <p>{meeting.description}</p>
                                        <div className="meeting-participants">
                                            {meeting.allMembers ? (
                                                <div className="all-members-badge">
                                                    <i className="fas fa-users"></i>
                                                    All members
                                                </div>
                                            ) : (
                                                renderParticipants(meeting.participants)
                                            )}
                                        </div>
                                    </div>
                                    <div className="meeting-actions">
                                        <button
                                            className="btn-details"
                                            onClick={() => openMeetingDetails(meeting)}
                                        >
                                            Details
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="no-meetings">
                                <p>No meetings scheduled for tomorrow</p>
                                {hasPermissionToCreateMeeting(user) && (
                                    <button
                                        className="btn-new-meeting"
                                        onClick={() => setShowNewMeetingModal(true)}
                                    >
                                        <i className="fas fa-plus"></i> Schedule Meeting
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* New Meeting Modal */}
                {showNewMeetingModal && (
                    <div className="modal-overlay" onClick={() => setShowNewMeetingModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>Create New Meeting</h3>
                                <button
                                    className="btn-close"
                                    onClick={() => setShowNewMeetingModal(false)}
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>

                            <form onSubmit={handleCreateMeeting} className="meeting-form">
                                <div className="form-group">
                                    <label htmlFor="meetingTitle">Meeting Title *</label>
                                    <input
                                        type="text"
                                        id="meetingTitle"
                                        value={newMeetingData.title}
                                        onChange={(e) => setNewMeetingData(prev => ({
                                            ...prev,
                                            title: e.target.value
                                        }))}
                                        placeholder="Enter meeting title"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="meetingDescription">Description</label>
                                    <textarea
                                        id="meetingDescription"
                                        value={newMeetingData.description}
                                        onChange={(e) => setNewMeetingData(prev => ({
                                            ...prev,
                                            description: e.target.value
                                        }))}
                                        placeholder="Enter meeting description"
                                        rows={3}
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="meetingDate">Date *</label>
                                        <input
                                            type="date"
                                            id="meetingDate"
                                            value={newMeetingData.date}
                                            onChange={(e) => setNewMeetingData(prev => ({
                                                ...prev,
                                                date: e.target.value
                                            }))}
                                            min={new Date().toISOString().split('T')[0]}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="meetingTime">Time *</label>
                                        <input
                                            type="time"
                                            id="meetingTime"
                                            value={newMeetingData.time}
                                            onChange={(e) => setNewMeetingData(prev => ({
                                                ...prev,
                                                time: e.target.value
                                            }))}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="meetingDuration">Duration (minutes)</label>
                                        <select
                                            id="meetingDuration"
                                            value={newMeetingData.duration}
                                            onChange={(e) => setNewMeetingData(prev => ({
                                                ...prev,
                                                duration: parseInt(e.target.value)
                                            }))}
                                        >
                                            <option value={15}>15 minutes</option>
                                            <option value={30}>30 minutes</option>
                                            <option value={60}>1 hour</option>
                                            <option value={90}>1.5 hours</option>
                                            <option value={120}>2 hours</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Participants</label>
                                    <div className="participants-section">
                                        <div className="all-members-toggle">
                                            <label className="toggle-switch">
                                                <input
                                                    type="checkbox"
                                                    checked={newMeetingData.allMembers}
                                                    onChange={toggleAllMembers}
                                                />
                                                <span className="toggle-slider"></span>
                                                All members
                                            </label>
                                        </div>

                                        {!newMeetingData.allMembers && (
                                            <div className="members-list">
                                                {teamMembers.map(member => (
                                                    <div
                                                        key={member.id}
                                                        className={`member-item ${newMeetingData.participants.some(p => p.id === member.id)
                                                            ? 'selected' : ''
                                                            }`}
                                                        onClick={() => toggleParticipant(member)}
                                                    >
                                                        <div className="member-avatar">
                                                            {member.profileImage ? (
                                                                <img src={member.profileImage} alt={member.nama} />
                                                            ) : (
                                                                <div className="text-avatar">
                                                                    {member.nama?.charAt(0) || '?'}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="member-info">
                                                            <div className="member-name">{member.nama}</div>
                                                            <div className="member-role">{member.role || 'Team Member'}</div>
                                                        </div>
                                                        <div className="member-checkbox">
                                                            <i className={`fas ${newMeetingData.participants.some(p => p.id === member.id)
                                                                ? 'fa-check-circle' : 'fa-circle'
                                                                }`}></i>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="form-actions">
                                    <button
                                        type="button"
                                        className="btn-cancel"
                                        onClick={() => setShowNewMeetingModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn-create"
                                    >
                                        Create Meeting
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Meeting Details Modal */}
                {showMeetingDetailModal && selectedMeeting && (
                    <div className="modal-overlay" onClick={closeMeetingDetails}>
                        <div className="modal-content meeting-detail-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>Meeting Details</h3>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={closeMeetingDetails}
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                            <div className="modal-body">
                                <div className="meeting-detail-info">
                                    <div className="detail-row">
                                        <span className="detail-label">Meeting Name:</span>
                                        <span className="detail-value">{selectedMeeting.title || 'Untitled Meeting'}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Description:</span>
                                        <span className="detail-value">{selectedMeeting.description || 'No description provided'}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Date:</span>
                                        <span className="detail-value">
                                            {new Date(selectedMeeting.date).toLocaleDateString(undefined, { 
                                                weekday: 'long', 
                                                year: 'numeric', 
                                                month: 'long', 
                                                day: 'numeric' 
                                            })}
                                        </span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Time:</span>
                                        <span className="detail-value">{formatTime(selectedMeeting.time)}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Duration:</span>
                                        <span className="detail-value">{formatDuration(selectedMeeting.duration)}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Members:</span>
                                        <div className="detail-value members-list">
                                            {selectedMeeting.allMembers ? (
                                                <div className="all-members-indicator">
                                                    <i className="fas fa-users"></i>
                                                    <span>All Members</span>
                                                </div>
                                            ) : selectedMeeting.participants && selectedMeeting.participants.length > 0 ? (
                                                <div className="participants-grid">
                                                    {selectedMeeting.participants.map((participant, index) => (
                                                        <div key={participant?.id || index} className="participant-card">
                                                            <div className="participant-avatar">
                                                                {participant?.profileImage ? (
                                                                    <img
                                                                        src={participant.profileImage}
                                                                        alt={participant.nama || 'Participant'}
                                                                        onError={(e) => {
                                                                            e.target.onerror = null;
                                                                            e.target.parentNode.innerHTML = `<div class="text-avatar">${(participant?.nama?.charAt(0) || '?').toUpperCase()}</div>`;
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <div className="text-avatar">
                                                                        {(participant?.nama?.charAt(0) || '?').toUpperCase()}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="participant-info">
                                                                <span className="participant-name">{participant?.nama || 'Unknown'}</span>
                                                                <span className="participant-role">{participant?.role || 'Member'}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="no-members-indicator">
                                                    <i className="fas fa-user-slash"></i>
                                                    <span>No Members</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Meetings;
