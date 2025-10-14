import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuthStore } from '../store/auth';

export default function Licenses() {
  const { user, logout } = useAuthStore();
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { data: licensesData, isLoading } = useQuery({
    queryKey: ['licenses'],
    queryFn: () => api.getLicenses(),
  });

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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Licenses</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{
            padding: '10px 20px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          + Create License
        </button>
      </div>

      {showCreateForm && (
        <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
          <h3>Create New License</h3>
          <p>Form implementation coming soon...</p>
          <button onClick={() => setShowCreateForm(false)}>Cancel</button>
        </div>
      )}

      {isLoading ? (
        <p>Loading licenses...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>License Key</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Product</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Type</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Activations</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Status</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Expires</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {licensesData?.data?.map((license: any) => (
              <tr key={license.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px' }}>
                  <code>{license.licenseKey}</code>
                </td>
                <td style={{ padding: '12px' }}>{license.productName}</td>
                <td style={{ padding: '12px' }}>{license.licenseType}</td>
                <td style={{ padding: '12px' }}>
                  {license.currentActivations}/{license.maxActivations}
                </td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    background: license.status === 'active' ? '#d4edda' : '#f8d7da',
                    color: license.status === 'active' ? '#155724' : '#721c24',
                  }}>
                    {license.status}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  {license.expiresAt ? new Date(license.expiresAt).toLocaleDateString() : 'Never'}
                </td>
                <td style={{ padding: '12px' }}>
                  <button style={{ marginRight: '5px' }}>View</button>
                  <button>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {licensesData?.data?.length === 0 && (
        <p style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          No licenses found. Create your first license to get started.
        </p>
      )}
    </div>
  );
}
