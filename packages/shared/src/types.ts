export type TenantBranding = {
  logoUrl?: string | null;
  primaryColor: string;
  accentColor: string;
};

export type TenantProfile = {
  businessName: string;
  timezone: string;
  phone?: string | null;
  email?: string | null;
  websiteUrl?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  region?: string | null;
  postalCode?: string | null;
  country?: string | null;
  businessHours?: Record<string, unknown> | null;
};

export type TenantService = {
  id: string;
  name: string;
  description?: string | null;
  durationMinutes: number;
  priceCents?: number | null;
  currency?: string | null;
  active: boolean;
  sortOrder: number;
  calEventTypeId?: number | null;
};

export type TenantFaq = {
  id: string;
  question: string;
  answer: string;
  active: boolean;
  sortOrder: number;
};

export type TenantPolicy = {
  cancellationPolicy?: string | null;
  latePolicy?: string | null;
  noShowPolicy?: string | null;
  paymentPolicy?: string | null;
};

export type TenantPublic = {
  tenantId: string;
  slug: string;
  profile: TenantProfile;
  branding: TenantBranding;
  services: TenantService[];
  faqs: TenantFaq[];
  policies: TenantPolicy | null;
};

export type ChatSession = {
  id: string;
  tenantId: string;
  createdAt: string;
  lastActiveAt: string;
};

export type ChatStreamRequest = {
  sessionId: string;
  message: string;
};

export type ApiError = {
  code:
    | "INVALID_ARGUMENT"
    | "UNAUTHENTICATED"
    | "FORBIDDEN"
    | "NOT_FOUND"
    | "CONFLICT"
    | "RATE_LIMITED"
    | "INTERNAL";
  message: string;
  details?: unknown;
};
