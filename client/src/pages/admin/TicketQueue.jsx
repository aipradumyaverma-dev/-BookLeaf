import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../../components/Badges';
import { formatDistanceToNow } from 'date-fns';
import { getSocket } from '../../services/socket';

const CATEGORIES = [
    'Royalty & Payments', 'ISBN & Metadata Issues', 'Printing & Quality',
    'Distribution & Availability', 'Book Status & Production Updates', 'General Inquiry',
];
const STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'];
const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];

export default function TicketQueue() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [tickets, setTickets] = useState([]);
    const [pagination, setPagination] = useState({});
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState({
        status: searchParams.get('status') || '',
        category: '',
        priority: '',
        search: '',
        assignedToMe: false,
    });

    useEffect(() => {
        fetchTickets();
    }, [page, filters]);

    // Real-time updates
    useEffect(() => {
        const socket = getSocket();
        const handleNewTicket = () => fetchTickets();
        const handleUpdate = () => fetchTickets();
        socket.on('new-ticket', handleNewTicket);
        socket.on('ticket-updated', handleUpdate);
        return () => {
            socket.off('new-ticket', handleNewTicket);
            socket.off('ticket-updated', handleUpdate);
        };
    }, []);

    const fetchTickets = async () => {
        try {
            const params = new URLSearchParams({ page, limit: 15 });
            if (filters.status) params.set('status', filters.status);
            if (filters.category) params.set('category', filters.category);
            if (filters.priority) params.set('priority', filters.priority);
            if (filters.search) params.set('search', filters.search);
            if (filters.assignedToMe) params.set('assignedToMe', 'true');

            const res = await api.get(`/admin/tickets?${params.toString()}`);
            setTickets(res.data.tickets);
            setPagination(res.data.pagination);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const updateFilter = (key, val) => {
        setFilters(prev => ({ ...prev, [key]: val }));
        setPage(1);
    };

    const clearFilters = () => {
        setFilters({ status: '', category: '', priority: '', search: '', assignedToMe: false });
        setPage(1);
    };

    const hasFilters = filters.status || filters.category || filters.priority || filters.search || filters.assignedToMe;

    return (
        <div className="page-container fade-in">
            <div className="topbar" style={{ marginLeft: '-32px', marginRight: '-32px', paddingLeft: '32px', marginTop: '-28px', marginBottom: '28px' }}>
                <span className="topbar-title">Ticket Queue</span>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    {pagination.total || 0} total tickets
                </span>
            </div>

            <div className="page-header">
                <h1 className="page-title">Ticket Queue</h1>
                <p className="page-subtitle">Manage and respond to author support requests</p>
            </div>

            {/* Filters */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px 20px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Search */}
                    <div className="search-input-wrap">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search tickets..."
                            value={filters.search}
                            onChange={e => updateFilter('search', e.target.value)}
                        />
                    </div>

                    {/* Status */}
                    <select
                        className="form-select"
                        style={{ width: '140px', borderRadius: '20px', padding: '7px 32px 7px 12px', fontSize: '12px' }}
                        value={filters.status}
                        onChange={e => updateFilter('status', e.target.value)}
                    >
                        <option value="">All Status</option>
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>

                    {/* Priority */}
                    <select
                        className="form-select"
                        style={{ width: '140px', borderRadius: '20px', padding: '7px 32px 7px 12px', fontSize: '12px' }}
                        value={filters.priority}
                        onChange={e => updateFilter('priority', e.target.value)}
                    >
                        <option value="">All Priority</option>
                        {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>

                    {/* Category */}
                    <select
                        className="form-select"
                        style={{ width: '190px', borderRadius: '20px', padding: '7px 32px 7px 12px', fontSize: '12px' }}
                        value={filters.category}
                        onChange={e => updateFilter('category', e.target.value)}
                    >
                        <option value="">All Categories</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    {hasFilters && (
                        <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
                            ✕ Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Tickets List */}
            {loading ? (
                <div className="loading-page" style={{ minHeight: '200px' }}>
                    <div className="spinner"></div>
                </div>
            ) : tickets.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-icon">🎫</div>
                        <div className="empty-title">No tickets found</div>
                        <div className="empty-msg">
                            {hasFilters ? 'Try adjusting your filters' : 'Author tickets will appear here'}
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    {tickets.map(ticket => (
                        <div
                            key={ticket._id}
                            className={`ticket-card priority-${ticket.priority?.toLowerCase()}`}
                            onClick={() => navigate(`/admin/tickets/${ticket._id}`)}
                        >
                            <div className="ticket-meta">
                                <span className="ticket-id">{ticket.ticketId}</span>
                                <StatusBadge status={ticket.status} />
                                <PriorityBadge priority={ticket.priority} />
                                <CategoryBadge category={ticket.category} />
                                {ticket.assignedToName && (
                                    <span className="tag">👤 {ticket.assignedToName}</span>
                                )}
                            </div>
                            <div className="ticket-subject">{ticket.subject}</div>
                            <div className="ticket-preview">{ticket.description}</div>
                            <div className="ticket-footer">
                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                    by <strong>{ticket.authorName}</strong>
                                    {ticket.bookTitle && ticket.bookTitle !== 'General / Account Level' && (
                                        <> · 📖 {ticket.bookTitle}</>
                                    )}
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    {ticket.responses?.length > 0 && (
                                        <span style={{ fontSize: '11px', color: 'var(--emerald)' }}>
                                            💬 {ticket.responses.length} response{ticket.responses.length !== 1 ? 's' : ''}
                                        </span>
                                    )}
                                    <span className="ticket-time">
                                        {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Pagination */}
                    {pagination.pages > 1 && (
                        <div className="pagination">
                            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                                <button
                                    key={p}
                                    className={`page-btn ${p === page ? 'active' : ''}`}
                                    onClick={() => setPage(p)}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
