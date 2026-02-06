import { fetchJson } from "./http";

export type ClaudeClientOptions = {
  apiKey: string;
  apiVersion?: string;
  baseUrl?: string;
};

export type ClaudeMessageContent = {
  type: "text";
  text: string;
};

export type ClaudeMessage = {
  role: "user" | "assistant";
  content: ClaudeMessageContent[];
};

export type ClaudeCreateMessageRequest = {
  model: string;
  messages: ClaudeMessage[];
  system?: string;
  max_tokens?: number;
  stream?: boolean;
  temperature?: number;
};

export class ClaudeClient {
  private readonly apiKey: string;
  private readonly apiVersion: string;
  private readonly baseUrl: string;

  constructor(options: ClaudeClientOptions) {
    this.apiKey = options.apiKey;
    this.apiVersion = options.apiVersion ?? "2023-06-01";
    this.baseUrl = options.baseUrl ?? "https://api.anthropic.com/v1";
  }

  async createMessage<T = unknown>(request: ClaudeCreateMessageRequest) {
    const url = `${this.baseUrl}/messages`;
    return fetchJson<T>(url, {
      method: "POST",
      headers: {
        "x-api-key": this.apiKey,
        "anthropic-version": this.apiVersion
      },
      body: request
    });
  }
}
