"use client";

import { useState } from "react";
import Link from "next/link";
import Layout from "@/components/Layout";

interface Step {
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  illo: string;
}

const STEPS: Step[] = [
  {
    eyebrow: "Welcome",
    title: "Governance, kept like a library.",
    body:
      "Kindact is a living archive of community decisions. Every issue, proposal, and vote is a record — preserved in cells you can subscribe to, fork, or join.",
    cta: "Begin the tour",
    illo: "📚",
  },
  {
    eyebrow: "Step 1 of 3",
    title: "Subscribe to anchors.",
    body:
      "Anchors are durable handles for topics, places, and events. Subscribe to follow them across every cell — no membership required, no algorithmic feed.",
    cta: "Got it",
    illo: "📍",
  },
  {
    eyebrow: "Step 2 of 3",
    title: "Join cells to participate.",
    body:
      "Cells are bounded communities with their own membranes and governance rules. Members post, deliberate, and vote. Guests can contribute to single issues.",
    cta: "Got it",
    illo: "🏘️",
  },
  {
    eyebrow: "Step 3 of 3",
    title: "Earn $CC by completing work.",
    body:
      "Adopted issues spawn work packages. Submit reports, get verified by your peers, and receive $CC — a contribution credit that decays over time so the community keeps moving.",
    cta: "Enter the archive",
    illo: "💰",
  },
];

export default function OnboardingPage() {
  const [stepIndex, setStepIndex] = useState(0);
  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-8 py-6">
        {/* Step indicator */}
        <div className="flex items-center gap-2 justify-center">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === stepIndex
                  ? "w-8 bg-primary"
                  : i < stepIndex
                  ? "w-4 bg-primary-container"
                  : "w-4 bg-surface-container-low"
              }`}
            />
          ))}
        </div>

        {/* Card */}
        <article className="bg-surface-container-lowest rounded-md p-10 text-center space-y-5 card-lift">
          <div className="text-6xl" aria-hidden>
            {step.illo}
          </div>
          <p className="font-meta text-[10px] uppercase tracking-widest text-on-surface-variant">
            {step.eyebrow}
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-on-surface leading-tight">
            {step.title}
          </h1>
          <p className="font-sans text-base leading-[1.6] text-on-surface-variant max-w-prose mx-auto">
            {step.body}
          </p>

          <div className="pt-2 flex flex-col items-center gap-3">
            {isLast ? (
              <Link
                href="/"
                className="btn-primary inline-flex items-center justify-center px-6 py-3 rounded-md text-sm font-medium"
              >
                {step.cta}
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setStepIndex((i) => i + 1)}
                className="btn-primary inline-flex items-center justify-center px-6 py-3 rounded-md text-sm font-medium"
              >
                {step.cta}
              </button>
            )}
            {!isLast ? (
              <Link
                href="/"
                className="font-meta text-xs text-on-surface-variant hover:text-primary-dim underline"
              >
                Skip onboarding
              </Link>
            ) : null}
          </div>
        </article>

        {stepIndex > 0 ? (
          <div className="text-center">
            <button
              type="button"
              onClick={() => setStepIndex((i) => i - 1)}
              className="font-meta text-xs text-on-surface-variant hover:text-primary-dim"
            >
              ← Back
            </button>
          </div>
        ) : null}
      </div>
    </Layout>
  );
}
