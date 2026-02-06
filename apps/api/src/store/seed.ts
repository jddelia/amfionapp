import type { TenantRecord } from "./tenantStore";
import type { AppConfig } from "../config";

export const buildSeedTenants = (config: AppConfig): TenantRecord[] => {
  const hostname = `${config.TENANT_DEFAULT_SLUG}.${config.TENANT_HOST_SUFFIX}`;

  return [
    {
      tenantId: config.TENANT_DEFAULT_ID,
      slug: config.TENANT_DEFAULT_SLUG,
      profile: {
        businessName: "Amfion Demo Studio",
        timezone: "America/New_York",
        phone: "+1-555-555-0199",
        email: "hello@amfion.example",
        websiteUrl: "https://amfion.example",
        addressLine1: "123 Demo Street",
        addressLine2: null,
        city: "New York",
        region: "NY",
        postalCode: "10001",
        country: "US",
        businessHours: {
          monday: { open: "09:00", close: "18:00" },
          tuesday: { open: "09:00", close: "18:00" },
          wednesday: { open: "09:00", close: "18:00" },
          thursday: { open: "09:00", close: "18:00" },
          friday: { open: "09:00", close: "18:00" }
        }
      },
      branding: {
        logoUrl: null,
        primaryColor: "#1f2937",
        accentColor: "#2563eb"
      },
      services: [
        {
          id: "11111111-1111-1111-1111-111111111111",
          name: "Signature Consult",
          description: "30-minute consult with a specialist.",
          durationMinutes: 30,
          priceCents: 5000,
          currency: "USD",
          active: true,
          sortOrder: 0,
          calEventTypeId: null
        },
        {
          id: "22222222-2222-2222-2222-222222222222",
          name: "Deep Dive Session",
          description: "60-minute session for advanced needs.",
          durationMinutes: 60,
          priceCents: 12000,
          currency: "USD",
          active: true,
          sortOrder: 1,
          calEventTypeId: null
        }
      ],
      faqs: [
        {
          id: "33333333-3333-3333-3333-333333333333",
          question: "What should I bring to my appointment?",
          answer: "Bring a photo ID and arrive 10 minutes early.",
          active: true,
          sortOrder: 0
        },
        {
          id: "44444444-4444-4444-4444-444444444444",
          question: "Do you accept walk-ins?",
          answer: "We recommend booking ahead, but limited walk-ins are available.",
          active: true,
          sortOrder: 1
        }
      ],
      policies: {
        cancellationPolicy: "Cancel at least 24 hours in advance.",
        latePolicy: "Arrivals 10+ minutes late may be rescheduled.",
        noShowPolicy: "No-shows may be charged a fee.",
        paymentPolicy: "Payment due at appointment time."
      },
      domains: [hostname]
    }
  ];
};
