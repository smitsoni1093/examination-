import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface Question {
  id: number;
  orderIndex: number;
  question_EN: string;
  option1_EN: string;
  option2_EN: string;
  option3_EN: string;
  option4_EN: string;
  question_HI: string;
  option1_HI: string;
  option2_HI: string;
  option3_HI: string;
  option4_HI: string;
  question_GU: string;
  option1_GU: string;
  option2_GU: string;
  option3_GU: string;
  option4_GU: string;
}

export type AnswerStatus = "answered" | "unanswered" | "skipped";

export interface SavedAnswerState {
  selectedOption?: number;
  status: AnswerStatus;
}

interface ExamState {
  testId: number | null;
  attemptId: number | null;
  testName: string | null;
  testImageUrl: string | null;
  duration: number; // minutes
  questions: Question[];
  savedAnswers: Record<number, SavedAnswerState>;
}

const createEmptyAnswer = (): SavedAnswerState => ({ status: "unanswered" });

const normalizeSavedAnswers = (
  savedAnswers: any,
): Record<number, SavedAnswerState> => {
  const normalized: Record<number, SavedAnswerState> = {};

  if (!savedAnswers || typeof savedAnswers !== "object") {
    return normalized;
  }

  Object.entries(savedAnswers).forEach(([questionId, value]) => {
    const numericQuestionId = Number(questionId);

    if (!numericQuestionId || numericQuestionId <= 0) return;

    if (typeof value === "number") {
      normalized[numericQuestionId] =
        value >= 1 && value <= 4
          ? { selectedOption: value, status: "answered" }
          : createEmptyAnswer();
      return;
    }

    if (value && typeof value === "object") {
      const answer = value as Partial<SavedAnswerState>;
      const selectedOption =
        typeof answer.selectedOption === "number" &&
        answer.selectedOption >= 1 &&
        answer.selectedOption <= 4
          ? answer.selectedOption
          : undefined;
      const status =
        answer.status === "answered" ||
        answer.status === "skipped" ||
        answer.status === "unanswered"
          ? answer.status
          : selectedOption
            ? "answered"
            : "unanswered";

      normalized[numericQuestionId] = {
        selectedOption,
        status,
      };
    }
  });

  return normalized;
};

const initialState: ExamState = {
  testId: null,
  attemptId: null,
  testName: null,
  testImageUrl: null,
  duration: 0,
  questions: [],
  savedAnswers: {},
};

const examSlice = createSlice({
  name: "exam",
  initialState,
  reducers: {
    setTest: (state, action: PayloadAction<any>) => {
      state.testId = action.payload.id;
      state.attemptId = action.payload.attemptId ?? null;
      state.testName = action.payload.name;
      state.testImageUrl = action.payload.testImageUrl ?? null;
      state.duration = action.payload.duration;
      state.questions = action.payload.questions;
      state.savedAnswers = normalizeSavedAnswers(action.payload.savedAnswers);
    },
    setAttemptId: (state, action: PayloadAction<number | null>) => {
      state.attemptId = action.payload;
    },
    saveAnswer: (
      state,
      action: PayloadAction<{ questionId: number; selectedOption: number }>,
    ) => {
      state.savedAnswers[action.payload.questionId] = {
        selectedOption: action.payload.selectedOption,
        status: "answered",
      };
    },
    clearAnswer: (state, action: PayloadAction<{ questionId: number }>) => {
      state.savedAnswers[action.payload.questionId] = createEmptyAnswer();
    },
    skipAnswer: (state, action: PayloadAction<{ questionId: number }>) => {
      state.savedAnswers[action.payload.questionId] = {
        status: "skipped",
      };
    },
    clearTest: () => initialState,
  },
});

export const {
  setTest,
  setAttemptId,
  saveAnswer,
  clearTest,
  clearAnswer,
  skipAnswer,
} = examSlice.actions;
export default examSlice.reducer;
