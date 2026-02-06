export type FetchJsonOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
};

export class HttpError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export const fetchJson = async <T>(url: string, options: FetchJsonOptions = {}): Promise<T> => {
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? 10_000;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: options.method ?? "GET",
      headers: {
        "content-type": "application/json",
        ...(options.headers ?? {})
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal
    });

    const contentType = response.headers.get("content-type") ?? "";
    const responseBody = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      throw new HttpError(`Request failed with status ${response.status}`, response.status, responseBody);
    }

    return responseBody as T;
  } finally {
    clearTimeout(timeout);
  }
};
