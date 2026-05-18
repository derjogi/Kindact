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
  draft: "bg-on-surface-variant",
  deliberating: "bg-status-deliberating",
  vote_ready: "bg-status-voting",
  "vote-ready": "bg-status-voting",
  adopted: "bg-status-adopted",
  implementing: "bg-status-implementing",
  completed: "bg-status-completed",
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
  const [notifications, setNotifications] = useState<Record<string, unknown>[]>(
    [],
  );
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
        <div className="text-center py-16 font-meta text-sm text-on-surface-variant">
          Loading…
        </div>
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
        {/* Editorial header */}
        <section className="p-6 bg-surface-container-lowest rounded-md border-l-4 border-primary card-lift">
          <p className="font-meta text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">
            Your Record
          </p>
          <h1 className="font-display text-3xl font-bold text-on-surface">
            My Activity
            {displayName && (
              <span className="font-sans text-base font-normal text-on-surface-variant ml-2">
                ({displayName})
              </span>
            )}
          </h1>
        </section>

        {/* Balance */}
        <div className="bg-surface-container-lowest rounded-md p-5 card-lift">
          <div className="font-meta text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">
            $CC Balance
          </div>
          <div className="font-display text-3xl font-semibold text-on-surface">
            💰 {balance !== null ? balance.toFixed(1) : "—"} $CC
          </div>
          <div className="font-meta text-sm text-on-surface-variant mt-1">
            Decays ~1% / month
          </div>
        </div>

        {/* Tab strip */}
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 min-h-[44px] font-meta text-sm whitespace-nowrap rounded-md transition-colors ${
                activeTab === tab.key
                  ? "bg-primary text-on-primary"
                  : "text-on-surface-variant hover:text-primary-dim bg-surface-container-low"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="bg-surface-container-lowest rounded-md p-5 card-lift">
          {tabLoading ? (
            <p className="text-center font-meta text-sm text-on-surface-variant py-8">
              Loading…
            </p>
          ) : (
            <>
              {activeTab === "issues" && <IssuesList items={issues} />}
              {activeTab === "votes" && <VotesList items={votes} />}
              {activeTab === "claims" && <ClaimsList items={claims} />}
              {activeTab === "notifications" && (
                <NotificationsList items={notifications} />
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}

function IssuesList({ items }: { items: Record<string, unknown>[] }) {
  if (items.length === 0) {
    return (
      <p className="font-meta text-sm text-on-surface-variant text-center py-8">
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
          className="flex items-start gap-3 px-3 py-3 rounded-md hover:bg-surface-container-low transition-colors"
        >
          <span
            className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${statusColors[issue.status as string] ?? "bg-on-surface-variant"}`}
          />
          <div className="flex-1 min-w-0">
            <p className="font-display text-sm font-medium text-on-surface truncate">
              {issue.title as string}
            </p>
            <div className="flex items-center gap-2 font-meta text-xs text-on-surface-variant mt-0.5">
              <span>
                {statusLabels[issue.status as string] ??
                  (issue.status as string)}
              </span>
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
      <p className="font-meta text-sm text-on-surface-variant text-center py-8">
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
            className="flex items-start gap-3 px-3 py-3 rounded-md hover:bg-surface-container-low transition-colors"
          >
            <span className="text-lg mt-0.5">
              {vote === "approve" ? "✅" : "❌"}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-on-surface">
                You voted{" "}
                <span className="font-medium capitalize">{vote}</span> on
                &ldquo;{issue.title as string}&rdquo;
              </p>
              <p className="font-meta text-xs text-on-surface-variant mt-0.5">
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
      <p className="font-meta text-sm text-on-surface-variant text-center py-8">
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
            className="flex items-start gap-3 px-3 py-3 rounded-md hover:bg-surface-container-low transition-colors"
          >
            <span className="text-lg mt-0.5">📋</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-on-surface">{wp.title as string}</p>
              <div className="flex items-center gap-2 font-meta text-xs text-on-surface-variant mt-0.5">
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
      <p className="font-meta text-sm text-on-surface-variant text-center py-8">
        No notifications yet.
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {items.map((notif) => (
        <div
          key={notif.id as string}
          className={`flex items-start gap-3 px-3 py-3 rounded-md transition-colors ${
            notif.read ? "" : "bg-surface-container-low"
          }`}
        >
          <span className="text-lg mt-0.5">{notif.read ? "📬" : "📩"}</span>
          <div className="flex-1 min-w-0">
            <p
              className={`text-sm ${notif.read ? "text-on-surface-variant" : "text-on-surface font-medium"}`}
            >
              {notif.message as string}
            </p>
            <p className="font-meta text-xs text-on-surface-variant mt-0.5">
              {new Date(notif.createdAt as string).toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
