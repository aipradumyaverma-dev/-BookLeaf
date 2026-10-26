import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { BookStatusBadge } from '../../components/Badges';
import { format } from 'date-fns';

export default function MyBooks() {
    const [books, setBooks] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchBooks = async () => {
            try {
                const res = await api.get('/books/my-books');
                setBooks(res.data.books);
                setSummary(res.data.summary);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchBooks();
    }, []);

    if (loading) return <div className="loading-page"><div className="spinner"></div></div>;

    return (
        <div className="page-container fade-in">
            <div className="topbar" style={{ marginLeft: '-32px', marginRight: '-32px', paddingLeft: '32px', marginTop: '-28px', marginBottom: '28px' }}>
                <span className="topbar-title">My Books</span>
                <button className="btn btn-primary btn-sm" onClick={() => navigate('/author/submit-ticket')}>
                    Need Help?
                </button>
            </div>

            <div className="page-header">
                <h1 className="page-title">My Books</h1>
                <p className="page-subtitle">{summary?.totalBooks || 0} book{summary?.totalBooks !== 1 ? 's' : ''} in your portfolio</p>
            </div>

            {books.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-icon">📚</div>
                        <div className="empty-title">No books yet</div>
                        <div className="empty-msg">Your published books will appear here</div>
                    </div>
                </div>
            ) : (
                <div className="books-grid">
                    {books.map(book => (
                        <div key={book._id} className="book-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                <BookStatusBadge status={book.status} />
                                {book.printPartner && (
                                    <span className="tag">{book.printPartner}</span>
                                )}
                            </div>

                            <div className="book-title">{book.title}</div>
                            <div className="book-genre">{book.genre}</div>
                            <div className="book-isbn">{book.isbn}</div>

                            {book.publicationDate && (
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                                    Published: {format(new Date(book.publicationDate), 'dd MMM yyyy')}
                                </div>
                            )}

                            {/* Available On */}
                            {book.availableOn?.length > 0 && (
                                <div className="tag-list" style={{ marginBottom: '14px' }}>
                                    {book.availableOn.map(platform => (
                                        <span key={platform} className="tag">{platform}</span>
                                    ))}
                                </div>
                            )}

                            {/* Stats */}
                            {book.status === 'Published & Live' && (
                                <div className="book-stats">
                                    <div className="book-stat-item">
                                        <div className="book-stat-val">{book.totalCopiesSold?.toLocaleString()}</div>
                                        <div className="book-stat-lbl">Copies Sold</div>
                                    </div>
                                    <div className="book-stat-item">
                                        {book.mrp && <div className="book-stat-val">₹{book.mrp}</div>}
                                        <div className="book-stat-lbl">MRP</div>
                                    </div>
                                    <div className="book-stat-item">
                                        <div className="book-stat-val royalty-paid">₹{book.royaltyPaid?.toLocaleString()}</div>
                                        <div className="book-stat-lbl">Royalty Paid</div>
                                    </div>
                                    <div className="book-stat-item">
                                        <div className={`book-stat-val ${book.royaltyPending > 0 ? 'royalty-pending' : 'royalty-paid'}`}>
                                            ₹{book.royaltyPending?.toLocaleString()}
                                        </div>
                                        <div className="book-stat-lbl">Royalty Pending</div>
                                    </div>
                                </div>
                            )}

                            {/* In Production status */}
                            {book.status !== 'Published & Live' && (
                                <div style={{
                                    background: 'rgba(245,158,11,0.08)',
                                    border: '1px solid rgba(245,158,11,0.2)',
                                    borderRadius: 'var(--radius-md)',
                                    padding: '10px 14px',
                                    marginTop: '14px',
                                    fontSize: '12px',
                                    color: 'var(--gold-light)',
                                }}>
                                    📋 Your book is currently in production. You'll receive email updates at each stage.
                                </div>
                            )}

                            {/* Need help button */}
                            <button
                                className="btn btn-secondary btn-sm w-full"
                                style={{ marginTop: '14px', justifyContent: 'center' }}
                                onClick={() => navigate('/author/submit-ticket', { state: { bookId: book._id, bookTitle: book.title } })}
                            >
                                Report an Issue
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
