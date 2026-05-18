"use client";

interface Props {
  open: boolean;
  actionLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * 028 / holochain-047: confirm before sensitive operations that the signature
 * comes from the wallet (EVM key), not the Holochain agent key.
 */
export default function WalletKeySigningModal({
  open,
  actionLabel,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-on-surface/40 backdrop-blur-[2px] p-4"
      onClick={onCancel}
    >
      <div
        className="bg-surface-container-lowest rounded-md elevation-floating w-full max-w-md p-6 space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-base font-semibold text-on-surface">
          Confirm signing key
        </h2>
        <p className="text-sm text-on-surface">
          You&apos;re about to perform: <strong>{actionLabel}</strong>.
        </p>
        <p className="text-sm text-on-surface-variant">
          This action signs with your <strong>wallet</strong> (not your Holochain
          agent key). Switching conductor modes will not affect this signature.
        </p>
        <ul className="font-meta text-xs text-on-surface-variant list-disc pl-5 space-y-1">
          <li>Wallet key: <code className="font-mono">0xdev…0000</code></li>
          <li>Agent key (Holochain): unchanged</li>
        </ul>
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-sm text-on-surface-variant hover:text-on-surface"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="btn-primary px-3 py-1.5 text-sm font-medium rounded-md"
          >
            Sign with wallet
          </button>
        </div>
      </div>
    </div>
  );
}
