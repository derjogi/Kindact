import {
  $,
  component$,
  useContext,
  useSignal,
  useVisibleTask$,
} from "@builder.io/qwik";
import { useNavigate } from "@builder.io/qwik-city";
import { invoke } from "@tauri-apps/api/core";
import { linkedContext } from "~/lib/context";
import { setSignInIntent } from "~/lib/signin";
import {
  deleteIssue,
  flagIssue,
  getComments,
  getIssue,
  getIssueFlags,
  loadMyAgentSet,
  postComment,
  removeFlag,
  type CommentData,
  type FlagData,
  type FlagReason,
  type Issue,
} from "~/lib/holochain";

const shortAgent = (agent: string) =>
  `${agent.slice(0, 10)}…${agent.slice(-6)}`;

export default component$(() => {
  const linked = useContext(linkedContext);
  const nav = useNavigate();
  const issueHash = useSignal("");
  const issue = useSignal<Issue | null>(null);
  const author = useSignal("");
  const comments = useSignal<CommentData[]>([]);
  const flags = useSignal<FlagData[]>([]);
  const myAgents = useSignal<Set<string>>(new Set());
  const myAgent = useSignal<string | null>(null);
  const comment = useSignal("");
  const flagReason = useSignal<FlagReason>("Spam");
  const loading = useSignal(true);
  const submitting = useSignal(false);
  const error = useSignal<string | null>(null);

  const refresh = $(async () => {
    const [detail, commentRows, flagRows, status] = await Promise.all([
      getIssue(issueHash.value),
      getComments(issueHash.value),
      getIssueFlags(issueHash.value).catch(() => [] as FlagData[]),
      invoke<{ agent_pub_key: string | null }>("get_app_status"),
    ]);
    issue.value = detail?.issue ?? null;
    author.value = detail?.author ?? "";
    comments.value = commentRows;
    flags.value = flagRows;
    myAgent.value = status.agent_pub_key;
    myAgents.value = await loadMyAgentSet(status.agent_pub_key);
  });

  useVisibleTask$(async () => {
    issueHash.value = window.location.hash.slice(1);
    if (!issueHash.value) {
      error.value = "Missing issue hash";
      loading.value = false;
      return;
    }
    try {
      await refresh();
    } catch (e: any) {
      error.value = e.message || "Failed to load issue";
    } finally {
      loading.value = false;
    }
  });

  const submitComment = $(async () => {
    const content = comment.value.trim();
    if (!content) return;
    submitting.value = true;
    error.value = null;
    try {
      await postComment(issueHash.value, content);
      comment.value = "";
      comments.value = await getComments(issueHash.value);
    } catch (e: any) {
      error.value = e.message || "Failed to post comment";
    } finally {
      submitting.value = false;
    }
  });

  const handleDelete = $(async () => {
    if (!window.confirm("Delete this issue?")) return;
    await deleteIssue(issueHash.value);
    await nav("/");
  });

  const handleFlag = $(async () => {
    await flagIssue(issueHash.value, flagReason.value);
    flags.value = await getIssueFlags(issueHash.value);
  });

  if (loading.value) return <p class="text-gray-400">Loading issue...</p>;
  if (error.value && !issue.value)
    return <p class="text-red-400">{error.value}</p>;
  if (!issue.value) return <p class="text-gray-400">Issue not found.</p>;

  return (
    <div class="max-w-3xl mx-auto space-y-6">
      <article class="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h1 class="text-2xl font-bold text-white">{issue.value.title}</h1>
            <p class="text-xs text-gray-500 mt-1">
              Created by{" "}
              {myAgents.value.has(author.value)
                ? "You"
                : shortAgent(author.value)}
            </p>
          </div>
          {myAgent.value === author.value && (
            <button
              type="button"
              onClick$={handleDelete}
              class="text-sm text-red-400 hover:text-red-300"
            >
              Delete
            </button>
          )}
        </div>
        {issue.value.description && (
          <p class="text-gray-300 whitespace-pre-wrap mt-5">
            {issue.value.description}
          </p>
        )}
        {issue.value.tags.length > 0 && (
          <div class="flex flex-wrap gap-2 mt-5">
            {issue.value.tags.map((tag) => (
              <span
                key={tag}
                class="text-xs bg-indigo-950 text-indigo-300 px-2 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </article>

      {error.value && (
        <div class="bg-red-900/40 border border-red-700 text-red-300 px-4 py-3 rounded-lg">
          {error.value}
        </div>
      )}

      <section>
        <h2 class="text-lg font-semibold mb-3">Comments</h2>
        {comments.value.length === 0 ? (
          <p class="text-gray-500 text-sm">No comments yet.</p>
        ) : (
          <div class="space-y-3">
            {comments.value.map((row) => (
              <div
                key={row.hash}
                class="bg-gray-900 border border-gray-800 rounded-lg p-4"
              >
                <div class="text-xs text-gray-500 mb-2">
                  {myAgents.value.has(row.author)
                    ? "You"
                    : shortAgent(row.author)}{" "}
                  · {new Date(row.comment.created_at * 1000).toLocaleString()}
                </div>
                <p class="text-gray-200 whitespace-pre-wrap">
                  {row.comment.content}
                </p>
              </div>
            ))}
          </div>
        )}

        {linked.value ? (
          <div class="mt-4 space-y-2">
            <textarea
              value={comment.value}
              onInput$={(e) =>
                (comment.value = (e.target as HTMLTextAreaElement).value)
              }
              rows={4}
              placeholder="Add to the discussion…"
              class="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
            />
            <button
              type="button"
              disabled={submitting.value || !comment.value.trim()}
              onClick$={submitComment}
              class="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-full text-sm font-medium"
            >
              {submitting.value ? "Posting…" : "Post comment"}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick$={() => {
              setSignInIntent({
                autoLink: true,
                returnTo: `/issue/#${issueHash.value}`,
              });
              nav("/identity/");
            }}
            class="mt-4 text-indigo-400 hover:text-indigo-300 text-sm"
          >
            Sign in to comment
          </button>
        )}
      </section>

      {linked.value && (
        <section class="border-t border-gray-800 pt-5 flex items-center gap-3">
          <select
            value={flagReason.value}
            onChange$={(e) =>
              (flagReason.value = (e.target as HTMLSelectElement)
                .value as FlagReason)
            }
            class="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm"
          >
            <option value="Spam">Spam</option>
            <option value="Misleading">Misleading</option>
            <option value="OffTopic">Off topic</option>
            <option value="Inappropriate">Inappropriate</option>
          </select>
          {flags.value.some((row) => row.author === myAgent.value) ? (
            <button
              type="button"
              onClick$={async () => {
                const mine = flags.value.find(
                  (row) => row.author === myAgent.value,
                );
                if (mine) {
                  await removeFlag(mine.hash);
                  flags.value = await getIssueFlags(issueHash.value);
                }
              }}
              class="text-sm text-gray-400 hover:text-white"
            >
              Remove your flag
            </button>
          ) : (
            <button
              type="button"
              onClick$={handleFlag}
              class="text-sm text-amber-400 hover:text-amber-300"
            >
              Flag issue
            </button>
          )}
          {flags.value.length > 0 && (
            <span class="text-xs text-gray-500">
              {flags.value.length} flag{flags.value.length === 1 ? "" : "s"}
            </span>
          )}
        </section>
      )}
    </div>
  );
});
