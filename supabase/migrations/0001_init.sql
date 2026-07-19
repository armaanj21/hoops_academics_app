-- Hoops & Academics v1 schema
create extension if not exists pgcrypto;

-- ============ profiles ============
create table profiles (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  pin_hash text not null,
  display_name text not null,
  created_at timestamptz not null default now()
);

-- ============ lessons ============
create table lessons (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  concept_pairing text not null,
  position int not null,
  unlock_requirement_lesson_id uuid references lessons(id),

  -- basketball drill block
  drill_instructions text not null,
  drill_media_url text,
  drill_target_metric int not null,
  drill_metric_label text not null, -- e.g. "free throws made out of 50"

  -- academic challenge block
  academic_instructions text not null,
  quiz jsonb not null, -- array of {id, question, choices[], type} -- NO correct answers here, this is public
  pass_threshold int not null, -- number of correct answers required

  created_at timestamptz not null default now()
);

create unique index lessons_position_idx on lessons(position);

-- Correct answers live in a separate table with NO anon-facing policy or
-- grant, so they can only be read by SECURITY DEFINER functions (grading),
-- never fetched directly by the client alongside the public quiz content.
create table lesson_quiz_answers (
  lesson_id uuid not null references lessons(id) on delete cascade,
  question_id text not null,
  correct_index int not null,
  primary key (lesson_id, question_id)
);
alter table lesson_quiz_answers enable row level security;

-- ============ progress ============
create table progress (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  lesson_id uuid not null references lessons(id) on delete cascade,
  drill_reported_value int,
  drill_passed boolean not null default false,
  quiz_score int,
  quiz_passed boolean not null default false,
  completed boolean not null default false,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (profile_id, lesson_id)
);

-- ============ activity log (streaks) ============
create table activity_log (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  activity_date date not null default current_date,
  unique (profile_id, activity_date)
);

alter table profiles enable row level security;
alter table lessons enable row level security;
alter table progress enable row level security;
alter table activity_log enable row level security;

-- Lessons are public read (content, not secrets).
create policy lessons_read_all on lessons for select using (true);

-- profiles/progress/activity_log are only ever touched via SECURITY DEFINER
-- RPC functions below, so no direct table policies are granted to anon.

-- ============ auth RPCs ============
-- PIN must be a 4-6 digit string; hashed with pgcrypto's blowfish (bf).

create or replace function signup_profile(p_username text, p_pin text, p_display_name text)
returns table (id uuid, username text, display_name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  if p_pin !~ '^[0-9]{4,6}$' then
    raise exception 'PIN must be 4-6 digits';
  end if;
  if length(trim(p_username)) < 3 then
    raise exception 'Username must be at least 3 characters';
  end if;

  insert into profiles (username, pin_hash, display_name)
  values (lower(trim(p_username)), crypt(p_pin, gen_salt('bf')), trim(p_display_name))
  returning profiles.id into new_id;

  return query select profiles.id, profiles.username, profiles.display_name
    from profiles where profiles.id = new_id;
end;
$$;

create or replace function login_profile(p_username text, p_pin text)
returns table (id uuid, username text, display_name text)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    select profiles.id, profiles.username, profiles.display_name
    from profiles
    where profiles.username = lower(trim(p_username))
      and profiles.pin_hash = crypt(p_pin, profiles.pin_hash);

  if not found then
    raise exception 'Invalid username or PIN';
  end if;
end;
$$;

-- Only expose the RPCs to anon/authenticated, not direct table access.
grant execute on function signup_profile(text, text, text) to anon;
grant execute on function login_profile(text, text) to anon;

-- ============ progress RPCs ============
-- Submits a lesson attempt: basketball self-report + quiz answers.
-- Grades the quiz server-side against stored correct answers, checks the
-- drill target, marks completion, and unlocks are derived by the client
-- from the `completed` flags (see unlock_requirement_lesson_id).

create or replace function submit_lesson_attempt(
  p_profile_id uuid,
  p_lesson_id uuid,
  p_drill_value int,
  p_quiz_answers jsonb -- array of {id, answer_index}
)
returns table (
  drill_passed boolean,
  quiz_score int,
  quiz_passed boolean,
  completed boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target int;
  v_threshold int;
  v_correct int := 0;
  ans record;
  a jsonb;
  v_drill_passed boolean;
  v_quiz_passed boolean;
  v_completed boolean;
begin
  select drill_target_metric, pass_threshold
    into v_target, v_threshold
    from lessons where lessons.id = p_lesson_id;

  if not found then
    raise exception 'Lesson not found';
  end if;

  v_drill_passed := p_drill_value >= v_target;

  for ans in select question_id, correct_index from lesson_quiz_answers where lesson_id = p_lesson_id
  loop
    select value into a from jsonb_array_elements(p_quiz_answers) as value
      where (value->>'id') = ans.question_id
      limit 1;
    if a is not null and (a->>'answer_index')::int = ans.correct_index then
      v_correct := v_correct + 1;
    end if;
  end loop;

  v_quiz_passed := v_correct >= v_threshold;
  v_completed := v_drill_passed and v_quiz_passed;

  insert into progress (profile_id, lesson_id, drill_reported_value, drill_passed, quiz_score, quiz_passed, completed, completed_at, updated_at)
  values (p_profile_id, p_lesson_id, p_drill_value, v_drill_passed, v_correct, v_quiz_passed, v_completed, case when v_completed then now() else null end, now())
  on conflict (profile_id, lesson_id) do update set
    drill_reported_value = excluded.drill_reported_value,
    drill_passed = excluded.drill_passed,
    quiz_score = excluded.quiz_score,
    quiz_passed = excluded.quiz_passed,
    completed = progress.completed or excluded.completed,
    completed_at = coalesce(progress.completed_at, excluded.completed_at),
    updated_at = now();

  insert into activity_log (profile_id, activity_date)
  values (p_profile_id, current_date)
  on conflict (profile_id, activity_date) do nothing;

  return query select v_drill_passed, v_correct, v_quiz_passed, v_completed;
end;
$$;

grant execute on function submit_lesson_attempt(uuid, uuid, int, jsonb) to anon;

-- Read-only helper so the client can fetch a profile's progress without
-- direct table grants (RLS blocks anon from `progress` otherwise).
create or replace function get_profile_progress(p_profile_id uuid)
returns setof progress
language sql
security definer
set search_path = public
as $$
  select * from progress where profile_id = p_profile_id;
$$;

grant execute on function get_profile_progress(uuid) to anon;

create or replace function get_profile_activity(p_profile_id uuid)
returns setof activity_log
language sql
security definer
set search_path = public
as $$
  select * from activity_log where profile_id = p_profile_id order by activity_date;
$$;

grant execute on function get_profile_activity(uuid) to anon;
