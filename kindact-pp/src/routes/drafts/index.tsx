import {
  $,
  component$,
  useContext,
  useSignal,
  useVisibleTask$,
} from "@builder.io/qwik";
import { linkedContext } from "~/lib/context";
import { deleteDraft, getMyDrafts, type DraftPollItem } from "~/lib/holochain";

export default component$(() => {
  const linked = useContext(linkedContext);
  const drafts = useSignal<DraftPollItem[]>([]);
  const loading = useSignal(true);
  const error = useSignal<string | null>(null);

  useVisibleTask$(async () => {
    if (!linked.value) {
      loading.value = false;
      return;
    }
    try {
      drafts.value = await getMyDrafts();
    } catch (e: any) {
      error.value = e.message || "Failed to load drafts";
    } finally {
      loading.value = false;
    }
  });

  const remove = $(async (hash: string) => {
    await deleteDraft(hash);
    drafts.value = drafts.value.filter((draft) => draft.hash !== hash);
  });

  if (!linked.value)
    return (
      <p class="text-gray-400">
        Sign in with Flowsta to view encrypted legacy drafts.
      </p>
    );
  if (loading.value) return <p class="text-gray-400">Loading drafts…</p>;

  return (
    <div class="max-w-2xl mx-auto">
      <h1 class="text-2xl font-bold mb-2">Legacy drafts</h1>
      <p class="text-sm text-amber-300 mb-6">
        Poll-shaped drafts are frozen during the issue migration. They can be
        reviewed or deleted, but not published as issues.
      </p>
      {error.value && <p class="text-red-400 mb-4">{error.value}</p>}
      {drafts.value.length === 0 ? (
        <p class="text-gray-500">No legacy drafts.</p>
      ) : (
        <div class="space-y-3">
          {drafts.value.map((draft) => (
            <article
              key={draft.hash}
              class="bg-gray-900 border border-gray-800 rounded-lg p-5"
            >
              <h2 class="font-medium">{draft.title || "Untitled"}</h2>
              {draft.description && (
                <p class="text-gray-400 text-sm mt-2">{draft.description}</p>
              )}
              <button
                type="button"
                onClick$={() => remove(draft.hash)}
                class="text-red-400 hover:text-red-300 text-sm mt-4"
              >
                Delete draft
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
});
