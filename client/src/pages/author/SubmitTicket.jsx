import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function SubmitTicket() {
    const navigate = useNavigate();
    const location = useLocation();
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        bookId: location.state?.bookId || 'general',
        subject: '',
        description: '',
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        const fetchBooks = async () => {
            try {
                const res = await api.get('/books/my-books');
                setBooks(res.data.books);
            } catch (err) {
                console.error(err);
            }
        };
        fetchBooks();
    }, []);

    const validate = () => {
        const e = {};
        if (!form.subject.trim()) e.subject = 'Subject is required';
        if (form.description.trim().length < 20) e.description = 'Description must be at least 20 characters';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        try {
            const payload = {
                subject: form.subject,
                description: form.description,
                bookId: form.bookId === 'general' ? null : form.bookId,
            };
            const res = await api.post('/tickets', payload);
            toast.success(`Ticket ${res.data.ticket.ticketId} submitted! We'll get back to you shortly.`);
            navigate('/author/tickets');
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to submit ticket';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container fade-in">
            <div className="topbar" style={{ marginLeft: '-32px', marginRight: '-32px', paddingLeft: '32px', marginTop: '-28px', marginBottom: '28px' }}>
                <span className="topbar-title">Submit a Query</span>
            </div>

            <div className="page-header">
                <h1 className="page-title">Submit a Support Query</h1>
                <p className="page-subtitle">Our team typically responds within 24–48 hours</p>
            </div>

            <div style={{ maxWidth: '680px' }}>
                {/* Info */}
                <div style={{
                    background: 'rgba(139,92,246,0.07)',
                    border: '1px solid rgba(139,92,246,0.2)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '14px 18px',
                    marginBottom: '24px',
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    gap: '10px',
                }}>
                    <span style={{ fontSize: '18px' }}>🤖</span>
                    <div>
                        <strong style={{ color: 'var(--accent-secondary)' }}>AI-Assisted Support</strong>
                        <br />
                        Your ticket will be automatically classified and prioritized. Our AI will help draft a response
                        based on BookLeaf's policies, which our team will review before sending.
                    </div>
                </div>

                <div className="card">
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Related Book</label>
                            <select
                                id="ticket-book"
                                className="form-select"
                                value={form.bookId}
                                onChange={e => setForm({ ...form, bookId: e.target.value })}
                            >
                                <option value="general">General / Account Level</option>
                                {books.map(book => (
                                    <option key={book._id} value={book._id}>
                                        {book.title} – {book.isbn}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">
                                Subject <span className="required">*</span>
                            </label>
                            <input
                                id="ticket-subject"
                                type="text"
                                className="form-input"
                                placeholder="e.g. Royalty payment not received for Q3"
                                value={form.subject}
                                onChange={e => setForm({ ...form, subject: e.target.value })}
                            />
                            {errors.subject && <div className="form-error">⚠ {errors.subject}</div>}
                        </div>

                        <div className="form-group">
                            <label className="form-label">
                                Describe Your Issue <span className="required">*</span>
                            </label>
                            <textarea
                                id="ticket-description"
                                className="form-textarea"
                                placeholder="Please provide as much detail as possible — order numbers, dates, amounts, and what you've already tried..."
                                value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                                style={{ minHeight: '160px' }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                                {errors.description && <div className="form-error">⚠ {errors.description}</div>}
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                                    {form.description.length} chars (min 20)
                                </span>
                            </div>
                        </div>

                        {/* Attachment UI (bonus - not functional upload) */}
                        <div className="form-group">
                            <label className="form-label">Attachments <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</span></label>
                            <div style={{
                                border: '1px dashed var(--border)',
                                borderRadius: 'var(--radius-md)',
                                padding: '20px',
                                textAlign: 'center',
                                cursor: 'pointer',
                                color: 'var(--text-muted)',
                                fontSize: '13px',
                                transition: 'var(--transition)',
                            }}
                                onMouseEnter={e => e.target.style.borderColor = 'rgba(139,92,246,0.4)'}
                                onMouseLeave={e => e.target.style.borderColor = 'var(--border)'}
                            >
                                📎 Click or drag files here to attach
                                <br />
                                <span style={{ fontSize: '11px', marginTop: '4px', display: 'block' }}>
                                    PDF, PNG, JPG up to 10MB (attachment upload not required for this demo)
                                </span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => navigate('/author/tickets')}
                            >
                                Cancel
                            </button>
                            <button
                                id="submit-ticket-btn"
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading}
                            >
                                {loading ? (
                                    <><span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }}></span> Submitting...</>
                                ) : '🎫 Submit Query'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
