import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Profile, Lesson, Progress } from "../types";
import { fetchLessons, fetchProgress, computeAllStatuses } from "../lib/progress";
import LessonCard from "../components/LessonCard";

export default function SkillPath({ profile }: { profile: Profile }) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) return <p>Loading skill path...</p>;
  if (error) return <p className="error">{error}</p>;

  const statuses = computeAllStatuses(lessons, progress);
  const completedCount = lessons.filter((l) => statuses.get(l.id) === "completed").length;

  return (
    <div className="skill-path">
      <header>
        <h1>Hey, {profile.display_name} 👋</h1>
        <p>
          {completedCount} / {lessons.length} lessons complete
        </p>
        <Link to="/stats">View Stats</Link>
      </header>
      <div className="skill-path__list">
        {lessons.map((lesson) => (
          <LessonCard key={lesson.id} lesson={lesson} status={statuses.get(lesson.id) ?? "locked"} />
        ))}
      </div>
    </div>
  );
}
