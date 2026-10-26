import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../../components/Badges';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const CATEGORIES = [
    'Royalty & Payments', 'ISBN & Metadata Issues', 'Printing & Quality',
    'Distribution & Availability', 'Book Status & Production Updates', 'General Inquiry',
];
const STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'];
const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];

export default function AdminTicketDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [aiDraft, setAiDraft] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [aiAvailable, setAiAvailable] = useState(true);
    const [response, setResponse] = useState('');
    const [isInternal, setIsInternal] = useState(false);
    const [sending, setSending] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [editStatus, setEditStatus] = useState('');
    const [editCategory, setEditCategory] = useState('');
    const [editPriority, setEditPriority] = useState('');

    useEffect(() => {
        fetchTicket();
    }, [id]);

    const fetchTicket = async () => {
        try {
            const res = await api.get(`/admin/tickets/${id}`);
            const t = res.data.ticket;
            setTicket(t);
            setEditStatus(t.status);
            setEditCategory(t.category);
            setEditPriority(t.priority);
        } catch {
            toast.error('Ticket not found');
            navigate('/admin/tickets');
        } finally {
            setLoading(false);
        }
    };

    const fetchAiDraft = async () => {
        setAiLoading(true);
        try {
            const res = await api.get(`/admin/tickets/${id}/ai-draft`);
            setAiAvailable(res.data.aiAvailable);
            if (res.data.draft) {
                setAiDraft(res.data.draft);
                setResponse(res.data.draft);
                toast.success(res.data.cached ? '📋 Loaded cached AI draft' : '🤖 AI draft generated!');
            } else {
                toast('AI unavailable. Please write response manually.', { icon: '⚠️' });
            }
        } catch {
            toast.error('Failed to generate AI draft');
        } finally {
            setAiLoading(false);
        }
    };

    const updateTicket = async () => {
        setUpdating(true);
        try {
            await api.patch(`/admin/tickets/${id}`, {
                status: editStatus,
                category: editCategory,
                priority: editPriority,
            });
            toast.success('Ticket updated');
            fetchTicket();
        } catch {
            toast.error('Failed to update ticket');
        } finally {
            setUpdating(false);
        }
    };

    const assignToMe = async () => {
        try {
            await api.patch(`/admin/tickets/${id}`, { assignedTo: user.id });
            toast.success('Ticket assigned to you');
            fetchTicket();
        } catch {
            toast.error('Failed to assign ticket');
        }
    };

    const sendResponse = async () => {
        if (!response.trim()) {
            toast.error('Response cannot be empty');
            return;
        }
        setSending(true);
        try {
            await api.post(`/admin/tickets/${id}/respond`, {
                message: response.trim(),
                isInternal,
            });
            toast.success(isInternal ? 'Internal note added' : 'Response sent to author!');
            setResponse('');
            setAiDraft('');
            setIsInternal(false);
            fetchTicket();
        } catch {
            toast.error('Failed to send response');
        } finally {
            setSending(false);
        }
    };

    if (loading) return <div className="loading-page"><div className="spinner"></div></div>;
    if (!ticket) return null;

    return (
        <div className="page-container fade-in">
            <div className="topbar" style={{ marginLeft: '-32px', marginRight: '-32px', paddingLeft: '32px', marginTop: '-28px', marginBottom: '28px' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/tickets')}>
                    ← Back to Queue
                </button>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {!ticket.assignedTo && (
                        <button className="btn btn-secondary btn-sm" onClick={assignToMe}>
                            👤 Assign to Me
                        </button>
                    )}
                    {ticket.assignedToName && (
                        <span className="tag">👤 Assigned: {ticket.assignedToName}</span>
                    )}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', alignItems: 'start' }}>
                {/* Left: Main Content */}
                <div>
                    {/* Ticket Header */}
                    <div className="card" style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                    <span className="ticket-id">{ticket.ticketId}</span>
                                    <StatusBadge status={ticket.status} />
                                    {ticket.categoryOverridden && (
                                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', background: 'var(--bg-input)', padding: '2px 6px', borderRadius: '4px' }}>
                                            Category: Overridden ✏️
                                        </span>
                                    )}
                                    {ticket.priorityOverridden && (
                                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', background: 'var(--bg-input)', padding: '2px 6px', borderRadius: '4px' }}>
                                            Priority: Overridden ✏️
                                        </span>
                                    )}
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
                                <div><strong style={{ color: 'var(--text-secondary)' }}>{ticket.authorName}</strong></div>
                                <div>{ticket.authorEmail}</div>
                                <div style={{ marginTop: '4px' }}>
                                    {format(new Date(ticket.createdAt), 'dd MMM yyyy, hh:mm a')}
                                </div>
                                {ticket.bookTitle && ticket.bookTitle !== 'General / Account Level' && (
                                    <div style={{ color: 'var(--accent-secondary)', marginTop: '4px' }}>📖 {ticket.bookTitle}</div>
                                )}
                            </div>
                        </div>

                        {/* AI Classification Info */}
                        {ticket.aiCategory && (
                            <div style={{
                                background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)',
                                borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: '14px', fontSize: '12px',
                                color: 'var(--text-muted)',
                            }}>
                                🤖 <strong>AI Classification:</strong> Category: <em>{ticket.aiCategory}</em> | Priority: <em>{ticket.aiPriority}</em>
                                {(ticket.categoryOverridden || ticket.priorityOverridden) && (
                                    <span style={{ color: 'var(--gold)', marginLeft: '8px' }}>→ Manually overridden</span>
                                )}
                            </div>
                        )}

                        {/* Original Query */}
                        <div style={{
                            background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', padding: '14px 16px',
                        }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                                Author's Query
                            </div>
                            <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                                {ticket.description}
                            </p>
                        </div>
                    </div>

                    {/* Conversation Thread */}
                    <div className="card" style={{ marginBottom: '16px' }}>
                        <div className="card-header">
                            <span className="card-title">Conversation Thread</span>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                {ticket.responses?.length || 0} message{ticket.responses?.length !== 1 ? 's' : ''}
                            </span>
                        </div>

                        {ticket.responses?.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>
                                No responses yet — use the form below to reply
                            </div>
                        ) : (
                            <div className="response-thread">
                                {ticket.responses.map((r, i) => (
                                    <div key={i} className={`response-bubble ${r.responderRole === 'admin' ? (r.isInternal ? 'internal' : 'admin') : 'author'}`}>
                                        <div className="response-meta">
                                            <strong>
                                                {r.isInternal ? '🔒 Internal Note' : r.responderRole === 'admin' ? `🔷 ${r.responderName}` : `✍ ${r.responderName}`}
                                            </strong>
                                            {' · '}
                                            {format(new Date(r.createdAt), 'dd MMM, hh:mm a')}
                                            {r.isInternal && <span style={{ marginLeft: '6px', fontSize: '10px', color: 'var(--gold)' }}>(Not visible to author)</span>}
                                        </div>
                                        <div className="response-text">{r.message}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Response Compose */}
                    <div className="card">
                        <div className="card-header">
                            <span className="card-title">Compose Response</span>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={fetchAiDraft}
                                    disabled={aiLoading}
                                >
                                    {aiLoading
                                        ? <><span className="spinner" style={{ width: '12px', height: '12px', borderWidth: '2px' }}></span> Generating...</>
                                        : '🤖 Generate AI Draft'}
                                </button>
                            </div>
                        </div>

                        {/* AI Draft Box */}
                        {aiDraft && (
                            <div className="ai-draft-box" style={{ marginBottom: '16px' }}>
                                <div className="ai-draft-header">
                                    <span className="ai-badge">✨ AI Generated Draft</span>
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                                        Edit below before sending
                                    </span>
                                </div>
                                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                                    {aiDraft}
                                </p>
                            </div>
                        )}

                        {/* Response Type Toggle */}
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                            <button
                                className={`filter-chip ${!isInternal ? 'active' : ''}`}
                                onClick={() => setIsInternal(false)}
                            >
                                💬 Author Reply
                            </button>
                            <button
                                className={`filter-chip ${isInternal ? 'active' : ''}`}
                                onClick={() => setIsInternal(true)}
                            >
                                🔒 Internal Note
                            </button>
                        </div>

                        {isInternal && (
                            <div style={{
                                background: 'rgba(245,158,11,0.06)', border: '1px dashed rgba(245,158,11,0.3)',
                                borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: '10px',
                                fontSize: '12px', color: 'var(--gold)',
                            }}>
                                ⚠ Internal notes are NOT visible to the author
                            </div>
                        )}

                        <textarea
                            id="admin-response"
                            className="form-textarea"
                            placeholder={isInternal
                                ? 'Add an internal note for the team...'
                                : 'Type your response to the author... (The AI draft above has been pre-filled if generated)'}
                            value={response}
                            onChange={e => setResponse(e.target.value)}
                            style={{ minHeight: '140px' }}
                        />

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                            <button
                                id="send-response-btn"
                                className="btn btn-primary"
                                onClick={sendResponse}
                                disabled={sending || !response.trim()}
                            >
                                {sending
                                    ? <><span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }}></span> Sending...</>
                                    : isInternal ? '🔒 Save Internal Note' : '📤 Send Response'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right: Sidebar Controls */}
                <div>
                    <div className="card" style={{ marginBottom: '16px' }}>
                        <div className="card-title" style={{ marginBottom: '16px' }}>Update Ticket</div>

                        <div className="form-group">
                            <label className="form-label">Status</label>
                            <select className="form-select" value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">
                                Priority
                                {ticket.aiPriority && editPriority !== ticket.aiPriority && (
                                    <span style={{ fontSize: '10px', color: 'var(--gold)', marginLeft: '6px' }}>✏ Overriding AI</span>
                                )}
                            </label>
                            <select className="form-select" value={editPriority} onChange={e => setEditPriority(e.target.value)}>
                                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                            {ticket.aiPriority && (
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                    AI suggested: <strong>{ticket.aiPriority}</strong>
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label">
                                Category
                                {ticket.aiCategory && editCategory !== ticket.aiCategory && (
                                    <span style={{ fontSize: '10px', color: 'var(--gold)', marginLeft: '6px' }}>✏ Overriding AI</span>
                                )}
                            </label>
                            <select className="form-select" value={editCategory} onChange={e => setEditCategory(e.target.value)}>
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            {ticket.aiCategory && (
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                    AI suggested: <strong>{ticket.aiCategory}</strong>
                                </div>
                            )}
                        </div>

                        <button
                            className="btn btn-primary w-full"
                            style={{ justifyContent: 'center' }}
                            onClick={updateTicket}
                            disabled={updating}
                        >
                            {updating ? <><span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }}></span> Updating...</> : '✓ Save Changes'}
                        </button>
                    </div>

                    {/* Author Info Card */}
                    <div className="card" style={{ marginBottom: '16px' }}>
                        <div className="card-title" style={{ marginBottom: '14px' }}>Author Info</div>
                        <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div>
                                <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>NAME</span>
                                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{ticket.authorName}</div>
                            </div>
                            <div>
                                <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>EMAIL</span>
                                <div style={{ color: 'var(--text-secondary)' }}>{ticket.authorEmail}</div>
                            </div>
                            {ticket.bookTitle && ticket.bookTitle !== 'General / Account Level' && (
                                <div>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>BOOK</span>
                                    <div style={{ color: 'var(--accent-secondary)' }}>📖 {ticket.bookTitle}</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Status Buttons */}
                    <div className="card">
                        <div className="card-title" style={{ marginBottom: '14px' }}>Quick Actions</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {['Resolved', 'Closed'].map(s => (
                                <button
                                    key={s}
                                    className="btn btn-secondary btn-sm"
                                    style={{ justifyContent: 'center' }}
                                    onClick={async () => {
                                        setEditStatus(s);
                                        try {
                                            await api.patch(`/admin/tickets/${id}`, { status: s });
                                            toast.success(`Ticket marked as ${s}`);
                                            fetchTicket();
                                        } catch { toast.error('Failed'); }
                                    }}
                                >
                                    {s === 'Resolved' ? '✓ Mark Resolved' : '⊘ Close Ticket'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
