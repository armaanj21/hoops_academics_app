import { Link } from "react-router-dom";
import type { Lesson, LessonStatus } from "../types";

interface Props {
  lesson: Lesson;
  status: LessonStatus;
}

export default function LessonCard({ lesson, status }: Props) {
  const icon = status === "completed" ? "✅" : status === "unlocked" ? "🏀" : "🔒";

  const content = (
    <div className={`lesson-card lesson-card--${status}`}>
      <span className="lesson-card__icon">{icon}</span>
      <div>
        <h3>{lesson.title}</h3>
        <p>{lesson.concept_pairing}</p>
      </div>
    </div>
  );

  if (status === "locked") return content;
  return <Link to={`/lesson/${lesson.id}`}>{content}</Link>;
}
