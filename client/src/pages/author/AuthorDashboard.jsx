import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { StatusBadge, PriorityBadge } from '../../components/Badges';
import { formatDistanceToNow } from 'date-fns';

export default function AuthorDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [summary, setSummary] = useState(null);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [booksRes, ticketsRes] = await Promise.all([
                    api.get('/books/my-books'),
                    api.get('/tickets/my-tickets'),
                ]);
                setSummary(booksRes.data.summary);
                setTickets(ticketsRes.data.tickets.slice(0, 5));
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return (
        <div className="loading-page">
            <div className="spinner"></div>
        </div>
    );

    const greeting = () => {
        const h = new Date().getHours();
        if (h < 12) return 'Good Morning';
        if (h < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <div className="page-container fade-in">
            <div className="topbar" style={{ marginLeft: '-32px', marginRight: '-32px', paddingLeft: '32px', marginTop: '-28px', marginBottom: '28px' }}>
                <span className="topbar-title">Dashboard</span>
                <button className="btn btn-primary" onClick={() => navigate('/author/submit-ticket')}>
                    + New Support Query
                </button>
            </div>

            <div className="page-header">
                <h1 className="page-title">{greeting()}, {user?.name?.split(' ')[0]}! 👋</h1>
                <p className="page-subtitle">Here's an overview of your publishing journey with BookLeaf</p>
            </div>

            {/* Stats */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon purple">📚</div>
                    <div className="stat-value">{summary?.totalBooks ?? 0}</div>
                    <div className="stat-label">Total Books</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon emerald">✓</div>
                    <div className="stat-value">{summary?.publishedBooks ?? 0}</div>
                    <div className="stat-label">Published & Live</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon gold">📦</div>
                    <div className="stat-value">{summary?.totalCopiesSold?.toLocaleString() ?? 0}</div>
                    <div className="stat-label">Copies Sold</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon sky">₹</div>
                    <div className="stat-value">₹{summary?.totalRoyaltyEarned?.toLocaleString() ?? 0}</div>
                    <div className="stat-label">Total Royalty Earned</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon emerald">✓</div>
                    <div className="stat-value">₹{summary?.totalRoyaltyPaid?.toLocaleString() ?? 0}</div>
                    <div className="stat-label">Royalty Paid</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon orange">⏳</div>
                    <div className="stat-value royalty-pending">₹{summary?.totalRoyaltyPending?.toLocaleString() ?? 0}</div>
                    <div className="stat-label">Royalty Pending</div>
                </div>
            </div>

            {/* Info Banner */}
            {summary?.totalRoyaltyPending > 0 && (
                <div style={{
                    background: 'rgba(245,158,11,0.08)',
                    border: '1px solid rgba(245,158,11,0.25)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '14px 18px',
                    marginBottom: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                }}>
                    <span style={{ fontSize: '20px' }}>💡</span>
                    <div>
                        You have <strong style={{ color: 'var(--gold)' }}>₹{summary.totalRoyaltyPending.toLocaleString()}</strong> in pending royalties.
                        Royalties are paid within 45 days after each quarter ends. Minimum payout threshold: ₹1,000.
                    </div>
                </div>
            )}

            {/* Recent Tickets */}
            <div className="card">
                <div className="card-header">
                    <span className="card-title">Recent Support Tickets</span>
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate('/author/tickets')}>
                        View All →
                    </button>
                </div>

                {tickets.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">🎫</div>
                        <div className="empty-title">No tickets yet</div>
                        <div className="empty-msg">Submit a support query if you need help with your books</div>
                    </div>
                ) : (
                    tickets.map(ticket => (
                        <div
                            key={ticket._id}
                            className={`ticket-card priority-${ticket.priority?.toLowerCase()}`}
                            onClick={() => navigate(`/author/tickets/${ticket._id}`)}
                        >
                            <div className="ticket-meta">
                                <span className="ticket-id">{ticket.ticketId}</span>
                                <StatusBadge status={ticket.status} />
                                <PriorityBadge priority={ticket.priority} />
                            </div>
                            <div className="ticket-subject">{ticket.subject}</div>
                            <div className="ticket-footer">
                                <span className="ticket-time">
                                    {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                                </span>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                    {ticket.responses?.length || 0} response{ticket.responses?.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
