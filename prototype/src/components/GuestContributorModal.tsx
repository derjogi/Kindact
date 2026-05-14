"use client";

import { useState } from "react";
import type { CellTier } from "@/lib/types";

interface CellLite {
  id: string;
  cellId: string;
  displayName: string;
  tier: CellTier;
  membraneWrite?: string;
  scopeProofTypes?: string[];
}

interface Props {
  open: boolean;
  cell: CellLite;
  issueId: string;
  issueTitle: string;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

const tierDot: Record<CellTier, string> = {
  canonical: "bg-emerald-500",
  promoted: "bg-sky-500",
  uncurated: "bg-stone-400",
};

export default function GuestContributorModal({
  open,
  cell,
  issueTitle,
  onClose,
  onConfirm,
}: Props) {
  const [step, setStep] = useState<"explain" | "proof" | "submitting">("explain");
  const [proofText, setProofText] = useState("");
  const [proofConfirmed, setProofConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const requiresProof =
    cell.membraneWrite && cell.membraneWrite !== "public";
  const proofTypes = cell.scopeProofTypes ?? [];

  const handleAdvance = () => {
    setError(null);
    if (step === "explain") {
      setStep(requiresProof ? "proof" : "submitting");
      if (!requiresProof) submit();
    } else if (step === "proof") {
      if (!proofConfirmed && !proofText.trim()) {
        setError("Please add proof or check the confirmation box.");
        return;
      }
      setStep("submitting");
      submit();
    }
  };

  const submit = async () => {
    try {
      await onConfirm();
      onClose();
      // Reset for next open.
      setStep("explain");
      setProofText("");
      setProofConfirmed(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to register guest contribution");
      setStep("explain");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-stone-900">
              Contribute as guest
            </h2>
            <p className="mt-0.5 text-sm text-stone-500 flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${tierDot[cell.tier]}`} />
              {cell.cellId}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {step === "explain" ? (
          <div className="space-y-3">
            <div className="bg-stone-50 border border-stone-200 rounded-md p-3 text-sm text-stone-700">
              <p className="font-medium text-stone-900 mb-1">{issueTitle}</p>
              <p>
                You&apos;ll get write access to <em>this issue only</em> in{" "}
                <code className="text-xs bg-white px-1 py-0.5 rounded border border-stone-200">
                  {cell.cellId}
                </code>
                . No validation duties. You can comment, vote, and submit work reports.
              </p>
            </div>
            <ul className="text-xs text-stone-500 space-y-1 list-disc pl-5">
              <li>You will not become a full member of the cell.</li>
              <li>Your guest badge appears next to your alias on every interaction.</li>
              <li>Access ends when this issue is archived.</li>
            </ul>
          </div>
        ) : null}

        {step === "proof" ? (
          <div className="space-y-3">
            <p className="text-sm text-stone-700">
              <strong>{cell.cellId}</strong> requires scope proof before guest writes.
            </p>
            {proofTypes.length > 0 ? (
              <p className="text-xs text-stone-500">
                Accepted: {proofTypes.map((p) => p.replace(/_/g, " ")).join(", ")}
              </p>
            ) : null}
            <textarea
              value={proofText}
              onChange={(e) => setProofText(e.target.value)}
              placeholder="Paste invite token, evidence URL, or notes about your scope claim…"
              className="w-full min-h-[88px] text-sm rounded-md border border-stone-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-stone-400"
            />
            <label className="flex items-start gap-2 text-xs text-stone-600">
              <input
                type="checkbox"
                checked={proofConfirmed}
                onChange={(e) => setProofConfirmed(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                I attest that the information above is accurate. (Prototype: this
                is recorded locally and not cryptographically verified.)
              </span>
            </label>
          </div>
        ) : null}

        {error ? (
          <p className="text-xs text-rose-600">{error}</p>
        ) : null}

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-stone-600 hover:text-stone-900"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAdvance}
            disabled={step === "submitting"}
            className="px-3 py-1.5 text-sm font-medium rounded bg-stone-800 hover:bg-stone-900 text-white disabled:opacity-60"
          >
            {step === "submitting"
              ? "Registering…"
              : step === "explain"
              ? requiresProof
                ? "Continue"
                : "Confirm"
              : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
