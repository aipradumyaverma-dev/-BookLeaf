export const StatusBadge = ({ status }) => {
    const map = {
        'Open': 'badge-open',
        'In Progress': 'badge-in-progress',
        'Resolved': 'badge-resolved',
        'Closed': 'badge-closed',
    };
    return <span className={`badge ${map[status] || 'badge-closed'}`}>{status}</span>;
};

export const PriorityBadge = ({ priority }) => {
    const map = {
        Critical: 'badge-critical',
        High: 'badge-high',
        Medium: 'badge-medium',
        Low: 'badge-low',
    };
    const icons = { Critical: '🔴', High: '🟠', Medium: '🟡', Low: '🟢' };
    return (
        <span className={`badge ${map[priority] || 'badge-medium'}`}>
            {icons[priority]} {priority}
        </span>
    );
};

export const CategoryBadge = ({ category }) => (
    <span className="badge badge-category">{category}</span>
);

export const BookStatusBadge = ({ status }) => {
    const isLive = status === 'Published & Live';
    return (
        <span className={`badge ${isLive ? 'badge-live' : 'badge-production'}`}>
            {isLive ? '✓ Live' : `⏳ ${status.replace('In Production - ', '')}`}
        </span>
    );
};
