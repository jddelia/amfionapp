import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { parseWebhookJson, verifyCalcomSignature } from "./signature";

describe("verifyCalcomSignature", () => {
  const secret = "test-cal-secret";
  const rawBody = Buffer.from('{"triggerEvent":"BOOKING_CREATED"}', "utf8");
  const digest = createHmac("sha256", secret).update(rawBody).digest("hex");

  it("accepts a valid hex signature", () => {
    expect(verifyCalcomSignature(rawBody, digest, secret)).toBe(true);
  });

  it("accepts a valid sha256= prefixed signature", () => {
    expect(verifyCalcomSignature(rawBody, `sha256=${digest}`, secret)).toBe(true);
  });

  it("rejects signature mismatch", () => {
    expect(verifyCalcomSignature(rawBody, `sha256=${"0".repeat(64)}`, secret)).toBe(false);
  });

  it("rejects missing signature", () => {
    expect(verifyCalcomSignature(rawBody, undefined, secret)).toBe(false);
  });

  it("rejects missing secret", () => {
    expect(verifyCalcomSignature(rawBody, digest, "")).toBe(false);
  });
});

describe("parseWebhookJson", () => {
  it("parses valid JSON payload", () => {
    const payload = parseWebhookJson<{ triggerEvent: string }>(
      Buffer.from('{"triggerEvent":"BOOKING_CREATED"}', "utf8")
    );

    expect(payload?.triggerEvent).toBe("BOOKING_CREATED");
  });

  it("returns null for invalid JSON", () => {
    const payload = parseWebhookJson(Buffer.from("not-json", "utf8"));
    expect(payload).toBeNull();
  });
});
