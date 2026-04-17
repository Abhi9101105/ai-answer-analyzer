"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export default function StudentPage() {
  const [name, setName] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [questionId, setQuestionId] = useState("");
  const [marks, setMarks] = useState("");
  const [answer, setAnswer] = useState("");
  const [questions, setQuestions] = useState([]);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [history, setHistory] = useState(null);
  const [histLoading, setHistLoading] = useState(false);
  const [histError, setHistError] = useState("");
  const [expandedHistId, setExpandedHistId] = useState(null);

  useEffect(() => {
    async function fetchQuestions() {
      try {
        const res = await fetch(`${API_BASE}/questions`);
        if (!res.ok) throw new Error(`Server error (${res.status})`);
        const data = await res.json();
        setQuestions(data.questions || []);
      } catch {
        setQuestions([]);
      }
    }
    fetchQuestions();
  }, []);

  /* ─── Submit ─── */
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setResult(null);

    if (!name.trim()) return setError("Name is required.");
    if (!rollNo.trim()) return setError("Roll number is required.");
    if (!questionId.trim()) return setError("Please select a question.");
    if (!marks || parseInt(marks) <= 0)
      return setError("Marks must be greater than 0.");
    if (!answer.trim()) return setError("Answer is required.");

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/grade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          roll_no: rollNo.trim(),
          question_id: questionId.trim(),
          marks: parseInt(marks),
          answer: answer.trim(),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        throw new Error(d?.detail || `Server error (${res.status})`);
      }
      setResult(await res.json());
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  /* ─── History ─── */
  async function fetchHistory() {
    if (!rollNo.trim()) return setHistError("Enter your roll number first.");
    setHistError("");
    setHistLoading(true);
    setHistory(null);
    setExpandedHistId(null);
    try {
      const res = await fetch(`${API_BASE}/student/${rollNo.trim()}`);
      if (!res.ok) throw new Error(`Server error (${res.status})`);
      const data = await res.json();
      setHistory(data.results || []);
    } catch (err) {
      setHistError(err.message || "Could not fetch history.");
    } finally {
      setHistLoading(false);
    }
  }

  /* ─── Helpers ─── */
  function getGrade(score, total) {
    const pct = (score / total) * 100;
    if (pct >= 85) return { label: "Excellent", color: "text-emerald-400", bar: "bg-emerald-500", bg: "bg-emerald-500/10" };
    if (pct >= 65) return { label: "Good", color: "text-sky-400", bar: "bg-sky-500", bg: "bg-sky-500/10" };
    if (pct >= 40) return { label: "Partial Credit", color: "text-amber-400", bar: "bg-amber-500", bg: "bg-amber-500/10" };
    return { label: "Needs Improvement", color: "text-red-400", bar: "bg-red-500", bg: "bg-red-500/10" };
  }

  function scoreColor(s, m) {
    const p = (s / m) * 100;
    if (p >= 85) return "text-emerald-400";
    if (p >= 65) return "text-sky-400";
    if (p >= 40) return "text-amber-400";
    return "text-red-400";
  }

  function fmtDate(d) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  }

  const inp =
    "w-full rounded-xl border border-input-border bg-input-bg px-4 py-2.5 text-sm text-foreground placeholder:text-muted/40 transition-all duration-150";

  return (
    <main className="flex-1 flex items-start justify-center px-4 py-10 sm:py-14">
      <div className="w-full max-w-xl space-y-7">

        {/* ═══ Header ═══ */}
        <header className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            <span className="text-accent">AI</span> Answer Grader
          </h1>
          <p className="text-muted text-sm max-w-sm mx-auto leading-relaxed">
            Submit your answer to receive an instant AI-powered evaluation with detailed feedback.
          </p>
        </header>

        {/* ═══ Form Card ═══ */}
        <section className="bg-card rounded-2xl border border-card-border shadow-lg shadow-black/10 overflow-hidden">
          <div className="px-6 pt-5 pb-3 border-b border-card-border">
            <h2 className="text-xs font-semibold uppercase tracking-[.15em] text-label flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Submit Answer
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
            {/* Name + Roll */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="name" className="text-xs font-medium text-label">Name</label>
                <input id="name" type="text" placeholder="Rahul Sharma"
                  value={name} onChange={e => setName(e.target.value)} className={inp} />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="rollNo" className="text-xs font-medium text-label">Roll Number</label>
                <input id="rollNo" type="text" placeholder="21CS042"
                  value={rollNo} onChange={e => setRollNo(e.target.value)} className={inp} />
              </div>
            </div>

            {/* Question */}
            <div className="space-y-1.5">
              <label htmlFor="question" className="text-xs font-medium text-label">Question</label>
              <select
                id="question"
                value={questionId}
                onChange={e => setQuestionId(e.target.value)}
                className={inp}
              >
                <option value="">Select a question</option>
                {questions.map((q) => (
                  <option key={q.question_id} value={q.question_id}>
                    {q.question}
                  </option>
                ))}
              </select>
            </div>

            {/* Marks */}
            <div className="space-y-1.5">
              <label htmlFor="marks" className="text-xs font-medium text-label">Total Marks</label>
              <input id="marks" type="number" min="1" placeholder="5"
                value={marks} onChange={e => setMarks(e.target.value)} className={`${inp} max-w-[120px]`} />
            </div>

            {/* Answer */}
            <div className="space-y-1.5">
              <label htmlFor="answer" className="text-xs font-medium text-label">Your Answer</label>
              <textarea id="answer" rows={5} placeholder="Type or paste your answer here…"
                value={answer} onChange={e => setAnswer(e.target.value)} className={`${inp} resize-y`} />
            </div>

            {/* Error */}
            {error && (
              <div className="animate-fade-in flex items-start gap-2.5 rounded-xl bg-red-500/8 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                <span className="shrink-0 mt-px">✕</span>
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading}
              className={`w-full rounded-xl px-4 py-3 text-sm font-semibold tracking-wide transition-all duration-200 cursor-pointer flex items-center justify-center gap-2
                ${loading
                  ? "bg-accent/30 text-indigo-300 animate-pulse-glow cursor-wait"
                  : "bg-accent text-white hover:bg-accent-hover hover:shadow-lg hover:shadow-accent-glow active:scale-[0.98]"
                }`}>
              {loading && <span className="spinner" />}
              {loading ? "Grading…" : "Grade Answer"}
            </button>
          </form>
        </section>

        {/* ═══ Result Card ═══ */}
        {result && (() => {
          const pct = (result.score / result.total) * 100;
          const g = getGrade(result.score, result.total);
          return (
            <section className="animate-slide-up bg-card rounded-2xl border border-card-border shadow-lg shadow-black/10 overflow-hidden">
              <div className="px-6 pt-5 pb-3 border-b border-card-border">
                <h2 className="text-xs font-semibold uppercase tracking-[.15em] text-label flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  Result
                </h2>
              </div>
              <div className="px-6 py-6 space-y-5">
                {/* Score */}
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-5xl font-extrabold tabular-nums tracking-tight">
                      {result.score}
                      <span className="text-muted text-2xl font-normal ml-1.5">/ {result.total}</span>
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${g.color} ${g.bg}`}>
                        {g.label}
                      </span>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-muted/60 tabular-nums">{pct.toFixed(0)}%</p>
                </div>

                {/* Bar */}
                <div className="h-2.5 rounded-full bg-card-border overflow-hidden">
                  <div className={`h-full rounded-full animate-fill-bar ${g.bar}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>

                {/* Feedback */}
                <div className="rounded-xl bg-accent-subtle border border-accent/15 px-4 py-3.5">
                  <p className="text-sm text-gray-200 leading-relaxed">{result.feedback}</p>
                </div>

                {/* Strengths */}
                {result.strengths?.length > 0 && (
                  <div className="space-y-2.5">
                    <h3 className="text-xs font-semibold uppercase tracking-[.15em] text-label">
                      Strengths <span className="ml-1 font-normal text-muted">{result.strengths.length}</span>
                    </h3>
                    <ul className="space-y-2">
                      {result.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-gray-300">
                          <span className="shrink-0 mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/12 text-[12px] text-emerald-400">✓</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Improvements */}
                {result.improvements?.length > 0 && (
                  <div className="space-y-2.5">
                    <h3 className="text-xs font-semibold uppercase tracking-[.15em] text-label">
                      Areas to Improve <span className="ml-1 font-normal text-muted">{result.improvements.length}</span>
                    </h3>
                    <ul className="space-y-2">
                      {result.improvements.map((s, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-gray-300">
                          <span className="shrink-0 mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/12 text-[12px] text-amber-400">!</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          );
        })()}

        {/* ═══ History Card ═══ */}
        <section className="bg-card rounded-2xl border border-card-border shadow-lg shadow-black/10 overflow-hidden">
          <div className="px-6 pt-5 pb-3 border-b border-card-border flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-[.15em] text-label flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              My History
            </h2>
            <button onClick={fetchHistory} disabled={histLoading}
              className="flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent-hover transition cursor-pointer disabled:opacity-50">
              {histLoading && <span className="spinner" />}
              {histLoading ? "Loading…" : "View History"}
            </button>
          </div>

          <div className="px-6 py-4 min-h-[60px]">
            {histError && (<p className="animate-fade-in text-sm text-red-400 mb-3">{histError}</p>)}

            {history !== null && history.length === 0 && (
              <p className="text-sm text-muted py-2">No submissions found for this roll number.</p>
            )}

            {history !== null && history.length > 0 && (
              <div className="space-y-2">
                {history.map((h, i) => {
                  const id = h._id || i;
                  const isOpen = expandedHistId === id;
                  return (
                    <div key={id} className="rounded-xl bg-input-bg border border-card-border/60 overflow-hidden transition-colors hover:border-card-border">
                      <button
                        onClick={() => setExpandedHistId(isOpen ? null : id)}
                        className="w-full flex items-center justify-between px-4 py-3 text-left cursor-pointer transition"
                      >
                        <div className="min-w-0 mr-3">
                          <p className="text-sm text-gray-200 truncate">{h.question}</p>
                          <p className="text-[11px] text-muted mt-0.5">{fmtDate(h.created_at)}</p>
                        </div>
                        <div className="flex items-center gap-2.5 shrink-0">
                          <p className={`text-sm font-bold tabular-nums ${scoreColor(h.score, h.marks)}`}>
                            {h.score}<span className="text-muted font-normal">/{h.marks}</span>
                          </p>
                          <svg className={`w-3.5 h-3.5 text-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                            fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                          </svg>
                        </div>
                      </button>

                      {isOpen && (
                        <div className="animate-expand px-4 pb-4 space-y-3 border-t border-card-border/40">
                          <div className="pt-3" />
                          {h.feedback && (
                            <div className="rounded-lg bg-accent-subtle border border-accent/15 px-3 py-2.5">
                              <p className="text-sm text-gray-200 leading-relaxed">{h.feedback}</p>
                            </div>
                          )}
                          {h.strengths?.length > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-[11px] font-semibold uppercase tracking-widest text-label">Strengths</p>
                              <ul className="space-y-1">
                                {h.strengths.map((s, j) => (
                                  <li key={j} className="flex items-start gap-2 text-sm text-gray-300">
                                    <span className="shrink-0 mt-0.5 text-emerald-400 text-[11px]">✓</span>
                                    <span>{s}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {h.improvements?.length > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-[11px] font-semibold uppercase tracking-widest text-label">To Improve</p>
                              <ul className="space-y-1">
                                {h.improvements.map((s, j) => (
                                  <li key={j} className="flex items-start gap-2 text-sm text-gray-300">
                                    <span className="shrink-0 mt-0.5 text-amber-400 text-[11px]">!</span>
                                    <span>{s}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {history === null && !histError && (
              <p className="text-sm text-muted py-2">Enter your roll number and click &quot;View History&quot; to see past submissions.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
