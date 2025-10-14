// ============================================
// API Request/Response Types
// ============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

// ============================================
// Authentication
// ============================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: UserInfo;
}

export interface UserInfo {
  id: string;
  email: string;
  name: string | null;
  role: string;
  organizationId: string;
  organizationName: string;
}

// ============================================
// License Management
// ============================================

export interface CreateLicenseRequest {
  productId: string;
  licenseType: 'perpetual' | 'subscription' | 'trial';
  maxActivations: number;
  expiresAt?: string; // ISO 8601
  features?: Record<string, boolean>;
  notes?: string;
}

export interface UpdateLicenseRequest {
  maxActivations?: number;
  expiresAt?: string;
  features?: Record<string, boolean>;
  status?: 'active' | 'suspended' | 'revoked';
  notes?: string;
}

export interface LicenseResponse {
  id: string;
  organizationId: string;
  productId: string;
  productName: string;
  licenseKey: string;
  licenseType: string;
  maxActivations: number;
  currentActivations: number;
  features: Record<string, boolean> | null;
  status: string;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LicenseListQuery {
  page?: number;
  limit?: number;
  productId?: string;
  status?: string;
  licenseType?: string;
  search?: string; // Search by license key
}

// ============================================
// License Verification (Public API)
// ============================================

export interface VerifyLicenseRequest {
  licenseKey: string;
  deviceFingerprint?: string;
  productVersion?: string;
}

export interface VerifyLicenseResponse {
  valid: boolean;
  license?: {
    licenseKey: string;
    productId: string;
    licenseType: string;
    maxActivations: number;
    currentActivations: number;
    features: Record<string, boolean>;
    expiresAt: string | null;
  };
  certificate?: string; // Offline verification certificate
  error?: {
    code: 'LICENSE_NOT_FOUND' | 'LICENSE_EXPIRED' | 'LICENSE_SUSPENDED' | 'MAX_ACTIVATIONS_REACHED';
    message: string;
  };
}

export interface ActivateLicenseRequest {
  licenseKey: string;
  deviceFingerprint: string;
  deviceInfo?: {
    platform?: string;
    hostname?: string;
    osVersion?: string;
  };
}

export interface ActivationResponse {
  success: boolean;
  activationId?: string;
  error?: {
    code: string;
    message: string;
  };
}

// ============================================
// Activations
// ============================================

export interface ActivationInfo {
  id: string;
  licenseId: string;
  deviceFingerprint: string;
  deviceInfo: any;
  status: string;
  activatedAt: string;
  lastCheckInAt: string;
}

// ============================================
// Products
// ============================================

export interface CreateProductRequest {
  name: string;
  version: string;
  description?: string;
}

export interface ProductResponse {
  id: string;
  organizationId: string;
  name: string;
  version: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

// ============================================
// Audit Logs
// ============================================

export interface AuditLogEntry {
  id: string;
  organizationId: string;
  userId: string | null;
  userName: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  metadata: any;
  ipAddress: string | null;
  createdAt: string;
}

export interface AuditLogQuery {
  page?: number;
  limit?: number;
  action?: string;
  resourceType?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

// ============================================
// Error Codes
// ============================================

export const ErrorCodes = {
  // Auth
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',

  // License
  LICENSE_NOT_FOUND: 'LICENSE_NOT_FOUND',
  LICENSE_EXPIRED: 'LICENSE_EXPIRED',
  LICENSE_SUSPENDED: 'LICENSE_SUSPENDED',
  LICENSE_REVOKED: 'LICENSE_REVOKED',
  MAX_ACTIVATIONS_REACHED: 'MAX_ACTIVATIONS_REACHED',
  INVALID_LICENSE_KEY: 'INVALID_LICENSE_KEY',

  // General
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;
