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
  canonical: "bg-status-deliberating",
  promoted: "bg-status-voting",
  uncurated: "bg-on-surface-variant",
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 backdrop-blur-[2px] p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-lowest rounded-md elevation-floating w-full max-w-lg p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-on-surface">
              Contribute as guest
            </h2>
            <p className="mt-0.5 font-meta text-sm text-on-surface-variant flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${tierDot[cell.tier]}`} />
              {cell.cellId}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {step === "explain" ? (
          <div className="space-y-3">
            <div className="bg-surface-container-low rounded-md p-3 text-sm text-on-surface">
              <p className="font-display font-medium text-on-surface mb-1">{issueTitle}</p>
              <p>
                You&apos;ll get write access to <em>this issue only</em> in{" "}
                <code className="text-xs bg-surface-container-lowest px-1 py-0.5 rounded font-mono">
                  {cell.cellId}
                </code>
                . No validation duties. You can comment, vote, and submit work reports.
              </p>
            </div>
            <ul className="font-meta text-xs text-on-surface-variant space-y-1 list-disc pl-5">
              <li>You will not become a full member of the cell.</li>
              <li>Your guest badge appears next to your alias on every interaction.</li>
              <li>Access ends when this issue is archived.</li>
            </ul>
          </div>
        ) : null}

        {step === "proof" ? (
          <div className="space-y-3">
            <p className="text-sm text-on-surface">
              <strong>{cell.cellId}</strong> requires scope proof before guest writes.
            </p>
            {proofTypes.length > 0 ? (
              <p className="font-meta text-xs text-on-surface-variant">
                Accepted: {proofTypes.map((p) => p.replace(/_/g, " ")).join(", ")}
              </p>
            ) : null}
            <textarea
              value={proofText}
              onChange={(e) => setProofText(e.target.value)}
              placeholder="Paste invite token, evidence URL, or notes about your scope claim…"
              className="input-line w-full min-h-[88px] text-sm px-3 py-2 focus:outline-none"
            />
            <label className="flex items-start gap-2 font-meta text-xs text-on-surface-variant">
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
          <p className="text-xs text-status-adopted">{error}</p>
        ) : null}

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-on-surface-variant hover:text-on-surface"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAdvance}
            disabled={step === "submitting"}
            className="btn-primary px-3 py-1.5 text-sm font-medium rounded-md disabled:opacity-60"
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
