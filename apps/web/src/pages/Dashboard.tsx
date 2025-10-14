import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { api } from '../lib/api';

export default function Dashboard() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    api.logout();
    logout();
  };

  return (
    <div style={{ padding: '20px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>License Manager</h1>
        <div>
          <span style={{ marginRight: '20px' }}>{user?.email}</span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <nav style={{ marginBottom: '30px' }}>
        <Link to="/" style={{ marginRight: '20px' }}>Dashboard</Link>
        <Link to="/licenses">Licenses</Link>
      </nav>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
        <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px' }}>
          <h3>📊 Total Licenses</h3>
          <p style={{ fontSize: '32px', margin: '10px 0' }}>--</p>
          <p style={{ color: '#666' }}>Loading...</p>
        </div>

        <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px' }}>
          <h3>✅ Active</h3>
          <p style={{ fontSize: '32px', margin: '10px 0' }}>--</p>
          <p style={{ color: '#666' }}>Loading...</p>
        </div>

        <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px' }}>
          <h3>⚠️ Expiring Soon</h3>
          <p style={{ fontSize: '32px', margin: '10px 0' }}>--</p>
          <p style={{ color: '#666' }}>Within 30 days</p>
        </div>

        <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px' }}>
          <h3>💰 Monthly Cost</h3>
          <p style={{ fontSize: '32px', margin: '10px 0' }}>--</p>
          <p style={{ color: '#666' }}>Estimated</p>
        </div>
      </div>

      <div style={{ marginTop: '40px' }}>
        <h2>Recent Activity</h2>
        <p style={{ color: '#666' }}>No recent activity</p>
      </div>
    </div>
  );
}
