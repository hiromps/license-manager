import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuthStore } from '../store/auth';
import Modal from '../components/Modal';
import LicenseForm from '../components/LicenseForm';

export default function Licenses() {
  const { user, logout } = useAuthStore();
  const queryClient = useQueryClient();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingLicense, setEditingLicense] = useState<any>(null);
  const [deletingLicense, setDeletingLicense] = useState<any>(null);

  const { data: licensesData, isLoading } = useQuery({
    queryKey: ['licenses'],
    queryFn: () => api.getLicenses(),
  });

  const handleLogout = () => {
    api.logout();
    logout();
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    queryClient.invalidateQueries({ queryKey: ['licenses'] });
  };

  const handleEditSuccess = () => {
    setEditingLicense(null);
    queryClient.invalidateQueries({ queryKey: ['licenses'] });
  };

  const handleDelete = async () => {
    if (!deletingLicense) return;

    try {
      await api.deleteLicense(deletingLicense.id);
      setDeletingLicense(null);
      queryClient.invalidateQueries({ queryKey: ['licenses'] });
    } catch (err) {
      alert('削除に失敗しました: ' + (err as Error).message);
    }
  };

  const licenses: any[] = Array.isArray(licensesData?.data) ? licensesData.data : [];

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
        <h2>ライセンス管理</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            padding: '10px 20px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          + ライセンス作成
        </button>
      </div>

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
            {licenses.map((license: any) => (
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
                  <button
                    onClick={() => setEditingLicense(license)}
                    style={{
                      marginRight: '5px',
                      padding: '6px 12px',
                      background: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    編集
                  </button>
                  <button
                    onClick={() => setDeletingLicense(license)}
                    style={{
                      padding: '6px 12px',
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    削除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {licenses.length === 0 && !isLoading && (
        <p style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          ライセンスが見つかりません。最初のライセンスを作成してください。
        </p>
      )}

      {/* Create License Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="新規ライセンス作成"
      >
        <LicenseForm
          onSuccess={handleCreateSuccess}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Edit License Modal */}
      <Modal
        isOpen={!!editingLicense}
        onClose={() => setEditingLicense(null)}
        title="ライセンス編集"
      >
        <LicenseForm
          license={editingLicense}
          onSuccess={handleEditSuccess}
          onCancel={() => setEditingLicense(null)}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingLicense}
        onClose={() => setDeletingLicense(null)}
        title="ライセンスの削除"
        maxWidth="500px"
      >
        <div>
          <p>本当にこのライセンスを削除しますか？</p>
          {deletingLicense && (
            <div style={{ background: '#f9f9f9', padding: '12px', borderRadius: '4px', marginBottom: '20px' }}>
              <strong>ライセンスキー:</strong> <code>{deletingLicense.licenseKey}</code><br />
              <strong>製品:</strong> {deletingLicense.productName}
            </div>
          )}
          <p style={{ color: '#dc3545', fontWeight: 'bold' }}>
            この操作は取り消せません。
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setDeletingLicense(null)}
              style={{
                padding: '10px 20px',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              キャンセル
            </button>
            <button
              onClick={handleDelete}
              style={{
                padding: '10px 20px',
                background: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              削除
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
