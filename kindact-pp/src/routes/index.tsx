import {
  $,
  component$,
  useComputed$,
  useContext,
  useSignal,
  useVisibleTask$,
} from "@builder.io/qwik";
import { Link, useNavigate } from "@builder.io/qwik-city";
import { invoke } from "@tauri-apps/api/core";
import { linkedContext } from "~/lib/context";
import {
  getAllIssues,
  loadMyAgentSet,
  type IssueListItem,
} from "~/lib/holochain";
import { setSignInIntent } from "~/lib/signin";

type Filter = "all" | "created";

export default component$(() => {
  const linked = useContext(linkedContext);
  const nav = useNavigate();
  const issues = useSignal<IssueListItem[]>([]);
  const myAgents = useSignal<Set<string>>(new Set());
  const filter = useSignal<Filter>("all");
  const loading = useSignal(true);
  const error = useSignal<string | null>(null);

  const load = $(async () => {
    const [rows, status] = await Promise.all([
      getAllIssues(),
      invoke<{ agent_pub_key: string | null }>("get_app_status"),
    ]);
    issues.value = rows;
    myAgents.value = await loadMyAgentSet(status.agent_pub_key);
  });

  useVisibleTask$(async ({ cleanup }) => {
    try {
      await load();
    } catch (e: any) {
      error.value = e.message || "Failed to load issues";
    } finally {
      loading.value = false;
    }
    const timer = setInterval(() => load().catch(() => undefined), 30_000);
    cleanup(() => clearInterval(timer));
  });

  const visible = useComputed$(() =>
    filter.value === "created"
      ? issues.value.filter((row) => myAgents.value.has(row.author))
      : issues.value,
  );

  return (
    <div>
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold">Issues</h1>
        {linked.value ? (
          <Link
            href="/create/"
            class="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-full text-sm font-medium"
          >
            Create issue
          </Link>
        ) : (
          <button
            type="button"
            onClick$={() => {
              setSignInIntent({ autoLink: true, returnTo: "/create/" });
              nav("/identity/");
            }}
            class="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-full text-sm font-medium"
          >
            Create issue
          </button>
        )}
      </div>

      <div class="flex gap-1 bg-gray-900 rounded-lg p-1 w-fit mb-5">
        {(["all", "created"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick$={() => (filter.value = value)}
            class={`px-3 py-1.5 rounded-md text-sm ${filter.value === value ? "bg-gray-700 text-white" : "text-gray-400"}`}
          >
            {value === "all" ? "All issues" : "Created by me"}
          </button>
        ))}
      </div>

      {loading.value ? (
        <p class="text-gray-400">Loading issues…</p>
      ) : error.value ? (
        <div class="text-red-400">{error.value}</div>
      ) : visible.value.length === 0 ? (
        <div class="text-center py-16 text-gray-400">No issues yet.</div>
      ) : (
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visible.value.map((row) => (
            <article
              key={row.hash}
              onClick$={() => nav(`/issue/#${row.hash}`)}
              class="bg-gray-900 border border-gray-800 rounded-lg p-5 hover:border-indigo-600 cursor-pointer"
            >
              <h2 class="text-lg font-semibold text-white">
                {row.issue.title}
              </h2>
              {row.issue.description && (
                <p class="text-gray-400 text-sm mt-2 line-clamp-3">
                  {row.issue.description}
                </p>
              )}
              {row.issue.tags.length > 0 && (
                <div class="flex flex-wrap gap-1.5 mt-4">
                  {row.issue.tags.map((tag) => (
                    <span
                      key={tag}
                      class="text-xs bg-indigo-950 text-indigo-300 px-2 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <p class="text-xs text-gray-600 mt-4">
                {new Date(row.issue.created_at * 1000).toLocaleDateString()}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
});
