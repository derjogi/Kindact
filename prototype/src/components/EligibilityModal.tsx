"use client";

import { useState } from "react";

interface Question {
  question: string;
  options: string[];
  correctIndex: number;
}

const quizzes: Record<string, Question[]> = {
  "2": [
    {
      question: "What is the main goal of this proposal?",
      options: [
        "Install solar panels on private homes",
        "Install solar panels on public buildings and share savings",
        "Build a new power plant",
      ],
      correctIndex: 1,
    },
    {
      question: "How will the energy savings be distributed?",
      options: [
        "Kept by the city government",
        "Sold to energy companies",
        "Distributed as credits to participating households",
      ],
      correctIndex: 2,
    },
  ],
  "7": [
    {
      question: "What problem does this proposal address?",
      options: [
        "Slow internet speeds for existing subscribers",
        "Lack of public Wi-Fi creating a digital divide",
        "Too many competing internet providers",
      ],
      correctIndex: 1,
    },
    {
      question: "Where would the Wi-Fi be available?",
      options: [
        "Inside government buildings only",
        "Town center and main parks",
        "Residential neighborhoods",
      ],
      correctIndex: 1,
    },
  ],
};

// Fallback quiz for issues without custom questions
const fallbackQuiz: Question[] = [
  {
    question: "Have you read the issue summary and key discussion points?",
    options: ["Yes, I understand what is being proposed", "No, not yet"],
    correctIndex: 0,
  },
];

export default function EligibilityModal({
  issueId,
  onPass,
  onClose,
}: {
  issueId: string;
  onPass: () => void;
  onClose: () => void;
}) {
  const questions = quizzes[issueId] || fallbackQuiz;
  const [answers, setAnswers] = useState<(number | null)[]>(
    new Array(questions.length).fill(null)
  );
  const [submitted, setSubmitted] = useState(false);
  const [passed, setPassed] = useState(false);

  const handleSubmit = () => {
    const correct = answers.every(
      (a, i) => a === questions[i].correctIndex
    );
    setSubmitted(true);
    setPassed(correct);
    if (correct) {
      setTimeout(onPass, 1200);
    }
  };

  const allAnswered = answers.every((a) => a !== null);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-surface-container-lowest rounded-md elevation-floating max-w-md w-full p-7 space-y-5">
        <div>
          <h2 className="font-display text-2xl font-bold text-on-surface">
            Before you vote
          </h2>
          <p className="font-sans text-sm text-on-surface-variant mt-1">
            Quick check to make sure you&apos;re familiar with this issue.
          </p>
        </div>

        {/* Stakeholder check */}
        <div className="flex items-center gap-2 font-meta text-sm bg-primary-container text-on-primary-container px-3 py-2 rounded-md">
          <span>✅</span>
          <span>Stakeholder check — auto-verified</span>
        </div>

        {/* Questions */}
        <div className="space-y-5">
          {questions.map((q, qi) => (
            <div key={qi}>
              <p className="text-sm font-medium text-on-surface mb-2">
                {qi + 1}. {q.question}
              </p>
              <div className="space-y-1.5">
                {q.options.map((opt, oi) => {
                  const selected = answers[qi] === oi;
                  const isCorrect = oi === q.correctIndex;
                  let optionStyle =
                    "bg-surface-container-low hover:bg-surface-container text-on-surface";
                  if (submitted && selected) {
                    optionStyle = isCorrect
                      ? "bg-primary-container text-on-primary-container"
                      : "bg-tertiary-container text-status-implementing";
                  } else if (selected) {
                    optionStyle = "bg-primary-container text-on-primary-container";
                  }

                  return (
                    <button
                      key={oi}
                      disabled={submitted}
                      onClick={() => {
                        const next = [...answers];
                        next[qi] = oi;
                        setAnswers(next);
                      }}
                      className={`w-full text-left px-3 py-2.5 text-sm rounded-md transition-colors ${optionStyle}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Result / actions */}
        {submitted ? (
          <div
            className={`font-meta text-sm text-center py-2 rounded-md ${
              passed
                ? "bg-primary-container text-on-primary-container"
                : "bg-tertiary-container text-status-implementing"
            }`}
          >
            {passed
              ? "✅ Passed! Redirecting to vote…"
              : "❌ Some answers were incorrect. Please review the issue summary and try again."}
          </div>
        ) : (
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 font-meta text-sm text-on-surface-variant hover:text-on-surface"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!allAnswered}
              className="btn-primary px-5 py-2 font-meta text-sm rounded-md"
            >
              Submit
            </button>
          </div>
        )}

        {submitted && !passed && (
          <button
            onClick={() => {
              setAnswers(new Array(questions.length).fill(null));
              setSubmitted(false);
              setPassed(false);
            }}
            className="w-full font-meta text-sm text-on-surface-variant hover:text-on-surface py-1"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
