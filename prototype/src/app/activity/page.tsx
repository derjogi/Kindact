"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Layout from "@/components/Layout";
import {
  fetchMe,
  fetchMyBalance,
  fetchMyIssues,
  fetchMyVotes,
  fetchMyClaims,
  fetchNotifications,
} from "@/lib/api";

type Tab = "issues" | "votes" | "claims" | "notifications";

const statusLabels: Record<string, string> = {
  draft: "Draft",
  deliberating: "Deliberating",
  vote_ready: "Voting",
  "vote-ready": "Voting",
  adopted: "Adopted",
  implementing: "Implementing",
  completed: "Completed",
};

const statusColors: Record<string, string> = {
  draft: "bg-stone-400",
  deliberating: "bg-emerald-500",
  vote_ready: "bg-blue-500",
  "vote-ready": "bg-blue-500",
  adopted: "bg-violet-500",
  implementing: "bg-amber-500",
  completed: "bg-stone-600",
};

const claimStatusLabels: Record<string, string> = {
  active: "Active",
  submitted: "Submitted",
  verified: "Verified",
  rejected: "Rejected",
};

export default function ActivityPage() {
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("issues");

  const [issues, setIssues] = useState<Record<string, unknown>[]>([]);
  const [votes, setVotes] = useState<Record<string, unknown>[]>([]);
  const [claims, setClaims] = useState<Record<string, unknown>[]>([]);
  const [notifications, setNotifications] = useState<Record<string, unknown>[]>([]);
  const [tabLoading, setTabLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [me, balRes] = await Promise.all([fetchMe(), fetchMyBalance()]);
        setDisplayName((me as Record<string, unknown>).displayName as string);
        setBalance(balRes.balance);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    let cancelled = false;
    setTabLoading(true);

    const loaders: Record<Tab, () => Promise<void>> = {
      issues: async () => {
        const res = await fetchMyIssues();
        if (!cancelled) setIssues(res.items as Record<string, unknown>[]);
      },
      votes: async () => {
        const res = await fetchMyVotes();
        if (!cancelled) setVotes(res.items as Record<string, unknown>[]);
      },
      claims: async () => {
        const res = await fetchMyClaims();
        if (!cancelled) setClaims(res.items as Record<string, unknown>[]);
      },
      notifications: async () => {
        const res = await fetchNotifications();
        if (!cancelled)
          setNotifications(res.items as Record<string, unknown>[]);
      },
    };

    loaders[activeTab]()
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setTabLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-16 text-stone-400">Loading…</div>
      </Layout>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "issues", label: "My Issues" },
    { key: "votes", label: "My Votes" },
    { key: "claims", label: "My Claims" },
    { key: "notifications", label: "Notifications" },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-xl font-semibold text-stone-900">
          My Activity
          {displayName && (
            <span className="text-sm font-normal text-stone-400 ml-2">
              ({displayName})
            </span>
          )}
        </h1>

        {/* Balance */}
        <div className="bg-white rounded-lg border border-stone-200 p-5">
          <div className="text-2xl font-semibold text-stone-900">
            💰 {balance !== null ? balance.toFixed(1) : "—"} $CC
          </div>
          <div className="text-sm text-stone-400 mt-1">Decays ~1% / month</div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
          <div className="flex border-b border-stone-200 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2.5 min-h-[44px] text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.key
                    ? "text-stone-900 font-medium border-b-2 border-stone-800"
                    : "text-stone-400 hover:text-stone-600"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-5">
            {tabLoading ? (
              <p className="text-center text-stone-400 py-8">Loading…</p>
            ) : (
              <>
                {activeTab === "issues" && (
                  <IssuesList items={issues} />
                )}
                {activeTab === "votes" && (
                  <VotesList items={votes} />
                )}
                {activeTab === "claims" && (
                  <ClaimsList items={claims} />
                )}
                {activeTab === "notifications" && (
                  <NotificationsList items={notifications} />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

function IssuesList({ items }: { items: Record<string, unknown>[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-stone-400 text-center py-8">
        You haven&apos;t created any issues yet.
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {items.map((issue) => (
        <Link
          key={issue.id as string}
          href={`/issues/${issue.id}`}
          className="flex items-start gap-3 px-3 py-3 rounded-lg hover:bg-stone-50 transition-colors"
        >
          <span
            className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${statusColors[issue.status as string] ?? "bg-stone-400"}`}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-stone-800 truncate">
              {issue.title as string}
            </p>
            <div className="flex items-center gap-2 text-xs text-stone-400 mt-0.5">
              <span>{statusLabels[issue.status as string] ?? (issue.status as string)}</span>
              <span>·</span>
              <span>{issue.participants as number} participants</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function VotesList({ items }: { items: Record<string, unknown>[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-stone-400 text-center py-8">
        You haven&apos;t voted on any issues yet.
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {items.map((voteRecord) => {
        const issue = voteRecord.issue as Record<string, unknown>;
        const vote = voteRecord.vote as string;
        return (
          <Link
            key={voteRecord.id as string}
            href={`/issues/${issue.id}`}
            className="flex items-start gap-3 px-3 py-3 rounded-lg hover:bg-stone-50 transition-colors"
          >
            <span className="text-lg mt-0.5">
              {vote === "approve" ? "✅" : "❌"}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-stone-800">
                You voted{" "}
                <span className="font-medium capitalize">{vote}</span> on
                &ldquo;{issue.title as string}&rdquo;
              </p>
              <p className="text-xs text-stone-400 mt-0.5">
                {new Date(voteRecord.createdAt as string).toLocaleDateString()}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function ClaimsList({ items }: { items: Record<string, unknown>[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-stone-400 text-center py-8">
        You haven&apos;t claimed any work packages yet.
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {items.map((claim) => {
        const wp = claim.workPackage as Record<string, unknown>;
        const issue = wp.issue as Record<string, unknown>;
        const status = claim.status as string;
        return (
          <Link
            key={claim.id as string}
            href={`/issues/${issue.id}`}
            className="flex items-start gap-3 px-3 py-3 rounded-lg hover:bg-stone-50 transition-colors"
          >
            <span className="text-lg mt-0.5">📋</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-stone-800">
                {wp.title as string}
              </p>
              <div className="flex items-center gap-2 text-xs text-stone-400 mt-0.5">
                <span className="capitalize">
                  {claimStatusLabels[status] ?? status}
                </span>
                <span>·</span>
                <span>{issue.title as string}</span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function NotificationsList({ items }: { items: Record<string, unknown>[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-stone-400 text-center py-8">
        No notifications yet.
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {items.map((notif) => (
        <div
          key={notif.id as string}
          className={`flex items-start gap-3 px-3 py-3 rounded-lg ${
            notif.read ? "" : "bg-stone-50"
          }`}
        >
          <span className="text-lg mt-0.5">
            {notif.read ? "📬" : "📩"}
          </span>
          <div className="flex-1 min-w-0">
            <p
              className={`text-sm ${notif.read ? "text-stone-500" : "text-stone-800 font-medium"}`}
            >
              {notif.message as string}
            </p>
            <p className="text-xs text-stone-400 mt-0.5">
              {new Date(notif.createdAt as string).toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
