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
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Editorial header */}
        <section className="p-6 bg-surface-container-lowest rounded-md border-l-4 border-primary card-lift">
          <p className="font-meta text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">
            New entry
          </p>
          <h1 className="font-display text-3xl font-bold text-on-surface">
            Create a New Issue
          </h1>
        </section>

        <div className="space-y-5">
          {/* Title */}
          <Field label="Title">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's the problem or opportunity?"
              className="input-line w-full px-3 py-2 text-sm focus:outline-none"
            />
          </Field>

          {/* Similar issues */}
          {similar.length > 0 && (
            <div className="p-4 bg-surface-container-lowest border-l-4 border-status-implementing rounded-md text-sm card-lift">
              <p className="font-meta text-xs uppercase tracking-widest text-on-surface-variant mb-2">
                ⚠️ Similar issues found
              </p>
              <div className="space-y-1">
                {similar.map((s) => (
                  <p key={s.id as string} className="text-on-surface">
                    &ldquo;{s.title as string}&rdquo; —{" "}
                    <a
                      href={`/issues/${s.id}`}
                      className="underline text-primary-dim"
                    >
                      View issue
                    </a>
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          <Field
            label="Summary"
            hint="1–2 sentences"
          >
            <input
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Brief description of the issue"
              className="input-line w-full px-3 py-2 text-sm focus:outline-none"
            />
          </Field>

          {/* Description */}
          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide more detail about the problem and any proposed solutions…"
              rows={6}
              className="input-line w-full px-3 py-2 text-sm focus:outline-none resize-y"
            />
          </Field>

          {/* Scope + Tags */}
          <div className="flex flex-wrap gap-4">
            <Field label="Scope">
              <select
                value={scope}
                onChange={(e) =>
                  setScope(e.target.value as "local" | "national" | "global")
                }
                className="input-line px-3 py-2 text-sm focus:outline-none"
              >
                <option value="local">Local</option>
                <option value="national">National</option>
                <option value="global">Global</option>
              </select>
            </Field>

            <div className="flex-1 min-w-48">
              <label className="block">
                <div className="font-meta text-xs uppercase tracking-widest text-on-surface-variant mb-1.5">
                  Topics
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && (e.preventDefault(), addTag())
                    }
                    placeholder="Add a tag"
                    className="input-line flex-1 px-3 py-2 text-sm focus:outline-none"
                  />
                  <button
                    onClick={addTag}
                    type="button"
                    className="px-3 py-2 text-sm rounded-md bg-surface-container-low hover:bg-surface-container text-on-surface"
                  >
                    +
                  </button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {tags.map((t) => (
                      <span
                        key={t}
                        className="font-meta px-2 py-0.5 rounded-full bg-surface-container-low text-xs text-on-surface flex items-center gap-1"
                      >
                        {t}
                        <button
                          type="button"
                          onClick={() =>
                            setTags(tags.filter((x) => x !== t))
                          }
                          className="text-on-surface-variant hover:text-on-surface"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Reward intent */}
          <Field label="Reward intent" hint="optional">
            <input
              type="text"
              value={rewardIntent}
              onChange={(e) => setRewardIntent(e.target.value)}
              placeholder="e.g. 500 $CC per milestone"
              className="input-line w-full px-3 py-2 text-sm focus:outline-none"
            />
          </Field>
        </div>

        {error && (
          <div className="p-3 bg-surface-container-lowest border-l-4 border-status-adopted rounded-md text-sm text-on-surface card-lift">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <a
            href="/"
            className="px-4 py-2 text-sm text-on-surface-variant hover:text-on-surface"
          >
            Cancel
          </a>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary px-5 py-2 text-sm rounded-md font-medium disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit Issue"}
          </button>
        </div>
      </div>
    </Layout>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="font-meta text-xs uppercase tracking-widest text-on-surface-variant mb-1.5">
        {label}
        {hint ? (
          <span className="normal-case tracking-normal text-on-surface-variant ml-2">
            ({hint})
          </span>
        ) : null}
      </div>
      {children}
    </label>
  );
}
