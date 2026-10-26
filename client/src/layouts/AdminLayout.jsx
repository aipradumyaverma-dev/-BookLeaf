import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { connectSocket, disconnectSocket } from '../services/socket';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getSocket } from '../services/socket';
import {
    RiDashboardLine, RiTicketLine, RiTeamLine,
    RiLogoutBoxLine, RiSettings3Line
} from 'react-icons/ri';

export default function AdminLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [newTicketCount, setNewTicketCount] = useState(0);

    useEffect(() => {
        connectSocket(user);
        const socket = getSocket();

        socket.on('new-ticket', (data) => {
            setNewTicketCount(prev => prev + 1);
            toast.custom((t) => (
                <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid rgba(139,92,246,0.3)',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    boxShadow: 'var(--shadow-md)',
                    opacity: t.visible ? 1 : 0,
                    transition: 'opacity 0.2s',
                }}>
                    <span style={{ fontSize: '18px' }}>🎫</span>
                    <div>
                        <div style={{ fontWeight: 600 }}>New Ticket: {data.ticketId}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{data.authorName} — {data.subject?.slice(0, 40)}</div>
                    </div>
                </div>
            ), { duration: 5000 });
        });

        return () => {
            socket.off('new-ticket');
            disconnectSocket();
        };
    }, [user]);

    const handleLogout = () => {
        logout();
        navigate('/login');
        toast.success('Logged out successfully');
    };

    const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'AD';

    return (
        <div className="app-layout">
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <div className="sidebar-logo-mark">
                        <div className="logo-icon">📚</div>
                        <div>
                            <div className="logo-text-main">BookLeaf</div>
                            <div className="logo-text-sub">Admin Console</div>
                        </div>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-section-label">Overview</div>
                    <NavLink to="/admin" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <RiDashboardLine className="nav-icon" />
                        Dashboard
                    </NavLink>

                    <div className="nav-section-label">Support</div>
                    <NavLink
                        to="/admin/tickets"
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        onClick={() => setNewTicketCount(0)}
                    >
                        <RiTicketLine className="nav-icon" />
                        Ticket Queue
                        {newTicketCount > 0 && (
                            <span style={{
                                marginLeft: 'auto',
                                background: 'var(--rose)',
                                color: 'white',
                                fontSize: '10px',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: '10px',
                            }}>
                                {newTicketCount}
                            </span>
                        )}
                    </NavLink>

                    <div className="nav-section-label">Authors</div>
                    <NavLink to="/admin/authors" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <RiTeamLine className="nav-icon" />
                        All Authors
                    </NavLink>
                </nav>

                <div className="sidebar-footer">
                    <div className="user-info">
                        <div className="user-avatar" style={{ background: 'linear-gradient(135deg, #f43f5e 0%, #f97316 100%)' }}>
                            {initials}
                        </div>
                        <div>
                            <div className="user-name">{user?.name}</div>
                            <div className="user-role" style={{ color: 'var(--rose)' }}>Admin</div>
                        </div>
                    </div>
                    <button className="logout-btn" onClick={handleLogout}>
                        <RiLogoutBoxLine />
                        Sign Out
                    </button>
                </div>
            </aside>

            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
}
