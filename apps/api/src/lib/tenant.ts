import type { TenantRecord, TenantStore } from "../store/tenantStore";
import { TtlCache } from "./cache";

export type TenantResolverOptions = {
  hostSuffix: string;
  positiveTtlMs?: number;
  negativeTtlMs?: number;
};

export const createTenantResolver = (store: TenantStore, options: TenantResolverOptions) => {
  const positiveCache = new TtlCache<TenantRecord>(options.positiveTtlMs ?? 10 * 60 * 1000);
  const negativeCache = new TtlCache<true>(options.negativeTtlMs ?? 60 * 1000);

  return async (hostHeader: string | undefined): Promise<TenantRecord | null> => {
    if (!hostHeader) return null;
    const hostname = hostHeader.split(":")[0]?.toLowerCase();
    if (!hostname) return null;

    const cached = positiveCache.get(hostname);
    if (cached) return cached;
    if (negativeCache.get(hostname)) return null;

    let tenant: TenantRecord | null = null;

    const suffix = options.hostSuffix.toLowerCase();
    if (hostname.endsWith(`.${suffix}`)) {
      const slug = hostname.slice(0, -(suffix.length + 1));
      if (slug) {
        tenant = await store.getBySlug(slug);
      }
    }

    if (!tenant) {
      tenant = await store.getByHostname(hostname);
    }

    if (tenant) {
      positiveCache.set(hostname, tenant);
    } else {
      negativeCache.set(hostname, true, options.negativeTtlMs ?? 60 * 1000);
    }

    return tenant;
  };
};
