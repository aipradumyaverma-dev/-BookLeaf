import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../../components/Badges';
import { formatDistanceToNow } from 'date-fns';

export default function MyTickets() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTickets = async () => {
            try {
                const res = await api.get('/tickets/my-tickets');
                setTickets(res.data.tickets);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchTickets();
    }, []);

    const filters = [
        { label: 'All', value: 'all' },
        { label: 'Open', value: 'Open' },
        { label: 'In Progress', value: 'In Progress' },
        { label: 'Resolved', value: 'Resolved' },
        { label: 'Closed', value: 'Closed' },
    ];

    const filtered = filter === 'all' ? tickets : tickets.filter(t => t.status === filter);

    if (loading) return <div className="loading-page"><div className="spinner"></div></div>;

    return (
        <div className="page-container fade-in">
            <div className="topbar" style={{ marginLeft: '-32px', marginRight: '-32px', paddingLeft: '32px', marginTop: '-28px', marginBottom: '28px' }}>
                <span className="topbar-title">My Tickets</span>
                <button className="btn btn-primary" onClick={() => navigate('/author/submit-ticket')}>
                    + New Query
                </button>
            </div>

            <div className="page-header">
                <h1 className="page-title">My Support Tickets</h1>
                <p className="page-subtitle">{tickets.length} total ticket{tickets.length !== 1 ? 's' : ''}</p>
            </div>

            {/* Filter Tabs */}
            <div className="filters-bar">
                {filters.map(f => (
                    <button
                        key={f.value}
                        className={`filter-chip ${filter === f.value ? 'active' : ''}`}
                        onClick={() => setFilter(f.value)}
                    >
                        {f.label}
                        <span style={{
                            background: filter === f.value ? 'rgba(139,92,246,0.3)' : 'var(--bg-input)',
                            padding: '1px 6px',
                            borderRadius: '10px',
                            fontSize: '10px',
                            fontWeight: 700,
                        }}>
                            {f.value === 'all' ? tickets.length : tickets.filter(t => t.status === f.value).length}
                        </span>
                    </button>
                ))}
            </div>

            {filtered.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-icon">🎫</div>
                        <div className="empty-title">No tickets found</div>
                        <div className="empty-msg">
                            {filter === 'all'
                                ? 'You haven\'t submitted any support queries yet'
                                : `No ${filter} tickets`}
                        </div>
                    </div>
                </div>
            ) : (
                <div>
                    {filtered.map(ticket => (
                        <div
                            key={ticket._id}
                            className={`ticket-card priority-${ticket.priority?.toLowerCase()}`}
                            onClick={() => navigate(`/author/tickets/${ticket._id}`)}
                        >
                            <div className="ticket-meta">
                                <span className="ticket-id">{ticket.ticketId}</span>
                                <StatusBadge status={ticket.status} />
                                <PriorityBadge priority={ticket.priority} />
                                <CategoryBadge category={ticket.category} />
                            </div>
                            <div className="ticket-subject">{ticket.subject}</div>
                            {ticket.bookTitle && ticket.bookTitle !== 'General / Account Level' && (
                                <div style={{ fontSize: '12px', color: 'var(--accent-secondary)', marginBottom: '4px' }}>
                                    📖 {ticket.bookTitle}
                                </div>
                            )}
                            <div className="ticket-preview">{ticket.description}</div>
                            <div className="ticket-footer">
                                <span className="ticket-time">
                                    {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {ticket.responses?.length > 0 && (
                                        <span style={{
                                            fontSize: '11px',
                                            color: 'var(--emerald)',
                                            background: 'rgba(16,185,129,0.1)',
                                            padding: '2px 8px',
                                            borderRadius: '10px',
                                        }}>
                                            💬 {ticket.responses.length} response{ticket.responses.length !== 1 ? 's' : ''}
                                        </span>
                                    )}
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Click to view →</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
