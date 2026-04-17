"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export default function TeacherDashboard() {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [answerKeyText, setAnswerKeyText] = useState("");
  const [questionLoading, setQuestionLoading] = useState(false);
  const [questionMessage, setQuestionMessage] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [filterRoll, setFilterRoll] = useState("");

  function getToken() {
    return typeof window !== "undefined" ? localStorage.getItem("teacher_token") : null;
  }

  async function fetchResults(rollNo = "") {
    const token = getToken();
    if (!token) { router.push("/teacher/login"); return; }

    setLoading(true);
    setError("");
    try {
      const url = rollNo
        ? `${API_BASE}/results?roll_no=${encodeURIComponent(rollNo)}`
        : `${API_BASE}/results`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) { localStorage.removeItem("teacher_token"); router.push("/teacher/login"); return; }
      if (!res.ok) throw new Error(`Server error (${res.status})`);
      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      setError(err.message || "Could not fetch results.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchResults(); /* eslint-disable-next-line */ }, []);

  function handleSearch(e) { e.preventDefault(); fetchResults(filterRoll.trim()); }
  function handleClear() { setFilterRoll(""); fetchResults(); }
  function handleLogout() { localStorage.removeItem("teacher_token"); router.push("/teacher/login"); }
  async function handleAddQuestion(e) {
    e.preventDefault();
    setQuestionMessage("");

    const questionText = question.trim();
    const answerKey = answerKeyText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (!questionText) {
      setQuestionMessage("Question is required.");
      return;
    }
    if (answerKey.length === 0) {
      setQuestionMessage("Answer key must include at least one point.");
      return;
    }

    setQuestionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/add-question`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: questionText, answer_key: answerKey }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        throw new Error(d?.detail || `Server error (${res.status})`);
      }
      const data = await res.json();
      setQuestion("");
      setAnswerKeyText("");
      setQuestionMessage(`Question added successfully. ID: ${data.question_id}`);
    } catch (err) {
      setQuestionMessage(err.message || "Could not add question.");
    } finally {
      setQuestionLoading(false);
    }
  }

  function scoreColor(s, m) {
    const p = (s / m) * 100;
    if (p >= 85) return "text-emerald-400";
    if (p >= 65) return "text-sky-400";
    if (p >= 40) return "text-amber-400";
    return "text-red-400";
  }

  function scoreBadge(s, m) {
    const p = (s / m) * 100;
    if (p >= 85) return "bg-emerald-500/10 text-emerald-400";
    if (p >= 65) return "bg-sky-500/10 text-sky-400";
    if (p >= 40) return "bg-amber-500/10 text-amber-400";
    return "bg-red-500/10 text-red-400";
  }

  function fmtDate(d) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  }

  function truncate(t, n = 40) {
    if (!t) return "—";
    return t.length > n ? t.slice(0, n) + "…" : t;
  }

  const inp = "rounded-xl border border-input-border bg-input-bg px-3.5 py-2 text-sm text-foreground placeholder:text-muted/40 transition-all duration-150";

  return (
    <main className="flex-1 px-4 py-10 sm:py-14">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ═══ Header ═══ */}
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Teacher <span className="text-accent">Dashboard</span>
            </h1>
            <p className="text-muted text-sm">Review all student submissions, scores, and answer keys.</p>
          </div>
          <button onClick={handleLogout}
            className="self-start sm:self-auto text-xs font-medium text-muted hover:text-red-400 transition cursor-pointer border border-card-border rounded-lg px-3 py-1.5 hover:border-red-500/30">
            Log out
          </button>
        </header>

        <section className="bg-card rounded-2xl border border-card-border shadow-lg shadow-black/10 overflow-hidden">
          <div className="px-6 pt-5 pb-3 border-b border-card-border">
            <h2 className="text-xs font-semibold uppercase tracking-[.15em] text-label flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Add Question
            </h2>
          </div>
          <form onSubmit={handleAddQuestion} className="px-6 py-5 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="newQuestion" className="text-xs font-medium text-label">Question</label>
              <input
                id="newQuestion"
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Enter question"
                className={`${inp} w-full`}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="newAnswerKey" className="text-xs font-medium text-label">Answer Key (one point per line)</label>
              <textarea
                id="newAnswerKey"
                rows={4}
                value={answerKeyText}
                onChange={(e) => setAnswerKeyText(e.target.value)}
                placeholder={"Point 1\nPoint 2\nPoint 3"}
                className={`${inp} w-full resize-y`}
              />
            </div>
            {questionMessage && (
              <p className="text-sm text-muted">{questionMessage}</p>
            )}
            <button
              type="submit"
              disabled={questionLoading}
              className="px-4 py-2 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent-hover transition cursor-pointer disabled:opacity-50"
            >
              {questionLoading ? "Saving..." : "Add Question"}
            </button>
          </form>
        </section>

        {/* ═══ Filter ═══ */}
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative flex-1 max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input type="text" placeholder="Filter by roll number…" value={filterRoll}
              onChange={e => setFilterRoll(e.target.value)}
              className={`${inp} w-full pl-9`} />
          </div>
          <button type="submit"
            className="px-4 py-2 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent-hover transition cursor-pointer shadow-sm shadow-accent/15">
            Search
          </button>
          {filterRoll && (
            <button type="button" onClick={handleClear}
              className="px-3 py-2 rounded-xl text-xs text-muted hover:text-foreground border border-card-border hover:border-input-border transition cursor-pointer">
              Clear
            </button>
          )}
        </form>

        {/* ═══ Table Card ═══ */}
        <section className="bg-card rounded-2xl border border-card-border shadow-lg shadow-black/10 overflow-hidden">
          <div className="px-6 pt-5 pb-3 border-b border-card-border flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-[.15em] text-label flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Results
            </h2>
            {!loading && (
              <span className="text-[11px] text-muted font-medium tabular-nums">
                {results.length} {results.length === 1 ? "record" : "records"}
              </span>
            )}
          </div>

          {/* States */}
          {loading && (
            <div className="px-6 py-16 flex flex-col items-center gap-3 text-muted">
              <span className="spinner" style={{ width: 24, height: 24, borderWidth: 2.5 }} />
              <span className="text-sm">Loading results…</span>
            </div>
          )}

          {error && (
            <div className="px-6 py-8">
              <div className="animate-fade-in flex items-start gap-2.5 rounded-xl bg-red-500/8 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                <span className="shrink-0 mt-px">✕</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {!loading && !error && results.length === 0 && (
            <div className="px-6 py-16 text-center text-sm text-muted">
              {filterRoll ? `No results for "${filterRoll}".` : "No grading results yet."}
            </div>
          )}

          {/* Table */}
          {!loading && !error && results.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card z-10">
                  <tr className="border-b border-card-border text-left text-[11px] uppercase tracking-widest text-label">
                    <th className="px-6 py-3 font-semibold">Student</th>
                    <th className="px-4 py-3 font-semibold">Question</th>
                    <th className="px-4 py-3 font-semibold text-center">Score</th>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold text-center w-20">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => {
                    const id = r._id;
                    const isOpen = expandedId === id;
                    return (
                      <React.Fragment key={id}>
                        <tr className="group hover:bg-card-hover/50 transition-colors">
                          {/* Student (name + roll) */}
                          <td className="px-6 py-3.5 align-top border-b border-card-border/40">
                            <p className="text-gray-200 font-medium text-sm">{r.name || "—"}</p>
                            <p className="text-[11px] text-muted font-mono mt-0.5">{r.roll_no || "—"}</p>
                          </td>
                          {/* Question */}
                          <td className="px-4 py-3.5 align-top border-b border-card-border/40 max-w-[240px]">
                            <span className="text-gray-300">{truncate(r.question)}</span>
                          </td>
                          {/* Score */}
                          <td className="px-4 py-3.5 align-top border-b border-card-border/40 text-center">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold tabular-nums ${scoreBadge(r.score, r.marks)}`}>
                              {r.score} / {r.marks}
                            </span>
                          </td>
                          {/* Date */}
                          <td className="px-4 py-3.5 align-top border-b border-card-border/40 whitespace-nowrap text-muted text-[12px]">
                            {fmtDate(r.created_at)}
                          </td>
                          {/* Toggle */}
                          <td className="px-4 py-3.5 align-top border-b border-card-border/40 text-center">
                            <button onClick={() => setExpandedId(isOpen ? null : id)}
                              className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-hover transition cursor-pointer">
                              {isOpen ? "Hide" : "View"}
                              <svg className={`w-3 h-3 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                                fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                              </svg>
                            </button>
                          </td>
                        </tr>

                        {/* Expanded */}
                        {isOpen && (
                          <tr className="animate-fade-in">
                            <td colSpan={5} className="px-6 py-5 bg-input-bg border-b border-card-border/40">
                              <div className="grid gap-5 sm:grid-cols-2">
                                {/* Answer */}
                                <div className="space-y-2">
                                  <p className="text-[11px] font-semibold uppercase tracking-widest text-label">Student Answer</p>
                                  <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap bg-card rounded-lg border border-card-border/50 px-3.5 py-3">{r.answer || "—"}</p>
                                </div>
                                {/* Key */}
                                <div className="space-y-2">
                                  <p className="text-[11px] font-semibold uppercase tracking-widest text-label">Answer Key</p>
                                  <ol className="list-none space-y-1.5 text-sm text-gray-300">
                                    {(r.answer_key || []).map((pt, i) => (
                                      <li key={i} className="flex items-start gap-2.5 leading-relaxed">
                                        <span className="shrink-0 mt-0.5 flex h-5 w-5 items-center justify-center rounded-md bg-accent-subtle text-[11px] font-bold text-accent">{i + 1}</span>
                                        <span>{pt.charAt(0).toUpperCase() + pt.slice(1)}</span>
                                      </li>
                                    ))}
                                  </ol>
                                </div>
                                {/* Strengths */}
                                <div className="space-y-2">
                                  <p className="text-[11px] font-semibold uppercase tracking-widest text-label">
                                    Strengths {r.strengths?.length > 0 && <span className="font-normal text-muted ml-1">{r.strengths.length}</span>}
                                  </p>
                                  {r.strengths?.length > 0 ? (
                                    <ul className="space-y-1.5">
                                      {r.strengths.map((s, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                                          <span className="shrink-0 mt-0.5 text-emerald-400 text-[12px]">✓</span>
                                          <span>{s}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  ) : <p className="text-sm text-muted">None identified.</p>}
                                </div>
                                {/* Improvements */}
                                <div className="space-y-2">
                                  <p className="text-[11px] font-semibold uppercase tracking-widest text-label">
                                    Areas to Improve {r.improvements?.length > 0 && <span className="font-normal text-muted ml-1">{r.improvements.length}</span>}
                                  </p>
                                  {r.improvements?.length > 0 ? (
                                    <ul className="space-y-1.5">
                                      {r.improvements.map((s, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                                          <span className="shrink-0 mt-0.5 text-amber-400 text-[12px]">!</span>
                                          <span>{s}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  ) : <p className="text-sm text-muted">None identified.</p>}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
