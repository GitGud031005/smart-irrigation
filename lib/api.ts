// API client helper with environment-based URL
// Client-side: use relative URLs so the request goes to the same origin regardless of port.
// Server-side: fall back to NEXT_PUBLIC_API_URL (needed for server → server calls).
const API_URL =
  typeof window !== "undefined"
    ? ""
    : (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000");

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiCall<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const url = `${API_URL}${endpoint}`;

  const response = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  const data = (await response.json()) as T & { error?: string };

  if (!response.ok) {
    const errorMessage =
      (data as { error?: string }).error ?? `HTTP ${response.status}`;
    throw new ApiError(response.status, errorMessage);
  }

  return data;
}
