import { fetchJson } from "./http";

export type CalcomClientOptions = {
  apiKey: string;
  apiVersion?: string;
  baseUrl?: string;
};

export type CalcomAvailabilityRequest = {
  eventTypeId: number;
  startTimeUtc: string;
  endTimeUtc: string;
  timezone: string;
};

export type CalcomBookingRequest = {
  eventTypeId: number;
  startTimeUtc: string;
  name: string;
  email: string;
  notes?: string;
  timezone: string;
};

export class CalcomClient {
  private readonly apiKey: string;
  private readonly apiVersion: string;
  private readonly baseUrl: string;

  constructor(options: CalcomClientOptions) {
    this.apiKey = options.apiKey;
    this.apiVersion = options.apiVersion ?? "2024-08-13";
    this.baseUrl = options.baseUrl ?? "https://api.cal.com/v2";
  }

  private headers() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      "cal-api-version": this.apiVersion
    };
  }

  async getAvailability(request: CalcomAvailabilityRequest) {
    const url = `${this.baseUrl}/availability`;
    return fetchJson<unknown>(url, {
      method: "POST",
      headers: this.headers(),
      body: {
        eventTypeId: request.eventTypeId,
        startTime: request.startTimeUtc,
        endTime: request.endTimeUtc,
        timeZone: request.timezone
      }
    });
  }

  async createBooking(request: CalcomBookingRequest) {
    const url = `${this.baseUrl}/bookings`;
    return fetchJson<unknown>(url, {
      method: "POST",
      headers: this.headers(),
      body: {
        eventTypeId: request.eventTypeId,
        startTime: request.startTimeUtc,
        responses: {
          name: request.name,
          email: request.email,
          notes: request.notes
        },
        timeZone: request.timezone
      }
    });
  }
}
