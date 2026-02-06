import { z } from "zod";

export const tenantBrandingSchema = z.object({
  logoUrl: z.string().url().nullable().optional(),
  primaryColor: z.string().min(4),
  accentColor: z.string().min(4)
});

export const tenantProfileSchema = z.object({
  businessName: z.string().min(1),
  timezone: z.string().min(1),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  websiteUrl: z.string().url().nullable().optional(),
  addressLine1: z.string().nullable().optional(),
  addressLine2: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  region: z.string().nullable().optional(),
  postalCode: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  businessHours: z.record(z.unknown()).nullable().optional()
});

export const tenantServiceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  durationMinutes: z.number().int().positive(),
  priceCents: z.number().int().nonnegative().nullable().optional(),
  currency: z.string().default("USD").nullable().optional(),
  active: z.boolean(),
  sortOrder: z.number().int().default(0),
  calEventTypeId: z.number().int().nullable().optional()
});

export const tenantFaqSchema = z.object({
  id: z.string().uuid(),
  question: z.string().min(1),
  answer: z.string().min(1),
  active: z.boolean(),
  sortOrder: z.number().int().default(0)
});

export const tenantPolicySchema = z.object({
  cancellationPolicy: z.string().nullable().optional(),
  latePolicy: z.string().nullable().optional(),
  noShowPolicy: z.string().nullable().optional(),
  paymentPolicy: z.string().nullable().optional()
});

export const tenantPublicSchema = z.object({
  tenantId: z.string().uuid(),
  slug: z.string().min(1),
  profile: tenantProfileSchema,
  branding: tenantBrandingSchema,
  services: z.array(tenantServiceSchema),
  faqs: z.array(tenantFaqSchema),
  policies: tenantPolicySchema.nullable()
});

export const chatSessionSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  createdAt: z.string().datetime(),
  lastActiveAt: z.string().datetime()
});

export const chatStreamRequestSchema = z.object({
  sessionId: z.string().uuid(),
  message: z.string().min(1).max(2000)
});
