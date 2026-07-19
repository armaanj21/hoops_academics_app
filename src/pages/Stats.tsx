import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Profile, Lesson, Progress, ActivityLogEntry } from "../types";
import { fetchLessons, fetchProgress, fetchActivity } from "../lib/progress";

export default function Stats({ profile }: { profile: Profile }) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [activity, setActivity] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [l, p, a] = await Promise.all([fetchLessons(), fetchProgress(profile.id), fetchActivity(profile.id)]);
        if (!cancelled) {
          setLessons(l);
          setProgress(p);
          setActivity(a);
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

  if (loading) return <p>Loading stats...</p>;
  if (error) return <p className="error">{error}</p>;

  const byLesson = new Map(lessons.map((l) => [l.id, l]));

  return (
    <div className="stats-page">
      <Link to="/">← Back to skill path</Link>
      <h1>{profile.display_name}'s Stats</h1>

      <section>
        <h2>Active Days</h2>
        <p>{activity.length} day(s) logged</p>
      </section>

      <section>
        <h2>Basketball Numbers</h2>
        <table>
          <thead>
            <tr>
              <th>Lesson</th>
              <th>Reported</th>
              <th>Target</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            {progress
              .filter((p) => p.drill_reported_value !== null)
              .map((p) => {
                const lesson = byLesson.get(p.lesson_id);
                return (
                  <tr key={p.id}>
                    <td>{lesson?.title ?? "—"}</td>
                    <td>{p.drill_reported_value}</td>
                    <td>{lesson?.drill_target_metric}</td>
                    <td>{p.drill_passed ? "✅" : "❌"}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Quiz Scores</h2>
        <table>
          <thead>
            <tr>
              <th>Lesson</th>
              <th>Score</th>
              <th>Threshold</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            {progress
              .filter((p) => p.quiz_score !== null)
              .map((p) => {
                const lesson = byLesson.get(p.lesson_id);
                return (
                  <tr key={p.id}>
                    <td>{lesson?.title ?? "—"}</td>
                    <td>
                      {p.quiz_score} / {lesson?.quiz.length ?? "—"}
                    </td>
                    <td>{lesson?.pass_threshold}</td>
                    <td>{p.quiz_passed ? "✅" : "❌"}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
