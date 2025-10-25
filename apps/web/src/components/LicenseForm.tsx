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
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {/* Product Selection (only for create mode) */}
      {!isEditMode && (
        <div className="form-group">
          <label className="form-label">
            製品 <span className="required">*</span>
          </label>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            required
            className="form-select"
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
        <div className="form-group">
          <label className="form-label">
            ライセンスタイプ <span className="required">*</span>
          </label>
          <select
            value={licenseType}
            onChange={(e) => setLicenseType(e.target.value)}
            required
            className="form-select"
          >
            <option value="subscription">サブスクリプション</option>
            <option value="perpetual">永久ライセンス</option>
            <option value="trial">トライアル</option>
          </select>
        </div>
      )}

      {/* Status (only for edit mode) */}
      {isEditMode && (
        <div className="form-group">
          <label className="form-label">
            ステータス
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="form-select"
          >
            <option value="active">有効</option>
            <option value="suspended">停止中</option>
            <option value="revoked">無効化</option>
          </select>
        </div>
      )}

      {/* Max Activations */}
      <div className="form-group">
        <label className="form-label">
          最大アクティベーション数 <span className="required">*</span>
        </label>
        <input
          type="number"
          min="1"
          value={maxActivations}
          onChange={(e) => setMaxActivations(parseInt(e.target.value))}
          required
          className="form-input"
        />
        <small className="form-helper">このライセンスで有効化できるデバイスの数</small>
      </div>

      {/* Expiration Date */}
      <div className="form-group">
        <label className="form-label">
          有効期限
        </label>
        <input
          type="date"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          className="form-input"
        />
        <small className="form-helper">空白の場合は無期限</small>
      </div>

      {/* Features */}
      <div className="form-group">
        <label className="form-label">
          機能フラグ
        </label>

        {/* Feature list */}
        <div style={{ marginBottom: '0.75rem' }}>
          {Object.entries(features).map(([name, enabled]) => (
            <div key={name} className="feature-item">
              <input
                type="checkbox"
                checked={enabled}
                onChange={() => handleToggleFeature(name)}
              />
              <span className="feature-item-name">{name}</span>
              <button
                type="button"
                onClick={() => handleRemoveFeature(name)}
                className="btn btn-danger btn-sm"
              >
                削除
              </button>
            </div>
          ))}
        </div>

        {/* Add new feature */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={newFeatureName}
            onChange={(e) => setNewFeatureName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
            placeholder="新しい機能名..."
            className="form-input"
            style={{ flex: 1 }}
          />
          <button
            type="button"
            onClick={handleAddFeature}
            className="btn btn-success"
          >
            追加
          </button>
        </div>
        <small className="form-helper">
          機能の有効/無効を切り替えられます
        </small>
      </div>

      {/* Notes */}
      <div className="form-group">
        <label className="form-label">
          メモ
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="form-textarea"
          placeholder="このライセンスに関するメモ..."
        />
      </div>

      {/* Form Actions */}
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="btn btn-secondary"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary btn-lg"
        >
          {isSubmitting ? '処理中...' : isEditMode ? '更新' : '作成'}
        </button>
      </div>
    </form>
  );
}
