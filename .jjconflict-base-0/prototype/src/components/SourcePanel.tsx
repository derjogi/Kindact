"use client";

import { useEffect, useState } from "react";

interface Source {
  commentId: string;
  alias: string;
  text: string;
  strength: string;
}

interface SourcePanelProps {
  sources: Source[];
  label: string;
  onJumpToComment: (id: string) => void;
  idle: boolean;
  mobile?: boolean;
}

export default function SourcePanel({ sources, label, onJumpToComment, idle, mobile }: SourcePanelProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!idle && sources.length > 0) {
      setVisible(true);
    } else {
      const timeout = setTimeout(() => setVisible(false), 200);
      return () => clearTimeout(timeout);
    }
  }, [idle, sources]);

  const directSources = sources.filter(s => s.strength === "direct");
  const otherSources = sources.filter(s => s.strength !== "direct");

  // Mobile bottom sheet
  if (mobile) {
    const isActive = !idle && sources.length > 0;
    return (
      <>
        {/* Backdrop */}
        {isActive && (
          <div
            className="fixed inset-0 bg-black/20 z-40 transition-opacity duration-200"
            onClick={() => {/* parent handles clearing */}}
          />
        )}
        {/* Bottom sheet */}
        <div
          className={`fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl border-t border-stone-200 transition-transform duration-300 ${
            isActive ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div className="flex justify-center py-2">
            <div className="w-10 h-1 bg-stone-300 rounded-full" />
          </div>
          {label && (
            <div className="px-4 pb-2">
              <h3 className="text-xs font-medium text-stone-500 uppercase tracking-wide">
                {label}
              </h3>
            </div>
          )}
          <div className="max-h-[40vh] overflow-y-auto px-4 pb-4 space-y-2">
            {directSources.map((s) => (
              <SourceCard key={s.commentId} source={s} onJump={onJumpToComment} />
            ))}
            {otherSources.length > 0 && (
              <>
                <p className="text-xs text-stone-400 mt-2">See also</p>
                {otherSources.map((s) => (
                  <SourceCard key={s.commentId} source={s} onJump={onJumpToComment} />
                ))}
              </>
            )}
          </div>
        </div>
      </>
    );
  }

  // Desktop sticky panel
  return (
    <div className="sticky top-4">
      <div
        className={`bg-white rounded-lg border border-stone-200 overflow-hidden transition-all duration-200 ${
          idle || sources.length === 0 ? "p-4" : "p-0"
        }`}
      >
        {idle || sources.length === 0 ? (
          <div className="flex items-center gap-2 text-stone-400 text-sm">
            <span>💬</span>
            <span>Hover over the summary or a metric to see sources</span>
          </div>
        ) : (
          <div
            className={`transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0"}`}
          >
            {label && (
              <div className="px-4 pt-3 pb-2">
                <h3 className="text-xs font-medium text-stone-500 uppercase tracking-wide">
                  {label}
                </h3>
              </div>
            )}
            <div className="max-h-[60vh] overflow-y-auto px-4 pb-3 space-y-2">
              {directSources.length > 0 && (
                <>
                  {directSources.map((s) => (
                    <SourceCard key={s.commentId} source={s} onJump={onJumpToComment} />
                  ))}
                </>
              )}
              {otherSources.length > 0 && (
                <>
                  <p className="text-xs text-stone-400 mt-2">See also</p>
                  {otherSources.map((s) => (
                    <SourceCard key={s.commentId} source={s} onJump={onJumpToComment} />
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SourceCard({ source, onJump }: { source: Source; onJump: (id: string) => void }) {
  return (
    <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-100 text-sm">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-stone-500">{source.alias}</span>
        <button
          onClick={() => onJump(source.commentId)}
          className="text-xs text-violet-600 hover:text-violet-800 transition-colors"
        >
          ↓ jump
        </button>
      </div>
      <p className="text-stone-600 text-xs leading-relaxed line-clamp-3">{source.text}</p>
    </div>
  );
}
