import type { ApiError } from "./types";

export const errorResponse = (error: ApiError) => ({
  error
});
