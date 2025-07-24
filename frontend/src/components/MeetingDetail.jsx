import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMeetingById } from '../services/meetingService';
import Sidebar from './Sidebar';
import '../styles/Meetings.css';

function MeetingDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [meeting, setMeeting] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMeeting = async () => {
            try {
                setLoading(true);
                const data = await getMeetingById(id);
                setMeeting(data);
                setLoading(false);
            } catch (err) {
                setError('Failed to fetch meeting details');
                setLoading(false);
                console.error('Error fetching meeting:', err);
            }
        };

        fetchMeeting();
    }, [id]);

    if (loading) {
        return (
            <div className="dashboard-main">
                <Sidebar />
                <div className="dashboard-content">
                    <div className="loading-spinner"></div>
                </div>
            </div>
        );
    }

    if (error || !meeting) {
        return (
            <div className="dashboard-main">
                <Sidebar />
                <div className="dashboard-content">
                    <div className="error-message">
                        <i className="fas fa-exclamation-circle"></i>
                        <p>{error || 'Meeting not found'}</p>
                        <button onClick={() => navigate('/meetings')} className="btn-return">
                            Back to Meetings
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Format duration for display
    const formatDuration = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) {
            return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
        }
        return `${mins}m`;
    };

    // Format time for display
    const formatTime = (timeString) => {
        if (!timeString) return '';
        try {
            const [hours, minutes] = timeString.split(':').map(Number);
            return new Date(0, 0, 0, hours, minutes).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return timeString;
        }
    };

    // Calculate countdown until meeting
    const getCountdownText = () => {
        const now = new Date();
        const meetingDate = new Date(`${meeting.date}T${meeting.time}`);

        if (isNaN(meetingDate.getTime())) {
            return '';
        }

        const diffMs = meetingDate - now;
        if (diffMs < 0) return 'Meeting has started';

        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        if (diffHrs > 24) {
            const days = Math.floor(diffHrs / 24);
            return `${days} day${days !== 1 ? 's' : ''} left`;
        } else if (diffHrs > 0) {
            return `${diffHrs}h ${diffMins}m left`;
        } else {
            return `${diffMins}m left`;
        }
    };

    return (
        <div className="dashboard-main">
            <Sidebar />
            <div className="dashboard-content">
                <div className="meeting-header">
                    <button className="back-button" onClick={() => navigate('/meetings')}>
                        <i className="fas fa-arrow-left"></i> Back
                    </button>
                    <div className="meeting-actions">
                        <button className="btn-join">Join Meeting</button>
                        <button className="btn-edit"><i className="fas fa-edit"></i></button>
                        <button className="btn-delete"><i className="fas fa-trash"></i></button>
                    </div>
                </div>

                <div className="meeting-detail-card">
                    <div className="meeting-time-block">
                        <div className="time-display">
                            {formatTime(meeting.time)}
                        </div>
                        <div className="duration-display">
                            {formatDuration(meeting.duration)}
                        </div>
                        <div className="countdown-display">
                            {getCountdownText()}
                        </div>
                    </div>

                    <div className="meeting-info-block">
                        <h2 className="meeting-title">{meeting.title || 'Untitled Meeting'}</h2>
                        <p className="meeting-description">{meeting.description || 'No description provided.'}</p>

                        <div className="meeting-participants">
                            {meeting.allMembers ? (
                                <div className="all-members-badge">
                                    <i className="fas fa-users"></i> All members
                                </div>
                            ) : (
                                <>
                                    {meeting.participants && meeting.participants.length > 0 ? (
                                        <div className="participants-list">
                                            {meeting.participants.map((participant, index) => (
                                                <div key={participant?.id || index} className="participant-item">
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
                                        <div className="no-participants">No participants</div>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="meeting-meta">
                            <div className="meta-item">
                                <i className="fas fa-calendar"></i>
                                <span>{new Date(meeting.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                            <div className="meta-item">
                                <i className="fas fa-user"></i>
                                <span>Created by {meeting.createdBy?.nama || 'Unknown'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MeetingDetail;