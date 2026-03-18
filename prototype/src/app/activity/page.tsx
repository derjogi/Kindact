"use client";

import Link from "next/link";
import Layout from "@/components/Layout";
import { currentUser } from "@/lib/mock-data";

const typeIcons: Record<string, string> = {
  comment: "💬",
  vote: "🗳️",
  earned: "💰",
  claimed: "✅",
};

export default function ActivityPage() {
  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-xl font-semibold text-stone-900">My Activity</h1>

        {/* Balance */}
        <div className="bg-white rounded-lg border border-stone-200 p-5">
          <div className="text-2xl font-semibold text-stone-900">
            💰 {currentUser.balance} $CC
          </div>
          <div className="text-sm text-stone-400 mt-1">
            Decays ~{currentUser.decayRate} $CC/month
          </div>
        </div>

        {/* Activity feed */}
        <div className="space-y-1">
          {currentUser.activities.map((activity) => (
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
