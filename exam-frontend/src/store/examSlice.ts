import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface Question {
  id: number;
  orderIndex: number;
  question_EN: string; option1_EN: string; option2_EN: string; option3_EN: string; option4_EN: string;
  question_HI: string; option1_HI: string; option2_HI: string; option3_HI: string; option4_HI: string;
  question_GU: string; option1_GU: string; option2_GU: string; option3_GU: string; option4_GU: string;
}

interface ExamState {
  testId: number | null;
  attemptId: number | null;
  testName: string | null;
  testImageUrl: string | null;
  duration: number; // minutes
  questions: Question[];
  savedAnswers: Record<number, number>; // questionId -> selectedOption
}

const initialState: ExamState = {
  testId: null,
  attemptId: null,
  testName: null,
  testImageUrl: null,
  duration: 0,
  questions: [],
  savedAnswers: {}
};

const examSlice = createSlice({
  name: 'exam',
  initialState,
  reducers: {
    setTest: (state, action: PayloadAction<any>) => {
      state.testId = action.payload.id;
      state.attemptId = action.payload.attemptId ?? null;
      state.testName = action.payload.name;
      state.testImageUrl = action.payload.testImageUrl ?? null;
      state.duration = action.payload.duration;
      state.questions = action.payload.questions;
      state.savedAnswers = action.payload.savedAnswers || {};
    },
    setAttemptId: (state, action: PayloadAction<number | null>) => {
      state.attemptId = action.payload;
    },
    saveAnswer: (state, action: PayloadAction<{questionId: number, selectedOption: number}>) => {
      state.savedAnswers[action.payload.questionId] = action.payload.selectedOption;
    },
    clearTest: () => initialState
  }
});

export const { setTest, setAttemptId, saveAnswer, clearTest } = examSlice.actions;
export default examSlice.reducer;
