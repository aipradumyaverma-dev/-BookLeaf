import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { connectSocket, disconnectSocket } from '../services/socket';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { RiBookOpenLine, RiTicketLine, RiAddCircleLine, RiDashboardLine, RiLogoutBoxLine } from 'react-icons/ri';

export default function AuthorLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        connectSocket(user);
        return () => disconnectSocket();
    }, [user]);

    const handleLogout = () => {
        logout();
        navigate('/login');
        toast.success('Logged out successfully');
    };

    const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'AU';

    return (
        <div className="app-layout">
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <div className="sidebar-logo-mark">
                        <div className="logo-icon">📚</div>
                        <div>
                            <div className="logo-text-main">BookLeaf</div>
                            <div className="logo-text-sub">Author Portal</div>
                        </div>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-section-label">Overview</div>
                    <NavLink to="/author" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <RiDashboardLine className="nav-icon" />
                        Dashboard
                    </NavLink>

                    <div className="nav-section-label">My Content</div>
                    <NavLink to="/author/books" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <RiBookOpenLine className="nav-icon" />
                        My Books
                    </NavLink>

                    <div className="nav-section-label">Support</div>
                    <NavLink to="/author/submit-ticket" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <RiAddCircleLine className="nav-icon" />
                        Submit a Query
                    </NavLink>
                    <NavLink to="/author/tickets" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <RiTicketLine className="nav-icon" />
                        My Tickets
                    </NavLink>
                </nav>

                <div className="sidebar-footer">
                    <div className="user-info">
                        <div className="user-avatar">{initials}</div>
                        <div>
                            <div className="user-name">{user?.name}</div>
                            <div className="user-role">Author</div>
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
