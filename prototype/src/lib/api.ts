import { gatedWrite } from "./runtime";

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
  source?: "all" | "subscriptions" | "cells" | "anchor";
  anchorId?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.scope) params.set("scope", filters.scope);
  if (filters?.search) params.set("search", filters.search);
  if (filters?.source) params.set("source", filters.source);
  if (filters?.anchorId) params.set("anchorId", filters.anchorId);

  const qs = params.toString();
  // Authed so the server can resolve "my subscriptions" / "my cells".
  const data = await authedRequest<{ items: unknown[]; nextCursor?: string }>(
    `/api/issues${qs ? `?${qs}` : ""}`,
  );
  return data.items;
}

export async function fetchIssue(id: string) {
  // Authed so the server can resolve viewer's cell relation and anchor subs.
  return authedRequest<Record<string, unknown>>(`/api/issues/${id}`);
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
  return gatedWrite(
    { kind: "comment", label: `Comment on issue ${issueId.slice(0, 8)}` },
    () =>
      authedRequest<Record<string, unknown>>(
        `/api/issues/${issueId}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, parentId, stance }),
        },
      ),
  );
}

export async function postArgument(
  issueId: string,
  text: string,
  type: "pro" | "con",
  parentId?: string,
) {
  return gatedWrite(
    { kind: "argument", label: `${type.toUpperCase()} argument` },
    () =>
      authedRequest<Record<string, unknown>>(
        `/api/issues/${issueId}/arguments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, type, parentId }),
        },
      ),
  );
}

// ─── Voting ─────────────────────────────────────────────────────────────────

export async function fetchTally(issueId: string) {
  return request<Record<string, unknown>>(`/api/issues/${issueId}/tally`);
}

export async function postVote(issueId: string, vote: "approve" | "reject") {
  return gatedWrite(
    { kind: "vote", label: `${vote === "approve" ? "✅" : "❌"} vote` },
    () =>
      authedRequest<Record<string, unknown>>(
        `/api/issues/${issueId}/votes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vote }),
        },
      ),
  );
}

// ─── User ───────────────────────────────────────────────────────────────────

export async function fetchMe() {
  return authedRequest<Record<string, unknown>>("/api/me");
}

export async function fetchMyBalance() {
  return authedRequest<{ balance: number }>("/api/me/balance");
}

export async function fetchMyIssues() {
  return authedRequest<{ items: unknown[] }>("/api/me/issues");
}

export async function fetchMyVotes() {
  return authedRequest<{ items: unknown[] }>("/api/me/votes");
}

export async function fetchMyClaims() {
  return authedRequest<{ items: unknown[] }>("/api/me/claims");
}

export async function fetchNotifications() {
  return authedRequest<{ items: unknown[]; nextCursor?: string }>(
    "/api/notifications",
  );
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

// ─── 026: Cells ─────────────────────────────────────────────────────────────

import type {
  CellSummary,
  CellDetail,
  MyCellMembership,
  AnchorSummary,
  AnchorDetail,
  MyAnchorSubscription,
  IssueListItem,
} from "./types";

export async function fetchCells(filters?: {
  tier?: string;
  scopeLevel?: string;
  search?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.tier) params.set("tier", filters.tier);
  if (filters?.scopeLevel) params.set("scopeLevel", filters.scopeLevel);
  if (filters?.search) params.set("search", filters.search);
  const qs = params.toString();
  const data = await authedRequest<{ items: CellSummary[] }>(
    `/api/cells${qs ? `?${qs}` : ""}`,
  );
  return data.items;
}

export async function fetchCell(idOrCellId: string) {
  return authedRequest<CellDetail>(`/api/cells/${encodeURIComponent(idOrCellId)}`);
}

export async function joinCell(cellUuid: string) {
  return authedRequest<{ ok: boolean }>(`/api/cells/${cellUuid}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "join" }),
  });
}

export async function leaveCell(cellUuid: string) {
  return authedRequest<{ ok: boolean }>(`/api/cells/${cellUuid}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "leave" }),
  });
}

export async function joinCellAsGuest(cellUuid: string, issueId: string) {
  return authedRequest<{ ok: boolean }>(`/api/cells/${cellUuid}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "guest", issueId }),
  });
}

export async function forkCell(cellUuid: string, displayName: string) {
  return authedRequest<{ id: string; cellId: string }>(
    `/api/cells/${cellUuid}/fork`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName }),
    },
  );
}

export async function createCell(data: {
  displayName: string;
  description?: string;
  scopeLevel?: string;
  locationRefs?: string[];
  topicTags?: string[];
  membraneRead?: string;
  membraneWrite?: string;
  governanceEngine?: string;
}) {
  return authedRequest<{ id: string; cellId: string }>(`/api/cells`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function fetchMyCells() {
  const data = await authedRequest<{ items: MyCellMembership[] }>("/api/me/cells");
  return data.items;
}

// ─── 027: Anchors ───────────────────────────────────────────────────────────

export async function fetchAnchors(filters?: { kind?: string; search?: string }) {
  const params = new URLSearchParams();
  if (filters?.kind) params.set("kind", filters.kind);
  if (filters?.search) params.set("search", filters.search);
  const qs = params.toString();
  const data = await authedRequest<{ items: AnchorSummary[] }>(
    `/api/anchors${qs ? `?${qs}` : ""}`,
  );
  return data.items;
}

export async function fetchAnchor(idOrAnchorId: string) {
  return authedRequest<AnchorDetail>(
    `/api/anchors/${encodeURIComponent(idOrAnchorId)}`,
  );
}

export async function fetchAnchorIssues(idOrAnchorId: string, includeChildren = true) {
  const data = await authedRequest<{ items: IssueListItem[] }>(
    `/api/anchors/${encodeURIComponent(idOrAnchorId)}/issues?includeChildren=${includeChildren}`,
  );
  return data.items;
}

export async function subscribeAnchor(idOrAnchorId: string) {
  return authedRequest<{ ok: boolean }>(
    `/api/anchors/${encodeURIComponent(idOrAnchorId)}/subscribe`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "subscribe" }),
    },
  );
}

export async function unsubscribeAnchor(idOrAnchorId: string) {
  return authedRequest<{ ok: boolean }>(
    `/api/anchors/${encodeURIComponent(idOrAnchorId)}/subscribe`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "unsubscribe" }),
    },
  );
}

export async function muteAnchor(idOrAnchorId: string, muted: boolean) {
  return authedRequest<{ ok: boolean }>(
    `/api/anchors/${encodeURIComponent(idOrAnchorId)}/subscribe`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: muted ? "mute" : "unmute" }),
    },
  );
}

export async function fetchMySubscriptions() {
  const data = await authedRequest<{ items: MyAnchorSubscription[] }>(
    "/api/me/subscriptions",
  );
  return data.items;
}
