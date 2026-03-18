import Link from "next/link";
import { Issue } from "@/lib/types";

const statusColors: Record<string, string> = {
  draft: "bg-stone-400",
  deliberating: "bg-emerald-500",
  "vote-ready": "bg-blue-500",
  adopted: "bg-violet-500",
  implementing: "bg-amber-500",
  completed: "bg-stone-600",
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  deliberating: "Deliberating",
  "vote-ready": "Voting",
  adopted: "Adopted",
  implementing: "Implementing",
  completed: "Completed",
};

export default function IssueCard({ issue }: { issue: Issue }) {
  const total = issue.votesTally.approve + issue.votesTally.reject;
  const pct = total > 0 ? Math.round((issue.votesTally.approve / total) * 100) : null;

  return (
    <Link
      href={`/issues/${issue.id}`}
      className="block rounded-lg border border-stone-200 bg-white px-4 py-3 hover:border-stone-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${statusColors[issue.status]}`}
            />
            <h3 className="font-medium text-stone-900 truncate">{issue.title}</h3>
          </div>
          <p className="text-sm text-stone-500 line-clamp-1">{issue.summary}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-400">
            <span className="capitalize">{issue.scope}</span>
            <span>·</span>
            <span>{issue.participants} participants</span>
            <span>·</span>
            <span>{statusLabels[issue.status]}</span>
            {pct !== null && (
              <>
                <span>·</span>
                <span>{pct}% approval</span>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-1 shrink-0">
          {issue.tags.slice(0, 2).map((t) => (
            <span
              key={t}
              className="px-2 py-0.5 rounded-full bg-stone-100 text-xs text-stone-500"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
