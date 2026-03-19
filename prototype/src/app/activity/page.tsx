"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Layout from "@/components/Layout";
import { fetchMe, fetchMyBalance } from "@/lib/api";

const staticActivities = [
  {
    id: "a1",
    type: "comment",
    issueId: "1",
    detail: 'You commented on "Fix drainage on Elm Street"',
    createdAt: "2h ago",
  },
  {
    id: "a2",
    type: "vote",
    issueId: "2",
    detail: 'You voted Approve on "Community solar panel program"',
    createdAt: "1d ago",
  },
  {
    id: "a3",
    type: "earned",
    issueId: "5",
    detail: "You earned 25 $CC for community garden work day",
    createdAt: "3d ago",
  },
  {
    id: "a4",
    type: "claimed",
    issueId: "5",
    detail: 'Your claim on "Community garden" was verified',
    createdAt: "3d ago",
  },
  {
    id: "a5",
    type: "vote",
    issueId: "7",
    detail: 'You voted Approve on "Free public Wi-Fi"',
    createdAt: "5d ago",
  },
];

const typeIcons: Record<string, string> = {
  comment: "💬",
  vote: "🗳️",
  earned: "💰",
  claimed: "✅",
};

export default function ActivityPage() {
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [me, balRes] = await Promise.all([
          fetchMe(),
          fetchMyBalance(),
        ]);
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

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-16 text-stone-400">Loading…</div>
      </Layout>
    );
  }

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
          <div className="text-sm text-stone-400 mt-1">
            Decays ~1% / month
          </div>
        </div>

        {/* Activity feed */}
        <div className="space-y-1">
          {staticActivities.map((activity) => (
            <Link
              key={activity.id}
              href={`/issues/${activity.issueId}`}
              className="flex items-start gap-3 px-4 py-3 rounded-lg hover:bg-white transition-colors"
            >
              <span className="text-lg mt-0.5">
                {typeIcons[activity.type]}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-stone-700">{activity.detail}</p>
                <p className="text-xs text-stone-400 mt-0.5">
                  {activity.createdAt}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
}
