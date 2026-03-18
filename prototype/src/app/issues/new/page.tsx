"use client";

import { useState } from "react";
import Layout from "@/components/Layout";
import { issues } from "@/lib/mock-data";

export default function CreateIssue() {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [scope, setScope] = useState("local");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  // Simulate duplicate detection
  const similar = title.length > 3
    ? issues.filter((i) =>
        i.title.toLowerCase().includes(title.toLowerCase().slice(0, 8))
      )
    : [];

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  if (submitted) {
    return (
      <Layout>
        <div className="text-center py-16 space-y-4">
          <div className="text-4xl">✅</div>
          <h2 className="text-lg font-medium text-stone-800">Issue created!</h2>
          <p className="text-sm text-stone-500">
            (This is a prototype — the issue is not actually saved.)
          </p>
        </div>
      </Layout>
    );
  }

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
                <p key={s.id} className="text-amber-700">
                  "{s.title}" —{" "}
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
                onChange={(e) => setScope(e.target.value)}
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
            <div className="flex gap-2 items-center text-sm">
              <input
                type="text"
                placeholder="Amount"
                className="w-24 px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400"
              />
              <span className="text-stone-500">$CC per</span>
              <select className="px-3 py-2 border border-stone-200 rounded-lg bg-white focus:outline-none">
                <option>milestone</option>
                <option>month</option>
                <option>action</option>
              </select>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <a
            href="/"
            className="px-4 py-2 text-sm text-stone-500 hover:text-stone-700"
          >
            Cancel
          </a>
          <button
            onClick={() => setSubmitted(true)}
            className="px-5 py-2 text-sm bg-stone-800 text-white rounded-lg hover:bg-stone-700"
          >
            Submit Issue
          </button>
        </div>
      </div>
    </Layout>
  );
}
