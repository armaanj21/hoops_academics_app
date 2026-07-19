import { supabase } from "./supabaseClient";
import type { Lesson, Progress, LessonStatus, ActivityLogEntry, QuizQuestion } from "../types";

export async function fetchLessons(): Promise<Lesson[]> {
  const { data, error } = await supabase.from("lessons").select("*").order("position", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    ...row,
    quiz: row.quiz as QuizQuestion[],
  })) as Lesson[];
}

export async function fetchProgress(profileId: string): Promise<Progress[]> {
  const { data, error } = await supabase.rpc("get_profile_progress", { p_profile_id: profileId });
  if (error) throw new Error(error.message);
  return (data ?? []) as Progress[];
}

export async function fetchActivity(profileId: string): Promise<ActivityLogEntry[]> {
  const { data, error } = await supabase.rpc("get_profile_activity", { p_profile_id: profileId });
  if (error) throw new Error(error.message);
  return (data ?? []) as ActivityLogEntry[];
}

export interface QuizAnswer {
  id: string;
  answer_index: number;
}

export async function submitLessonAttempt(
  profileId: string,
  lessonId: string,
  drillValue: number,
  quizAnswers: QuizAnswer[]
) {
  const { data, error } = await supabase
    .rpc("submit_lesson_attempt", {
      p_profile_id: profileId,
      p_lesson_id: lessonId,
      p_drill_value: drillValue,
      p_quiz_answers: quizAnswers,
    })
    .single();
  if (error) throw new Error(error.message);
  return data as { drill_passed: boolean; quiz_score: number; quiz_passed: boolean; completed: boolean };
}

/**
 * A lesson unlocks once its prerequisite lesson is completed (both drill
 * target met AND quiz pass threshold met). The first lesson in the path
 * (no prerequisite) is always unlocked.
 */
export function computeLessonStatus(lesson: Lesson, lessons: Lesson[], progress: Progress[]): LessonStatus {
  const own = progress.find((p) => p.lesson_id === lesson.id);
  if (own?.completed) return "completed";

  if (!lesson.unlock_requirement_lesson_id) return "unlocked";

  const prereq = progress.find((p) => p.lesson_id === lesson.unlock_requirement_lesson_id);
  if (prereq?.completed) return "unlocked";

  return "locked";
}

export function computeAllStatuses(lessons: Lesson[], progress: Progress[]): Map<string, LessonStatus> {
  const map = new Map<string, LessonStatus>();
  for (const lesson of lessons) {
    map.set(lesson.id, computeLessonStatus(lesson, lessons, progress));
  }
  return map;
}
