import api from './axiosConfig';

export const authApi = {
  login: (data: any) => api.post('/auth/login', data),
};

export const adminApi = {
  getUsers: () => api.get('/admin/users'),
  createUser: (data: any) => api.post('/admin/create-user', data),
  getQuestions: () => api.get('/admin/questions'),
  createQuestion: (data: any) => api.post('/admin/create-question', data),
  createTest: (data: any) => api.post('/admin/create-test', data),
  getTests: () => api.get('/admin/tests'),
  getTestQuestions: (testId: number) => api.get(`/admin/test-questions/${testId}`),
  assignQuestions: (data: any) => api.post('/admin/assign-questions-to-test', data),
  importQuestions: (formData: FormData) => api.post('/admin/questions/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getResults: () => api.get('/admin/results'),
};

export const userApi = {
  getAvailableTests: () => api.get('/user/available-tests'),
  getTest: (id: number) => api.get(`/user/test/${id}`),
  submitAnswer: (data: any) => api.post('/user/submit-answer', data),
  submitTest: (data: any) => api.post('/user/submit-test', data),
  getResult: (testId: number) => api.get(`/user/result?testId=${testId}`),
};
