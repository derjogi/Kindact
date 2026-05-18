"use client";

import { useState, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { postComment } from "@/lib/api";

interface QuoteComment {
  id: string;
  alias: string;
  text: string;
  quotedText: string;
  quoteStart: number;
  quoteEnd: number;
}

interface CollapsibleDescriptionProps {
  description: string;
  issueId: string;
  quoteComments: QuoteComment[];
  onHighlightSources: (
    sources: { commentId: string; alias: string; text: string; strength: string }[],
    label: string,
  ) => void;
  onClearSources: () => void;
  onCommentAdded?: () => void;
}

export default function CollapsibleDescription({
  description,
  issueId,
  quoteComments,
  onHighlightSources,
  onClearSources,
  onCommentAdded,
}: CollapsibleDescriptionProps) {
  const [expanded, setExpanded] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [selectionPos, setSelectionPos] = useState<{ top: number; left: number } | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [quoteInput, setQuoteInput] = useState("");
  const [quoteStart, setQuoteStart] = useState(0);
  const [quoteEnd, setQuoteEnd] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !contentRef.current) {
      setSelectedText("");
      setSelectionPos(null);
      return;
    }

    const text = selection.toString().trim();
    if (!text) return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const containerRect = contentRef.current.getBoundingClientRect();

    const start = description.indexOf(text);
    const end = start >= 0 ? start + text.length : 0;

    setSelectedText(text);
    setQuoteStart(start);
    setQuoteEnd(end);
    setSelectionPos({
      top: rect.bottom - containerRect.top + 4,
      left: rect.left - containerRect.left,
    });
  }, [description]);

  const handleStartQuote = () => {
    setQuoting(true);
    setSelectionPos(null);
  };

  const handleSubmitQuote = async () => {
    if (!quoteInput.trim()) return;
    try {
      await postComment(issueId, `> ${selectedText}\n\n${quoteInput}`);
      setQuoting(false);
      setQuoteInput("");
      setSelectedText("");
      onCommentAdded?.();
    } catch {
      // silently handle error
    }
  };

  const handleCancelQuote = () => {
    setQuoting(false);
    setQuoteInput("");
    setSelectedText("");
  };

  const handlePassageHover = (qc: QuoteComment) => {
    onHighlightSources(
      [{ commentId: qc.id, alias: qc.alias, text: qc.text, strength: "strong" }],
      qc.quotedText,
    );
  };

  // Build highlighted description segments based on quoteComments
  const renderHighlightedContent = () => {
    if (quoteComments.length === 0) {
      return (
        <div onMouseEnter={onClearSources}>
          <ReactMarkdown>{description}</ReactMarkdown>
        </div>
      );
    }

    // Sort quote ranges by start position
    const sorted = [...quoteComments].sort((a, b) => a.quoteStart - b.quoteStart);
    const segments: React.ReactNode[] = [];
    let cursor = 0;

    for (const qc of sorted) {
      if (qc.quoteStart < 0 || qc.quoteStart >= description.length) continue;
      if (qc.quoteStart > cursor) {
        segments.push(
          <span key={`text-${cursor}`} onMouseEnter={onClearSources}>
            {description.slice(cursor, qc.quoteStart)}
          </span>,
        );
      }
      segments.push(
        <span
          key={`quote-${qc.id}`}
          className="bg-primary-container/60 hover:bg-primary-container transition-colors cursor-pointer rounded-sm"
          onMouseEnter={() => handlePassageHover(qc)}
          onMouseLeave={onClearSources}
        >
          {description.slice(qc.quoteStart, qc.quoteEnd)}
        </span>,
      );
      cursor = qc.quoteEnd;
    }

    if (cursor < description.length) {
      segments.push(
        <span key={`text-${cursor}`} onMouseEnter={onClearSources}>
          {description.slice(cursor)}
        </span>,
      );
    }

    return <div className="whitespace-pre-wrap">{segments}</div>;
  };

  return (
    <div className="bg-surface-container-lowest rounded-md overflow-hidden card-lift">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-3 text-sm font-meta uppercase tracking-widest text-on-surface-variant hover:bg-surface-container-low transition-colors"
      >
        <span>Description</span>
        <span className="text-on-surface-variant">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="px-5 pb-5 relative" ref={contentRef} onMouseUp={handleMouseUp}>
          <div className="prose prose-sm max-w-none text-on-surface">
            {renderHighlightedContent()}
          </div>

          {/* Selection popup */}
          {selectionPos && selectedText && !quoting && (
            <button
              className="btn-primary absolute z-20 px-3 py-1.5 text-xs rounded-md elevation-floating transition-colors"
              style={{ top: selectionPos.top, left: selectionPos.left }}
              onClick={handleStartQuote}
            >
              💬 Comment on this
            </button>
          )}

          {/* Quote comment input */}
          {quoting && (
            <div className="mt-3 rounded-md p-3 bg-surface-container-low">
              <div className="text-xs text-on-surface-variant mb-2 flex items-start gap-2">
                <span className="text-on-surface-variant">❝</span>
                <span className="italic line-clamp-2">{selectedText}</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={quoteInput}
                  onChange={(e) => setQuoteInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmitQuote()}
                  placeholder="Your comment on this passage…"
                  className="input-line flex-1 px-3 py-1.5 text-sm focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={handleSubmitQuote}
                  className="btn-primary px-3 py-1.5 text-sm rounded-md"
                >
                  Post
                </button>
                <button
                  onClick={handleCancelQuote}
                  className="px-3 py-1.5 text-sm text-on-surface-variant hover:text-primary-dim"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
