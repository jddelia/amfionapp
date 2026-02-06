import { describe, expect, it } from "vitest";
import { createTenantResolver } from "./tenant";
import type { TenantRecord, TenantStore } from "../store/tenantStore";

const record: TenantRecord = {
  tenantId: "00000000-0000-0000-0000-000000000000",
  slug: "demo",
  profile: {
    businessName: "Demo",
    timezone: "America/New_York"
  },
  branding: {
    primaryColor: "#000",
    accentColor: "#111"
  },
  services: [],
  faqs: [],
  policies: null,
  domains: ["book.example.com"]
};

const store: TenantStore = {
  getByHostname: async (hostname) => (hostname === "book.example.com" ? record : null),
  getBySlug: async (slug) => (slug === "demo" ? record : null)
};

describe("createTenantResolver", () => {
  it("resolves tenant from subdomain", async () => {
    const resolver = createTenantResolver(store, { hostSuffix: "example.com" });
    const tenant = await resolver("demo.example.com");
    expect(tenant?.slug).toBe("demo");
  });

  it("resolves tenant from custom hostname", async () => {
    const resolver = createTenantResolver(store, { hostSuffix: "example.com" });
    const tenant = await resolver("book.example.com");
    expect(tenant?.slug).toBe("demo");
  });
});
