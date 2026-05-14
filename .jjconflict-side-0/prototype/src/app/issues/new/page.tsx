"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import { fetchIssues, createIssue } from "@/lib/api";

export default function CreateIssuePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [scope, setScope] = useState<"local" | "national" | "global">("local");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [rewardIntent, setRewardIntent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [similar, setSimilar] = useState<Record<string, unknown>[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (title.length <= 3) {
      setSimilar([]);
      return;
    }

    debounceRef.current = setTimeout(() => {
      fetchIssues({ search: title })
        .then((items) => setSimilar(items as Record<string, unknown>[]))
        .catch(() => setSimilar([]));
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [title]);

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const newIssue = await createIssue({
        title,
        summary,
        description,
        scope,
        tags,
        rewardIntent,
      });
      router.push(`/issues/${(newIssue as Record<string, unknown>).id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create issue");
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-xl mx-auto space-y-6">
        <h1 className="text-xl font-semibold text-stone-900">
          Create a New Issue
        </h1>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's the problem or opportunity?"
              className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400"
            />
          </div>

          {/* Similar issues */}
          {similar.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
              <p className="font-medium text-amber-800 mb-1">
                ⚠️ Similar issues found:
              </p>
              {similar.map((s) => (
                <p key={s.id as string} className="text-amber-700">
                  &ldquo;{s.title as string}&rdquo; —{" "}
                  <a href={`/issues/${s.id}`} className="underline">
                    View issue
                  </a>
                </p>
              ))}
            </div>
          )}

          {/* Summary */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Summary{" "}
              <span className="font-normal text-stone-400">
                (1–2 sentences)
              </span>
            </label>
            <input
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Brief description of the issue"
              className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide more detail about the problem and any proposed solutions..."
              rows={6}
              className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400 resize-y"
            />
          </div>

          {/* Scope + Tags */}
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Scope
              </label>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value as "local" | "national" | "global")}
                className="px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white focus:outline-none"
              >
                <option value="local">Local</option>
                <option value="national">National</option>
                <option value="global">Global</option>
              </select>
            </div>

            <div className="flex-1 min-w-48">
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Topics
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  placeholder="Add a tag"
                  className="flex-1 px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400"
                />
                <button
                  onClick={addTag}
                  className="px-3 py-2 text-sm border border-stone-200 rounded-lg hover:bg-stone-50"
                >
                  +
                </button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded-full bg-stone-100 text-xs text-stone-600 flex items-center gap-1"
                    >
                      {t}
                      <button
                        onClick={() => setTags(tags.filter((x) => x !== t))}
                        className="text-stone-400 hover:text-stone-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Reward intent */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Reward intent{" "}
              <span className="font-normal text-stone-400">(optional)</span>
            </label>
            <input
              type="text"
              value={rewardIntent}
              onChange={(e) => setRewardIntent(e.target.value)}
              placeholder="e.g. 500 $CC per milestone"
              className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400"
            />
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <a
            href="/"
            className="px-4 py-2 text-sm text-stone-500 hover:text-stone-700"
          >
            Cancel
          </a>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-2 text-sm bg-stone-800 text-white rounded-lg hover:bg-stone-700 disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit Issue"}
          </button>
        </div>
      </div>
    </Layout>
  );
}
