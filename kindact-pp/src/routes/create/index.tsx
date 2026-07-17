import { $, component$, useContext, useSignal } from "@builder.io/qwik";
import { useNavigate } from "@builder.io/qwik-city";
import { linkedContext } from "~/lib/context";
import { createIssue } from "~/lib/holochain";
import { setSignInIntent } from "~/lib/signin";

export default component$(() => {
  const linked = useContext(linkedContext);
  const nav = useNavigate();
  const title = useSignal("");
  const description = useSignal("");
  const tags = useSignal("");
  const submitting = useSignal(false);
  const error = useSignal<string | null>(null);

  const submit = $(async () => {
    const cleanTitle = title.value.trim();
    if (!cleanTitle) {
      error.value = "Title is required";
      return;
    }
    const cleanTags = [
      ...new Set(
        tags.value
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      ),
    ];
    submitting.value = true;
    error.value = null;
    try {
      const hash = await createIssue({
        title: cleanTitle,
        description: description.value.trim(),
        tags: cleanTags,
      });
      await nav(`/issue/#${hash}`);
    } catch (e: any) {
      error.value = e.message || "Failed to create issue";
      submitting.value = false;
    }
  });

  if (!linked.value) {
    return (
      <div class="max-w-xl mx-auto text-center py-16">
        <h1 class="text-2xl font-bold mb-4">Create issue</h1>
        <p class="text-gray-400 mb-6">
          Sign in with Flowsta to create issues with verified identity.
        </p>
        <button
          type="button"
          onClick$={() => {
            setSignInIntent({ autoLink: true, returnTo: "/create/" });
            nav("/identity/");
          }}
          class="bg-transparent border-0 p-0 cursor-pointer"
        >
          <img
            src="/assets/flowsta-signin.svg"
            alt="Sign in with Flowsta"
            width={158}
            height={36}
            class="mx-auto hover:opacity-80"
          />
        </button>
      </div>
    );
  }

  return (
    <div class="max-w-xl mx-auto">
      <h1 class="text-2xl font-bold mb-6">Create issue</h1>
      {error.value && (
        <div class="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-4">
          {error.value}
        </div>
      )}
      <div class="space-y-5">
        <label class="block">
          <span class="block text-sm text-gray-300 mb-1">Title</span>
          <input
            value={title.value}
            onInput$={(e) =>
              (title.value = (e.target as HTMLInputElement).value)
            }
            class="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white"
            placeholder="What needs deliberation?"
          />
        </label>
        <label class="block">
          <span class="block text-sm text-gray-300 mb-1">Description</span>
          <textarea
            value={description.value}
            onInput$={(e) =>
              (description.value = (e.target as HTMLTextAreaElement).value)
            }
            rows={8}
            class="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white"
            placeholder="Provide context and explain the issue…"
          />
        </label>
        <label class="block">
          <span class="block text-sm text-gray-300 mb-1">Tags</span>
          <input
            value={tags.value}
            onInput$={(e) =>
              (tags.value = (e.target as HTMLInputElement).value)
            }
            class="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white"
            placeholder="housing, transport, accessibility"
          />
          <span class="text-xs text-gray-500">Separate tags with commas.</span>
        </label>
        <div class="flex gap-3">
          <button
            type="button"
            onClick$={submit}
            disabled={submitting.value}
            class="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2 rounded-full font-medium"
          >
            {submitting.value ? "Creating…" : "Create issue"}
          </button>
          <button
            type="button"
            onClick$={() => nav("/")}
            class="text-gray-400 hover:text-white"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
});
