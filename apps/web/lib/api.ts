import type { TenantPublic } from "@amfion/shared";

const fallbackTenant: TenantPublic = {
  tenantId: "00000000-0000-0000-0000-000000000000",
  slug: "demo",
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
  services: [],
  faqs: [],
  policies: null
};

const deriveBaseUrl = (host: string | null) => {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
  if (configured) return configured;
  if (!host) return "";
  const isLocalhost = host.includes("localhost") || host.startsWith("127.0.0.1");
  return `${isLocalhost ? "http" : "https"}://${host}`;
};

export const getTenantPublicData = async (host: string | null) => {
  const baseUrl = deriveBaseUrl(host);
  if (!baseUrl) return fallbackTenant;

  try {
    const response = await fetch(`${baseUrl}/v1/public/tenant`, {
      headers: host ? { host } : undefined,
      cache: "no-store"
    });

    if (!response.ok) {
      return fallbackTenant;
    }

    const data = (await response.json()) as TenantPublic;
    return data;
  } catch {
    return fallbackTenant;
  }
};
