import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../../components/Badges';
import { format } from 'date-fns';
import { getSocket } from '../../services/socket';
import toast from 'react-hot-toast';

export default function TicketDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const threadRef = useRef(null);

    useEffect(() => {
        fetchTicket();

        // Real-time update
        const socket = getSocket();
        const handleResponse = (data) => {
            if (data.ticketDbId === id) {
                fetchTicket();
                toast.success('📬 You received a response from BookLeaf!');
            }
        };
        const handleUpdate = (data) => {
            if (data.ticketDbId === id || data._id === id) {
                fetchTicket();
            }
        };
        socket.on('ticket-response', handleResponse);
        socket.on('ticket-updated', handleUpdate);

        return () => {
            socket.off('ticket-response', handleResponse);
            socket.off('ticket-updated', handleUpdate);
        };
    }, [id]);

    useEffect(() => {
        if (threadRef.current) {
            threadRef.current.scrollTop = threadRef.current.scrollHeight;
        }
    }, [ticket?.responses]);

    const fetchTicket = async () => {
        try {
            const res = await api.get(`/tickets/${id}`);
            setTicket(res.data.ticket);
        } catch (err) {
            console.error(err);
            toast.error('Ticket not found');
            navigate('/author/tickets');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading-page"><div className="spinner"></div></div>;
    if (!ticket) return null;

    return (
        <div className="page-container fade-in">
            <div className="topbar" style={{ marginLeft: '-32px', marginRight: '-32px', paddingLeft: '32px', marginTop: '-28px', marginBottom: '28px' }}>
                <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => navigate('/author/tickets')}
                >
                    ← Back to Tickets
                </button>
                <span className="topbar-title">{ticket.ticketId}</span>
            </div>

            <div style={{ maxWidth: '760px' }}>
                {/* Ticket Header */}
                <div className="card" style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                <span className="ticket-id">{ticket.ticketId}</span>
                                <StatusBadge status={ticket.status} />
                            </div>
                            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                                {ticket.subject}
                            </h2>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                <PriorityBadge priority={ticket.priority} />
                                <CategoryBadge category={ticket.category} />
                            </div>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'right' }}>
                            <div>Opened: {format(new Date(ticket.createdAt), 'dd MMM yyyy, hh:mm a')}</div>
                            {ticket.bookTitle && ticket.bookTitle !== 'General / Account Level' && (
                                <div style={{ color: 'var(--accent-secondary)', marginTop: '4px' }}>📖 {ticket.bookTitle}</div>
                            )}
                        </div>
                    </div>

                    {/* Original Query */}
                    <div style={{
                        background: 'var(--bg-input)',
                        borderRadius: 'var(--radius-md)',
                        padding: '14px 16px',
                    }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                            Your Original Query
                        </div>
                        <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                            {ticket.description}
                        </p>
                    </div>
                </div>

                {/* Responses */}
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">Conversation Thread</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="notif-dot"></span>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Live updates enabled</span>
                        </div>
                    </div>

                    {ticket.responses?.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '40px 20px',
                            color: 'var(--text-muted)',
                            fontSize: '13px',
                        }}>
                            <div style={{ fontSize: '36px', marginBottom: '12px' }}>⏳</div>
                            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Awaiting response</div>
                            <div>Our support team will respond within 24–48 hours. We'll notify you when they do.</div>
                        </div>
                    ) : (
                        <div className="response-thread" ref={threadRef} style={{ maxHeight: '500px', overflowY: 'auto', paddingRight: '4px' }}>
                            {ticket.responses.map((r, i) => (
                                <div
                                    key={i}
                                    className={`response-bubble ${r.responderRole === 'admin' ? 'admin' : 'author'}`}
                                >
                                    <div className="response-meta">
                                        <strong>{r.responderRole === 'admin' ? '🔷 BookLeaf Support' : '✍ You'}</strong>
                                        {' · '}
                                        {format(new Date(r.createdAt), 'dd MMM, hh:mm a')}
                                    </div>
                                    <div className="response-text">{r.message}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
