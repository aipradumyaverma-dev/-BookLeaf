import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { StatusBadge, PriorityBadge } from '../../components/Badges';
import { formatDistanceToNow } from 'date-fns';

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/admin/stats');
                setStats(res.data.stats);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div className="loading-page"><div className="spinner"></div></div>;

    const priorityColors = { Critical: 'var(--rose)', High: 'var(--orange)', Medium: 'var(--gold)', Low: 'var(--emerald)' };

    return (
        <div className="page-container fade-in">
            <div className="topbar" style={{ marginLeft: '-32px', marginRight: '-32px', paddingLeft: '32px', marginTop: '-28px', marginBottom: '28px' }}>
                <span className="topbar-title">Admin Dashboard</span>
                <button className="btn btn-primary btn-sm" onClick={() => navigate('/admin/tickets')}>
                    View All Tickets →
                </button>
            </div>

            <div className="page-header">
                <h1 className="page-title">Operations Dashboard</h1>
                <p className="page-subtitle">BookLeaf Author Support Overview</p>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/tickets')}>
                    <div className="stat-icon purple">🎫</div>
                    <div className="stat-value">{stats?.totalTickets ?? 0}</div>
                    <div className="stat-label">Total Tickets</div>
                </div>
                <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/tickets?status=Open')}>
                    <div className="stat-icon sky">📬</div>
                    <div className="stat-value">{stats?.openTickets ?? 0}</div>
                    <div className="stat-label">Open Tickets</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon gold">🔄</div>
                    <div className="stat-value">{stats?.inProgressTickets ?? 0}</div>
                    <div className="stat-label">In Progress</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon emerald">✓</div>
                    <div className="stat-value">{stats?.resolvedTickets ?? 0}</div>
                    <div className="stat-label">Resolved</div>
                </div>
                <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/authors')}>
                    <div className="stat-icon orange">✍️</div>
                    <div className="stat-value">{stats?.totalAuthors ?? 0}</div>
                    <div className="stat-label">Authors</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon purple">📚</div>
                    <div className="stat-value">{stats?.totalBooks ?? 0}</div>
                    <div className="stat-label">Books</div>
                </div>
            </div>

            <div className="two-col" style={{ marginBottom: '24px' }}>
                {/* Category Breakdown */}
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">Tickets by Category</span>
                    </div>
                    {stats?.categoryStats?.length === 0 ? (
                        <div className="empty-state" style={{ padding: '30px' }}>
                            <div className="empty-msg">No data yet</div>
                        </div>
                    ) : (
                        stats?.categoryStats?.map(cat => {
                            const pct = stats.totalTickets > 0 ? Math.round((cat.count / stats.totalTickets) * 100) : 0;
                            return (
                                <div key={cat._id} style={{ marginBottom: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>{cat._id || 'General Inquiry'}</span>
                                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{cat.count} ({pct}%)</span>
                                    </div>
                                    <div style={{ background: 'var(--bg-input)', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%',
                                            width: `${pct}%`,
                                            background: 'var(--accent-gradient)',
                                            borderRadius: '4px',
                                            transition: 'width 0.8s ease',
                                        }}></div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Priority Breakdown */}
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">Tickets by Priority</span>
                    </div>
                    {stats?.priorityStats?.length === 0 ? (
                        <div className="empty-state" style={{ padding: '30px' }}>
                            <div className="empty-msg">No data yet</div>
                        </div>
                    ) : (
                        ['Critical', 'High', 'Medium', 'Low'].map(p => {
                            const stat = stats?.priorityStats?.find(s => s._id === p);
                            const count = stat?.count || 0;
                            const pct = stats.totalTickets > 0 ? Math.round((count / stats.totalTickets) * 100) : 0;
                            return (
                                <div key={p} style={{ marginBottom: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                                        <span style={{ color: priorityColors[p] || 'var(--text-secondary)', fontWeight: 500 }}>{p}</span>
                                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{count} ({pct}%)</span>
                                    </div>
                                    <div style={{ background: 'var(--bg-input)', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%',
                                            width: `${pct}%`,
                                            background: priorityColors[p] || 'var(--text-muted)',
                                            borderRadius: '4px',
                                            transition: 'width 0.8s ease',
                                        }}></div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Recent Tickets */}
            <div className="card">
                <div className="card-header">
                    <span className="card-title">Recent Tickets</span>
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/tickets')}>
                        View All →
                    </button>
                </div>
                {stats?.recentTickets?.length === 0 ? (
                    <div className="empty-state" style={{ padding: '30px' }}>
                        <div className="empty-icon">🎫</div>
                        <div className="empty-title">No tickets yet</div>
                    </div>
                ) : (
                    stats?.recentTickets?.map(ticket => (
                        <div
                            key={ticket._id}
                            className={`ticket-card priority-${ticket.priority?.toLowerCase()}`}
                            onClick={() => navigate(`/admin/tickets/${ticket._id}`)}
                        >
                            <div className="ticket-meta">
                                <span className="ticket-id">{ticket.ticketId}</span>
                                <StatusBadge status={ticket.status} />
                                <PriorityBadge priority={ticket.priority} />
                            </div>
                            <div className="ticket-subject">{ticket.subject}</div>
                            <div className="ticket-footer">
                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                    by {ticket.authorName}
                                </span>
                                <span className="ticket-time">
                                    {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
