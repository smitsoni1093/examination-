import api from "./axiosConfig";

export interface OtpAccountOption {
  userId: number;
  name: string;
  username: string;
  role: string;
  email: string;
  mobileNumber?: string | null;
  rollNumber?: string | null;
  className?: string | null;
  address?: string | null;
  pincode?: string | null;
}

export interface VerifyOtpResult {
  requiresAccountSelection: boolean;
  login?: {
    token: string;
    role: string;
    name: string;
    userId: number;
    adminId?: number | null;
  } | null;
  selectionToken?: string | null;
  accounts?: OtpAccountOption[] | null;
}

export const authApi = {
  login: (data: any) => api.post("/auth/login", data),
  lookupMobile: (mobileNumber: string) =>
    api.post<VerifyOtpResult>("/auth/lookup-mobile", { mobileNumber }),
  sendOtp: (mobileNumber: string) =>
    api.post("/auth/send-otp", { mobileNumber }),
  verifyOtp: (data: { mobileNumber: string; otp: string }) =>
    api.post<VerifyOtpResult>("/auth/verify-otp", data),
  completeOtpSelection: (data: { selectionToken: string; userId: number }) =>
    api.post("/auth/complete-otp-selection", data),
  validateInvite: (token: string) =>
    api.post("/auth/validate-invite", { token }),
  setPassword: (data: { token: string; password: string }) =>
    api.post("/auth/set-password", data),
};

export const adminApi = {
  getUsers: () => api.get("/admin/users"),
  downloadUsersExcel: (search?: string) =>
    api.get(`/admin/users/export?search=${encodeURIComponent(search || "")}`, {
      responseType: "blob",
    }),
  getUsersPaged: (page: number, pageSize: number, search?: string) =>
    api.get(
      `/admin/users/paged?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(search || "")}`,
    ),
  createUser: (data: any) => api.post("/admin/create-user", data),
  updateUser: (id: number, data: any) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id: number) => api.delete(`/admin/users/${id}`),
  importUsers: (formData: FormData) =>
    api.post("/admin/users/import", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  initializeUserImport: (formData: FormData) =>
    api.post("/admin/users/import/init", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  previewUserImport: (data: any) =>
    api.post("/admin/users/import/preview", data),
  confirmUserImport: (data: any) =>
    api.post("/admin/users/import/confirm", data),
  getClasses: () => api.get("/classes"),
  createClass: (data: { name: string }) => api.post("/classes", data),
  deleteClass: (classId: number) => api.delete(`/classes/${classId}`),
  getQuestions: (source?: string, search?: string) =>
    api.get(`/admin/questions?source=${source || ""}&search=${search || ""}`),
  getQuestionsPaged: (
    source?: string,
    search?: string,
    skip: number = 0,
    take: number = 20,
  ) =>
    api.get(
      `/admin/questions/paged?source=${source || ""}&search=${search || ""}&skip=${skip}&take=${take}`,
    ),
  getQuestionSources: () => api.get("/admin/question-sources"),
  getQuestionSourceFiles: () => api.get("/admin/question-source-files"),
  softDeleteQuestionSource: (sourceFileName: string) =>
    api.patch("/admin/question-sources/soft-delete", { sourceFileName }),
  createQuestion: (data: any) => api.post("/admin/create-question", data),
  createTest: (data: any) => api.post("/admin/create-test", data),
  getInstructions: () => api.get("/admin/instructions"),
  createInstruction: (data: { text: string; isActive?: boolean }) =>
    api.post("/admin/instructions", data),
  updateInstruction: (id: number, data: { text: string; isActive: boolean }) =>
    api.put(`/admin/instructions/${id}`, data),
  deleteInstruction: (id: number) => api.delete(`/admin/instructions/${id}`),
  getTests: () => api.get("/admin/tests"),
  updateTest: (testId: number, data: any) =>
    api.put(`/admin/tests/${testId}`, data),
  deleteTest: (testId: number) => api.delete(`/admin/tests/${testId}`),
  getTestQuestions: (testId: number) =>
    api.get(`/admin/test-questions/${testId}`),
  getTestQuestionsDetails: (testId: number) =>
    api.get(`/admin/test-questions-details/${testId}`),
  assignQuestions: (data: { testId: number; questionIds: number[] }) =>
    api.post("/admin/assign-questions-to-test", data),
  removeQuestionFromTest: (testId: number, questionId: number) =>
    api.delete(`/admin/test-questions/${testId}/${questionId}`),
  updateTestStatus: (testId: number, isActive: boolean) =>
    api.patch(`/admin/tests/${testId}/status`, { isActive }),
  initializeQuestionImport: (formData: FormData) =>
    api.post("/admin/questions/import/init", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  previewQuestionImport: (data: any) =>
    api.post("/admin/questions/import/preview", data),
  confirmQuestionImport: (data: any) =>
    api.post("/admin/questions/import/confirm", data),
  deleteQuestion: (id: number) => api.delete(`/admin/questions/${id}`),
  deleteBulkQuestions: (ids: number[]) =>
    api.post("/admin/questions/delete-bulk", ids),
  updateQuestion: (id: number, data: any) =>
    api.put(`/admin/questions/${id}`, data),
  getResults: () => api.get("/admin/results"),
  getAnswerReview: (userId: number, testId: number) =>
    api.get(`/admin/results/answers?userId=${userId}&testId=${testId}`),
  releaseResult: (userId: number, testId: number) =>
    api.post("/admin/results/release", { userId, testId }),
};

export const superAdminApi = {
  getAdmins: () => api.get("/superadmin/admins"),
  createAdmin: (data: any) => api.post("/superadmin/create-admin", data),
  setAdminActive: (adminUserId: number, isActive: boolean) =>
    api.patch(`/superadmin/admins/${adminUserId}/active`, { isActive }),
  getUsers: () => api.get("/superadmin/users"),
  getTests: () => api.get("/superadmin/tests"),
  getResults: () => api.get("/superadmin/results"),
};

export const userApi = {
  getProfile: () => api.get("/user/profile"),
  getAvailableTests: () => api.get("/user/available-tests"),
  getTest: (id: number) => api.get(`/user/test/${id}`),
  submitAnswer: (data: any) => api.post("/user/submit-answer", data),
  submitTest: (data: any) => api.post("/user/submit-test", data),
  getResult: (testId: number) => api.get(`/user/result?testId=${testId}`),

  // Attempt-based resume APIs
  startTestAttempt: (testId: number) => api.post(`/tests/${testId}/start`),
  getTestAttempt: (testId: number) => api.get(`/tests/${testId}/attempt`),
  saveAttemptAnswer: (attemptId: number, data: any) =>
    api.post(`/attempts/${attemptId}/answer`, data),
  submitAttempt: (attemptId: number) =>
    api.post(`/attempts/${attemptId}/submit`),
};
