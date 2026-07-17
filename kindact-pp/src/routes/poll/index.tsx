import { component$, useVisibleTask$ } from "@builder.io/qwik";

/** Compatibility redirect for links created before polls became issues. */
export default component$(() => {
  useVisibleTask$(() => {
    window.location.replace(`/issue/${window.location.hash}`);
  });
  return <p class="text-gray-400">Redirecting to the issue…</p>;
});
