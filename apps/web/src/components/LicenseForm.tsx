import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

interface LicenseFormProps {
  license?: any; // Pass existing license for editing, undefined for creating
  onSuccess: () => void;
  onCancel: () => void;
}

export default function LicenseForm({ license, onSuccess, onCancel }: LicenseFormProps) {
  const isEditMode = !!license;

  // Form state
  const [productId, setProductId] = useState(license?.productId || '');
  const [licenseType, setLicenseType] = useState(license?.licenseType || 'subscription');
  const [maxActivations, setMaxActivations] = useState(license?.maxActivations || 1);
  const [expiresAt, setExpiresAt] = useState(
    license?.expiresAt ? new Date(license.expiresAt).toISOString().split('T')[0] : ''
  );
  const [status, setStatus] = useState(license?.status || 'active');
  const [notes, setNotes] = useState(license?.notes || '');
  const [features, setFeatures] = useState<Record<string, boolean>>(
    license?.features || {}
  );

  // Feature management
  const [newFeatureName, setNewFeatureName] = useState('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load products
  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.getProducts(),
  });

  const products = Array.isArray(productsData?.data) ? productsData.data : [];

  const handleAddFeature = () => {
    if (newFeatureName.trim()) {
      setFeatures({ ...features, [newFeatureName.trim()]: true });
      setNewFeatureName('');
    }
  };

  const handleRemoveFeature = (featureName: string) => {
    const updatedFeatures = { ...features };
    delete updatedFeatures[featureName];
    setFeatures(updatedFeatures);
  };

  const handleToggleFeature = (featureName: string) => {
    setFeatures({ ...features, [featureName]: !features[featureName] });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const data: any = {
        maxActivations: parseInt(maxActivations.toString()),
        expiresAt: expiresAt || undefined,
        features: Object.keys(features).length > 0 ? features : undefined,
        notes: notes || undefined,
      };

      if (isEditMode) {
        // Edit mode: only send updatable fields
        data.status = status;
        await api.updateLicense(license.id, data);
      } else {
        // Create mode: include productId and licenseType
        if (!productId) {
          setError('製品を選択してください');
          setIsSubmitting(false);
          return;
        }
        data.productId = productId;
        data.licenseType = licenseType;
        await api.createLicense(data);
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'エラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '600px' }}>
      {error && (
        <div style={{
          padding: '12px',
          marginBottom: '20px',
          background: '#fee',
          border: '1px solid #fcc',
          borderRadius: '4px',
          color: '#c33',
        }}>
          {error}
        </div>
      )}

      {/* Product Selection (only for create mode) */}
      {!isEditMode && (
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            製品 <span style={{ color: 'red' }}>*</span>
          </label>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          >
            <option value="">製品を選択...</option>
            {products.map((product: any) => (
              <option key={product.id} value={product.id}>
                {product.name} (v{product.version})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* License Type (only for create mode) */}
      {!isEditMode && (
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            ライセンスタイプ <span style={{ color: 'red' }}>*</span>
          </label>
          <select
            value={licenseType}
            onChange={(e) => setLicenseType(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          >
            <option value="subscription">サブスクリプション</option>
            <option value="perpetual">永久ライセンス</option>
            <option value="trial">トライアル</option>
          </select>
        </div>
      )}

      {/* Status (only for edit mode) */}
      {isEditMode && (
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            ステータス
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          >
            <option value="active">有効</option>
            <option value="suspended">停止中</option>
            <option value="revoked">無効化</option>
          </select>
        </div>
      )}

      {/* Max Activations */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          最大アクティベーション数 <span style={{ color: 'red' }}>*</span>
        </label>
        <input
          type="number"
          min="1"
          value={maxActivations}
          onChange={(e) => setMaxActivations(parseInt(e.target.value))}
          required
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px',
          }}
        />
        <small style={{ color: '#666' }}>このライセンスで有効化できるデバイスの数</small>
      </div>

      {/* Expiration Date */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          有効期限
        </label>
        <input
          type="date"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px',
          }}
        />
        <small style={{ color: '#666' }}>空白の場合は無期限</small>
      </div>

      {/* Features */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          機能フラグ
        </label>

        {/* Feature list */}
        <div style={{ marginBottom: '10px' }}>
          {Object.entries(features).map(([name, enabled]) => (
            <div
              key={name}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px',
                background: '#f9f9f9',
                borderRadius: '4px',
                marginBottom: '8px',
              }}
            >
              <input
                type="checkbox"
                checked={enabled}
                onChange={() => handleToggleFeature(name)}
                style={{ marginRight: '10px' }}
              />
              <span style={{ flex: 1 }}>{name}</span>
              <button
                type="button"
                onClick={() => handleRemoveFeature(name)}
                style={{
                  padding: '4px 8px',
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                削除
              </button>
            </div>
          ))}
        </div>

        {/* Add new feature */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={newFeatureName}
            onChange={(e) => setNewFeatureName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
            placeholder="新しい機能名..."
            style={{
              flex: 1,
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          />
          <button
            type="button"
            onClick={handleAddFeature}
            style={{
              padding: '8px 16px',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            追加
          </button>
        </div>
        <small style={{ color: '#666' }}>
          機能の有効/無効を切り替えられます
        </small>
      </div>

      {/* Notes */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          メモ
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontFamily: 'inherit',
          }}
          placeholder="このライセンスに関するメモ..."
        />
      </div>

      {/* Form Actions */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          style={{
            padding: '10px 20px',
            background: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            opacity: isSubmitting ? 0.6 : 1,
          }}
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            padding: '10px 20px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            opacity: isSubmitting ? 0.6 : 1,
          }}
        >
          {isSubmitting ? '処理中...' : isEditMode ? '更新' : '作成'}
        </button>
      </div>
    </form>
  );
}
