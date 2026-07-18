-- Seed 3 lessons forming a linear unlock chain.
do $$
declare
  l1 uuid;
  l2 uuid;
  l3 uuid;
begin
  insert into lessons (title, concept_pairing, position, drill_instructions, drill_target_metric, drill_metric_label, academic_instructions, quiz, pass_threshold)
  values (
    'Free Throw Fractions',
    'Free throw % → Fractions',
    1,
    'Shoot 50 free throws. Count how many you make.',
    30,
    'free throws made out of 50',
    'A fraction compares a part to a whole, just like makes out of attempts. If you make 30 out of 50 shots, that''s the fraction 30/50, which simplifies to 3/5.',
    '[
      {"id": "q1", "type": "mc", "question": "If you make 25 out of 50 free throws, what fraction is that in simplest form?", "choices": ["1/2", "1/4", "2/3", "3/5"]},
      {"id": "q2", "type": "mc", "question": "Which fraction is larger: 3/5 or 1/2?", "choices": ["3/5", "1/2", "They are equal", "Cannot tell"]},
      {"id": "q3", "type": "mc", "question": "30/50 simplifies to:", "choices": ["3/5", "2/5", "3/10", "6/10"]},
      {"id": "q4", "type": "mc", "question": "What is the numerator in the fraction 30/50?", "choices": ["30", "50", "20", "80"]},
      {"id": "q5", "type": "mc", "question": "What is the denominator in the fraction 30/50?", "choices": ["30", "50", "20", "1"]}
    ]'::jsonb,
    4
  )
  returning id into l1;

  insert into lesson_quiz_answers (lesson_id, question_id, correct_index) values
    (l1, 'q1', 0),
    (l1, 'q2', 0),
    (l1, 'q3', 0),
    (l1, 'q4', 0),
    (l1, 'q5', 1);

  insert into lessons (title, concept_pairing, position, unlock_requirement_lesson_id, drill_instructions, drill_target_metric, drill_metric_label, academic_instructions, quiz, pass_threshold)
  values (
    'Shooting Percentage & Decimals',
    'Field goal % → Decimals & Percentages',
    2,
    l1,
    'Take 20 shots from your favorite spot on the court. Count how many you make.',
    12,
    'shots made out of 20',
    'A percentage is a fraction out of 100. To convert a fraction to a percent, divide the numerator by the denominator, then multiply by 100. Example: 12/20 = 0.6 = 60%.',
    '[
      {"id": "q1", "type": "mc", "question": "12/20 as a decimal is:", "choices": ["0.6", "0.12", "0.2", "1.2"]},
      {"id": "q2", "type": "mc", "question": "0.6 as a percentage is:", "choices": ["60%", "6%", "0.6%", "600%"]},
      {"id": "q3", "type": "mc", "question": "If you make 15 out of 20 shots, what percentage did you make?", "choices": ["75%", "60%", "80%", "15%"]},
      {"id": "q4", "type": "mc", "question": "Which is the same as 50%?", "choices": ["1/2", "1/4", "1/5", "2/3"]},
      {"id": "q5", "type": "mc", "question": "To convert a decimal to a percent, you:", "choices": ["Multiply by 100", "Divide by 100", "Add 100", "Subtract 100"]}
    ]'::jsonb,
    4
  )
  returning id into l2;

  insert into lesson_quiz_answers (lesson_id, question_id, correct_index) values
    (l2, 'q1', 0),
    (l2, 'q2', 0),
    (l2, 'q3', 0),
    (l2, 'q4', 0),
    (l2, 'q5', 0);

  insert into lessons (title, concept_pairing, position, unlock_requirement_lesson_id, drill_instructions, drill_target_metric, drill_metric_label, academic_instructions, quiz, pass_threshold)
  values (
    'Dribbling Reps & Ratios',
    'Dribble combo reps → Ratios',
    3,
    l2,
    'Do 40 total reps of a two-move dribble combo (e.g. crossover + hesitation). Count how many combos you complete cleanly (no fumbles).',
    25,
    'clean combo reps out of 40',
    'A ratio compares two quantities. If you complete 25 clean reps out of 40 total, the ratio of clean to total is 25:40, which simplifies to 5:8.',
    '[
      {"id": "q1", "type": "mc", "question": "25:40 simplifies to:", "choices": ["5:8", "1:2", "5:4", "25:4"]},
      {"id": "q2", "type": "mc", "question": "A ratio of 3:4 means for every 3 of one thing, there are how many of the other?", "choices": ["4", "3", "7", "1"]},
      {"id": "q3", "type": "mc", "question": "If the ratio of makes to misses is 5:3, and you missed 6 shots, how many did you make?", "choices": ["10", "8", "6", "15"]},
      {"id": "q4", "type": "mc", "question": "Which ratio is equivalent to 2:3?", "choices": ["4:6", "3:2", "6:8", "2:5"]},
      {"id": "q5", "type": "mc", "question": "A ratio compares:", "choices": ["Two quantities", "A single number", "Only percentages", "Only fractions less than 1"]}
    ]'::jsonb,
    4
  )
  returning id into l3;

  insert into lesson_quiz_answers (lesson_id, question_id, correct_index) values
    (l3, 'q1', 0),
    (l3, 'q2', 0),
    (l3, 'q3', 0),
    (l3, 'q4', 0),
    (l3, 'q5', 0);
end $$;
