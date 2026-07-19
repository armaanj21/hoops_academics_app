import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import type { Profile, Lesson as LessonType, Progress } from "../types";
import { fetchLessons, fetchProgress, computeLessonStatus, submitLessonAttempt, type QuizAnswer } from "../lib/progress";
import DrillReport from "../components/DrillReport";
import Quiz from "../components/Quiz";

export default function Lesson({ profile }: { profile: Profile }) {
  const { lessonId } = useParams<{ lessonId: string }>();

  const [lessons, setLessons] = useState<LessonType[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [drillValue, setDrillValue] = useState<number | "">("");
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswer[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ drill_passed: boolean; quiz_score: number; quiz_passed: boolean; completed: boolean } | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [l, p] = await Promise.all([fetchLessons(), fetchProgress(profile.id)]);
        if (!cancelled) {
          setLessons(l);
          setProgress(p);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profile.id]);

  if (loading) return <p>Loading lesson...</p>;
  if (error) return <p className="error">{error}</p>;

  const lesson = lessons.find((l) => l.id === lessonId);
  if (!lesson) return <p>Lesson not found.</p>;

  const status = computeLessonStatus(lesson, lessons, progress);
  if (status === "locked") {
    return (
      <div className="lesson-page">
        <p>This lesson is locked. Complete the prior lesson first.</p>
        <Link to="/">Back to skill path</Link>
      </div>
    );
  }

  async function handleSubmit() {
    if (drillValue === "") return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await submitLessonAttempt(profile.id, lesson!.id, drillValue as number, quizAnswers);
      setResult(res);
      const p = await fetchProgress(profile.id);
      setProgress(p);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="lesson-page">
      <Link to="/">← Back to skill path</Link>
      <h1>{lesson.title}</h1>
      <p className="lesson-page__pairing">{lesson.concept_pairing}</p>

      <section>
        <h2>🏀 Basketball Drill</h2>
        <DrillReport
          instructions={lesson.drill_instructions}
          metricLabel={lesson.drill_metric_label}
          targetMetric={lesson.drill_target_metric}
          value={drillValue}
          onChange={setDrillValue}
        />
      </section>

      <section>
        <h2>📚 Academic Challenge</h2>
        <p>{lesson.academic_instructions}</p>
        <p>Pass threshold: {lesson.pass_threshold} / {lesson.quiz.length} correct</p>
        <Quiz questions={lesson.quiz} onChange={setQuizAnswers} />
      </section>

      <button onClick={handleSubmit} disabled={submitting || drillValue === "" || quizAnswers.length < lesson.quiz.length}>
        {submitting ? "Submitting..." : "Submit Lesson"}
      </button>

      {error && <p className="error">{error}</p>}

      {result && (
        <div className={`lesson-result ${result.completed ? "lesson-result--success" : "lesson-result--partial"}`}>
          <p>Drill: {result.drill_passed ? "✅ Target met" : "❌ Keep practicing"}</p>
          <p>
            Quiz: {result.quiz_score} / {lesson.quiz.length} — {result.quiz_passed ? "✅ Passed" : "❌ Try again"}
          </p>
          {result.completed ? (
            <p>🎉 Lesson complete! Next lesson unlocked.</p>
          ) : (
            <p>Complete both the drill target and quiz threshold to unlock the next lesson. You can retry anytime.</p>
          )}
        </div>
      )}
    </div>
  );
}
