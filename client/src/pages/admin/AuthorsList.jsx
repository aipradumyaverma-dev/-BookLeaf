import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function AuthorsList() {
    const [authors, setAuthors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchAuthors = async () => {
            try {
                const res = await api.get('/admin/authors');
                setAuthors(res.data.authors);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAuthors();
    }, []);

    const filtered = authors.filter(a =>
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.email.toLowerCase().includes(search.toLowerCase()) ||
        (a.city || '').toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return <div className="loading-page"><div className="spinner"></div></div>;

    return (
        <div className="page-container fade-in">
            <div className="topbar" style={{ marginLeft: '-32px', marginRight: '-32px', paddingLeft: '32px', marginTop: '-28px', marginBottom: '28px' }}>
                <span className="topbar-title">All Authors</span>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{authors.length} registered authors</span>
            </div>

            <div className="page-header">
                <h1 className="page-title">Authors</h1>
                <p className="page-subtitle">All registered BookLeaf authors</p>
            </div>

            {/* Search */}
            <div className="search-input-wrap" style={{ marginBottom: '20px', maxWidth: '360px' }}>
                <span className="search-icon">🔍</span>
                <input
                    type="text"
                    className="search-input"
                    placeholder="Search by name, email, or city..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {filtered.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-icon">👤</div>
                        <div className="empty-title">No authors found</div>
                    </div>
                </div>
            ) : (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Author ID</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>City</th>
                                <th>Phone</th>
                                <th>Joined</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(a => (
                                <tr key={a._id}>
                                    <td>
                                        <span className="font-mono" style={{ fontSize: '12px', color: 'var(--accent-secondary)' }}>
                                            {a.authorId || '—'}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{
                                                width: '32px', height: '32px',
                                                background: 'var(--accent-gradient)',
                                                borderRadius: '50%',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '12px', fontWeight: 700, color: 'white', flexShrink: 0,
                                            }}>
                                                {a.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                            </div>
                                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{a.name}</span>
                                        </div>
                                    </td>
                                    <td>{a.email}</td>
                                    <td>{a.city || '—'}</td>
                                    <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{a.phone || '—'}</td>
                                    <td>
                                        {a.joinedDate
                                            ? new Date(a.joinedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                            : '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
