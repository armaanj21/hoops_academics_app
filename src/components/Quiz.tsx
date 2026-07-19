import { useState } from "react";
import type { QuizQuestion } from "../types";
import type { QuizAnswer } from "../lib/progress";

interface Props {
  questions: QuizQuestion[];
  onChange: (answers: QuizAnswer[]) => void;
}

export default function Quiz({ questions, onChange }: Props) {
  const [answers, setAnswers] = useState<Record<string, number>>({});

  function selectAnswer(questionId: string, choiceIndex: number) {
    const next = { ...answers, [questionId]: choiceIndex };
    setAnswers(next);
    onChange(Object.entries(next).map(([id, answer_index]) => ({ id, answer_index })));
  }

  return (
    <div className="quiz">
      {questions.map((q, i) => (
        <fieldset key={q.id} className="quiz-question">
          <legend>
            {i + 1}. {q.question}
          </legend>
          {q.choices.map((choice, idx) => (
            <label key={idx} className="quiz-choice">
              <input
                type="radio"
                name={q.id}
                checked={answers[q.id] === idx}
                onChange={() => selectAnswer(q.id, idx)}
              />
              {choice}
            </label>
          ))}
        </fieldset>
      ))}
    </div>
  );
}
