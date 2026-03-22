const TOKEN_KEY = "kindact-session-token";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function ensureAuth(): Promise<string> {
  const existing = getToken();
  if (existing) return existing;

  const res = await fetch("/api/auth/dev-login", { method: "POST" });
  if (!res.ok) throw new Error("Dev login failed");
  const { token } = await res.json();
  setToken(token);
  return token;
}

async function request<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

async function authedRequest<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await ensureAuth();
  return request<T>(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
}

// ─── Issues ─────────────────────────────────────────────────────────────────

export async function fetchIssues(filters?: {
  status?: string;
  scope?: string;
  search?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.scope) params.set("scope", filters.scope);
  if (filters?.search) params.set("search", filters.search);

  const qs = params.toString();
  const data = await request<{ items: unknown[]; nextCursor?: string }>(
    `/api/issues${qs ? `?${qs}` : ""}`,
  );
  return data.items;
}

export async function fetchIssue(id: string) {
  return request<Record<string, unknown>>(`/api/issues/${id}`);
}

export async function createIssue(data: {
  title: string;
  summary: string;
  description: string;
  scope: "local" | "national" | "global";
  tags: string[];
  rewardIntent: string;
}) {
  return authedRequest<Record<string, unknown>>("/api/issues", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

// ─── Deliberation ───────────────────────────────────────────────────────────

export async function fetchDeliberation(issueId: string) {
  return request<Record<string, unknown>>(`/api/issues/${issueId}/deliberation`);
}

export async function postComment(
  issueId: string,
  text: string,
  parentId?: string,
  stance?: "pro" | "con",
) {
  return authedRequest<Record<string, unknown>>(
    `/api/issues/${issueId}/comments`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, parentId, stance }),
    },
  );
}

export async function postArgument(
  issueId: string,
  text: string,
  type: "pro" | "con",
  parentId?: string,
) {
  return authedRequest<Record<string, unknown>>(
    `/api/issues/${issueId}/arguments`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, type, parentId }),
    },
  );
}

// ─── Voting ─────────────────────────────────────────────────────────────────

export async function fetchTally(issueId: string) {
  return request<Record<string, unknown>>(`/api/issues/${issueId}/tally`);
}

export async function postVote(issueId: string, vote: "approve" | "reject") {
  return authedRequest<Record<string, unknown>>(
    `/api/issues/${issueId}/votes`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vote }),
    },
  );
}

// ─── User ───────────────────────────────────────────────────────────────────

export async function fetchMe() {
  return authedRequest<Record<string, unknown>>("/api/me");
}

export async function fetchMyBalance() {
  return authedRequest<{ balance: number }>("/api/me/balance");
}

// ─── AI ─────────────────────────────────────────────────────────────────────

export async function generateAISummary(issueId: string) {
  return request<Record<string, unknown>>(`/api/ai/issues/${issueId}/summary`, {
    method: "POST",
  });
}

export async function generateAIImprovements(issueId: string) {
  return request<{ suggestions: string; modelVersion: string }>(
    `/api/ai/issues/${issueId}/improve`,
    { method: "POST" },
  );
}

export async function generateAITopics(issueId: string) {
  return request<{ tags: string[]; modelVersion: string }>(
    `/api/ai/issues/${issueId}/topics`,
    { method: "POST" },
  );
}

export async function findSimilarIssues(issueId: string) {
  return request<{ similar: { id: string; reason: string }[]; modelVersion: string }>(
    `/api/ai/issues/${issueId}/similar`,
    { method: "POST" },
  );
}

// ─── Ledger ─────────────────────────────────────────────────────────────────

export async function fetchAccount(accountId: string) {
  return request<Record<string, unknown>>(`/api/ledger/accounts/${accountId}`);
}
