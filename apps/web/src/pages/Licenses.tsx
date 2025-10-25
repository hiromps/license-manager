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

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'badge-success';
      case 'suspended':
        return 'badge-warning';
      case 'revoked':
      case 'expired':
        return 'badge-danger';
      default:
        return 'badge-info';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return '有効';
      case 'suspended':
        return '停止中';
      case 'revoked':
        return '無効化';
      case 'expired':
        return '期限切れ';
      default:
        return status;
    }
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <h1 className="header-title">License Manager</h1>
          <div className="header-actions">
            <span className="user-info">{user?.email}</span>
            <button onClick={handleLogout} className="btn btn-secondary btn-sm">
              ログアウト
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container">
        {/* Navigation */}
        <nav className="nav">
          <div className="nav-links">
            <Link to="/" className="nav-link">
              ダッシュボード
            </Link>
            <Link to="/licenses" className="nav-link active">
              ライセンス
            </Link>
          </div>
        </nav>

        {/* Page Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
        }}>
          <div>
            <h2 style={{ margin: 0, marginBottom: '0.5rem' }}>ライセンス管理</h2>
            <p style={{ margin: 0, color: 'var(--gray-600)', fontSize: '0.875rem' }}>
              ライセンスの作成、編集、削除を行います
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary btn-lg"
          >
            <span style={{ marginRight: '0.5rem' }}>+</span>
            ライセンス作成
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="loading">
            <p>ライセンスを読み込んでいます...</p>
          </div>
        )}

        {/* Licenses Table */}
        {!isLoading && licenses.length > 0 && (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>ライセンスキー</th>
                  <th>製品</th>
                  <th>タイプ</th>
                  <th>アクティベーション</th>
                  <th>ステータス</th>
                  <th>有効期限</th>
                  <th style={{ textAlign: 'center' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {licenses.map((license: any) => (
                  <tr key={license.id}>
                    <td>
                      <code>{license.licenseKey}</code>
                    </td>
                    <td style={{ fontWeight: '500' }}>{license.productName}</td>
                    <td>
                      <span className={`badge ${
                        license.licenseType === 'perpetual' ? 'badge-info' :
                        license.licenseType === 'trial' ? 'badge-warning' :
                        'badge-success'
                      }`}>
                        {license.licenseType === 'subscription' ? 'サブスク' :
                         license.licenseType === 'perpetual' ? '永久' :
                         'トライアル'}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        fontWeight: '600',
                        color: license.currentActivations >= license.maxActivations
                          ? 'var(--danger-600)'
                          : 'var(--success-600)',
                      }}>
                        {license.currentActivations}
                      </span>
                      <span style={{ color: 'var(--gray-400)', margin: '0 0.25rem' }}>/</span>
                      <span style={{ color: 'var(--gray-600)' }}>
                        {license.maxActivations}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(license.status)}`}>
                        {getStatusText(license.status)}
                      </span>
                    </td>
                    <td style={{ color: 'var(--gray-600)' }}>
                      {license.expiresAt ? new Date(license.expiresAt).toLocaleDateString('ja-JP') : '無期限'}
                    </td>
                    <td>
                      <div style={{
                        display: 'flex',
                        gap: '0.5rem',
                        justifyContent: 'center',
                      }}>
                        <button
                          onClick={() => setEditingLicense(license)}
                          className="btn btn-success btn-sm"
                        >
                          編集
                        </button>
                        <button
                          onClick={() => setDeletingLicense(license)}
                          className="btn btn-danger btn-sm"
                        >
                          削除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && licenses.length === 0 && (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">📄</div>
              <h3 className="empty-state-title">ライセンスがありません</h3>
              <p className="empty-state-description">
                最初のライセンスを作成して開始しましょう
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary"
                style={{ marginTop: '1.5rem' }}
              >
                <span style={{ marginRight: '0.5rem' }}>+</span>
                ライセンス作成
              </button>
            </div>
          </div>
        )}
      </div>

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
          <p style={{ marginBottom: '1.5rem', color: 'var(--gray-700)' }}>
            本当にこのライセンスを削除しますか？
          </p>
          {deletingLicense && (
            <div style={{
              background: 'var(--gray-50)',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.5rem',
              border: '1.5px solid var(--gray-200)',
            }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong style={{ color: 'var(--gray-700)' }}>ライセンスキー:</strong>{' '}
                <code style={{
                  background: 'var(--gray-200)',
                  padding: '0.25rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.813rem',
                  color: 'var(--primary-700)',
                  fontWeight: '600',
                }}>
                  {deletingLicense.licenseKey}
                </code>
              </div>
              <div>
                <strong style={{ color: 'var(--gray-700)' }}>製品:</strong>{' '}
                <span style={{ color: 'var(--gray-600)' }}>{deletingLicense.productName}</span>
              </div>
            </div>
          )}
          <div style={{
            background: 'var(--danger-50)',
            border: '1.5px solid var(--danger-200)',
            borderRadius: 'var(--radius-md)',
            padding: '0.875rem 1rem',
            marginBottom: '1.5rem',
          }}>
            <p style={{
              margin: 0,
              color: 'var(--danger-700)',
              fontWeight: '600',
              fontSize: '0.875rem',
            }}>
              ⚠️ この操作は取り消せません
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setDeletingLicense(null)}
              className="btn btn-secondary"
            >
              キャンセル
            </button>
            <button
              onClick={handleDelete}
              className="btn btn-danger"
            >
              削除
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
