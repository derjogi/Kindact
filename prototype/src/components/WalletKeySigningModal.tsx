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
      className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-900/50 p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold text-stone-900">Confirm signing key</h2>
        <p className="text-sm text-stone-700">
          You&apos;re about to perform: <strong>{actionLabel}</strong>.
        </p>
        <p className="text-sm text-stone-600">
          This action signs with your <strong>wallet</strong> (not your Holochain
          agent key). Switching conductor modes will not affect this signature.
        </p>
        <ul className="text-xs text-stone-500 list-disc pl-5 space-y-1">
          <li>Wallet key: <code>0xdev…0000</code></li>
          <li>Agent key (Holochain): unchanged</li>
        </ul>
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-sm text-stone-600 hover:text-stone-900"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-3 py-1.5 text-sm font-medium rounded bg-stone-800 hover:bg-stone-900 text-white"
          >
            Sign with wallet
          </button>
        </div>
      </div>
    </div>
  );
}
