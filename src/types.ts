export interface Profile {
  id: string;
  username: string;
  display_name: string;
}

export interface QuizQuestion {
  id: string;
  type: "mc";
  question: string;
  choices: string[];
}

export interface Lesson {
  id: string;
  title: string;
  concept_pairing: string;
  position: number;
  unlock_requirement_lesson_id: string | null;
  drill_instructions: string;
  drill_media_url: string | null;
  drill_target_metric: number;
  drill_metric_label: string;
  academic_instructions: string;
  quiz: QuizQuestion[];
  pass_threshold: number;
}

export interface Progress {
  id: string;
  profile_id: string;
  lesson_id: string;
  drill_reported_value: number | null;
  drill_passed: boolean;
  quiz_score: number | null;
  quiz_passed: boolean;
  completed: boolean;
  completed_at: string | null;
  updated_at: string;
}

export interface ActivityLogEntry {
  id: string;
  profile_id: string;
  activity_date: string;
}

export type LessonStatus = "locked" | "unlocked" | "completed";
