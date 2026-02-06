import type { TenantPublic } from "@amfion/shared";

export type TenantRecord = TenantPublic & {
  domains: string[];
};

export interface TenantStore {
  getByHostname(hostname: string): Promise<TenantRecord | null>;
  getBySlug(slug: string): Promise<TenantRecord | null>;
}

export class MemoryTenantStore implements TenantStore {
  private readonly bySlug = new Map<string, TenantRecord>();
  private readonly byHostname = new Map<string, TenantRecord>();

  constructor(records: TenantRecord[]) {
    records.forEach((record) => {
      this.bySlug.set(record.slug, record);
      record.domains.forEach((domain) => this.byHostname.set(domain.toLowerCase(), record));
    });
  }

  async getByHostname(hostname: string): Promise<TenantRecord | null> {
    return this.byHostname.get(hostname.toLowerCase()) ?? null;
  }

  async getBySlug(slug: string): Promise<TenantRecord | null> {
    return this.bySlug.get(slug.toLowerCase()) ?? null;
  }
}
