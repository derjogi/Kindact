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

export default function SourcePanel({
  sources,
  label,
  onJumpToComment,
  idle,
  mobile,
}: SourcePanelProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!idle && sources.length > 0) {
      setVisible(true);
    } else {
      const timeout = setTimeout(() => setVisible(false), 200);
      return () => clearTimeout(timeout);
    }
  }, [idle, sources]);

  const directSources = sources.filter((s) => s.strength === "direct");
  const otherSources = sources.filter((s) => s.strength !== "direct");

  // Mobile bottom sheet
  if (mobile) {
    const isActive = !idle && sources.length > 0;
    return (
      <>
        {isActive && (
          <div className="fixed inset-0 bg-on-surface/20 z-40 transition-opacity duration-200" />
        )}
        <div
          className={`fixed bottom-0 left-0 right-0 z-50 bg-surface-container-lowest rounded-t-2xl elevation-floating transition-transform duration-300 ${
            isActive ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div className="flex justify-center py-2">
            <div className="w-10 h-1 bg-surface-container-highest rounded-full" />
          </div>
          {label && (
            <div className="px-4 pb-2">
              <h3 className="font-meta text-[10px] uppercase tracking-widest text-on-surface-variant">
                {label}
              </h3>
            </div>
          )}
          <div className="max-h-[40vh] overflow-y-auto px-4 pb-6 space-y-2">
            {directSources.map((s) => (
              <SourceCard
                key={s.commentId}
                source={s}
                onJump={onJumpToComment}
              />
            ))}
            {otherSources.length > 0 && (
              <>
                <p className="font-meta text-[10px] uppercase tracking-widest text-on-surface-variant mt-3">
                  See also
                </p>
                {otherSources.map((s) => (
                  <SourceCard
                    key={s.commentId}
                    source={s}
                    onJump={onJumpToComment}
                  />
                ))}
              </>
            )}
          </div>
        </div>
      </>
    );
  }

  // Desktop sticky focus panel
  return (
    <div className="sticky top-20">
      <div
        className={`bg-surface-container-low rounded-md overflow-hidden transition-all duration-200 ${
          idle || sources.length === 0 ? "p-4" : "p-0"
        }`}
      >
        {idle || sources.length === 0 ? (
          <div className="flex items-start gap-2 font-meta text-xs text-on-surface-variant">
            <span>💬</span>
            <span>
              Hover over the summary or a metric to see sources.
            </span>
          </div>
        ) : (
          <div
            className={`transition-opacity duration-200 ${
              visible ? "opacity-100" : "opacity-0"
            }`}
          >
            {label && (
              <div className="px-4 pt-3 pb-2">
                <h3 className="font-meta text-[10px] uppercase tracking-widest text-on-surface-variant">
                  {label}
                </h3>
              </div>
            )}
            <div className="max-h-[60vh] overflow-y-auto px-4 pb-3 space-y-2">
              {directSources.length > 0 && (
                <>
                  {directSources.map((s) => (
                    <SourceCard
                      key={s.commentId}
                      source={s}
                      onJump={onJumpToComment}
                    />
                  ))}
                </>
              )}
              {otherSources.length > 0 && (
                <>
                  <p className="font-meta text-[10px] uppercase tracking-widest text-on-surface-variant mt-2">
                    See also
                  </p>
                  {otherSources.map((s) => (
                    <SourceCard
                      key={s.commentId}
                      source={s}
                      onJump={onJumpToComment}
                    />
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

function SourceCard({
  source,
  onJump,
}: {
  source: Source;
  onJump: (id: string) => void;
}) {
  return (
    <div className="p-3 bg-surface-container-lowest rounded-md">
      <div className="flex items-center justify-between mb-1">
        <span className="font-meta text-xs font-medium text-on-surface-variant">
          {source.alias}
        </span>
        <button
          onClick={() => onJump(source.commentId)}
          className="font-meta text-xs text-tertiary hover:underline transition-colors"
        >
          ↓ jump
        </button>
      </div>
      <p className="text-on-surface text-xs leading-relaxed line-clamp-3">
        {source.text}
      </p>
    </div>
  );
}
