import { createHmac, timingSafeEqual } from "node:crypto";

const extractHexDigest = (rawHeader: string): string | null => {
  const segments = rawHeader
    .split(",")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);

  for (const segment of segments) {
    const match = segment.match(/^(?:sha256=)?([a-fA-F0-9]{64})$/);
    if (match?.[1]) {
      return match[1].toLowerCase();
    }
  }

  return null;
};

export const verifyCalcomSignature = (
  rawBody: Buffer,
  signatureHeader: string | string[] | undefined,
  secret: string
): boolean => {
  if (!secret || secret.trim().length === 0) {
    return false;
  }

  const signatureValue = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;
  if (typeof signatureValue !== "string") {
    return false;
  }

  const providedDigest = extractHexDigest(signatureValue);
  if (!providedDigest) {
    return false;
  }

  const expectedDigest = createHmac("sha256", secret).update(rawBody).digest("hex");

  const expectedBuffer = Buffer.from(expectedDigest, "hex");
  const providedBuffer = Buffer.from(providedDigest, "hex");

  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, providedBuffer);
};

export const parseWebhookJson = <T>(rawBody: Buffer): T | null => {
  try {
    return JSON.parse(rawBody.toString("utf8")) as T;
  } catch {
    return null;
  }
};
