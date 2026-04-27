import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';
import Navbar from '../components/Navbar';

// Admin
import AdminLogin from '../pages/admin/AdminLogin';
import Dashboard from '../pages/admin/Dashboard';
import CreateUser from '../pages/admin/CreateUser';
import CreateQuestion from '../pages/admin/CreateQuestion';
import CreateTest from '../pages/admin/CreateTest';
import ManageClasses from '../pages/admin/ManageClasses';
import TestList from '../pages/admin/TestList';
import ManageTestQuestions from '../pages/admin/ManageTestQuestions';
import ViewResults from '../pages/admin/ViewResults';
import AnswerReview from '../pages/admin/AnswerReview';
import ImportQuestions from '../pages/admin/ImportQuestions';
import QuestionBank from '../pages/admin/QuestionBank';
import TestBuilder from '../pages/admin/TestBuilder';
import ManageInstructions from '../pages/admin/ManageInstructions';

// SuperAdmin
import SuperAdminDashboard from '../pages/superadmin/SuperAdminDashboard';
import ManageAdmins from '../pages/superadmin/ManageAdmins.tsx';
import SystemOverview from '../pages/superadmin/SystemOverview.tsx';

// User
import UserLogin from '../pages/user/UserLogin';
import UserDashboard from '../pages/user/UserDashboard';
import UserProfile from '../pages/user/UserProfile';
import Instructions from '../pages/user/Instructions';
import TestPage from '../pages/user/TestPage';
import ResultPage from '../pages/user/ResultPage';
import SetPassword from '../pages/auth/SetPassword';

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        <Route element={<PublicRoute />}>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/login" element={<UserLogin />} />
          <Route path="/set-password" element={<SetPassword />} />
        </Route>

        {/* SuperAdmin Protected Routes */}
        <Route path="/superadmin" element={<ProtectedRoute allowedRole="SuperAdmin" />}>
          <Route index element={<SuperAdminDashboard />} />
          <Route path="admins" element={<ManageAdmins />} />
          <Route path="system" element={<SystemOverview />} />
        </Route>

        {/* Admin Protected Routes */}
        <Route path="/admin" element={<ProtectedRoute allowedRole="Admin" />}>
          <Route index element={<Dashboard />} />
          <Route path="classes" element={<ManageClasses />} />
          <Route path="create-user" element={<CreateUser />} />
          <Route path="create-question" element={<CreateQuestion />} />
          <Route path="create-test" element={<CreateTest />} />
          <Route path="tests" element={<TestList />} />
          <Route path="manage-questions/:testId" element={<ManageTestQuestions />} />
          <Route path="results" element={<ViewResults />} />
          <Route path="results/:userId/:testId/answers" element={<AnswerReview />} />
          <Route path="import-questions" element={<ImportQuestions />} />
          <Route path="question-bank" element={<QuestionBank />} />
          <Route path="instructions" element={<ManageInstructions />} />
          <Route path="test-builder" element={<TestBuilder />} />
          <Route path="test-builder/:testId" element={<TestBuilder />} />
        </Route>

        {/* User Protected Routes */}
        <Route path="/user" element={<ProtectedRoute allowedRole="User" />}>
          <Route index element={<UserDashboard />} />
          <Route path="profile" element={<UserProfile />} />
          <Route path="instructions/:testId" element={<Instructions />} />
          <Route path="test/:testId" element={<TestPage />} />
          <Route path="result/:testId" element={<ResultPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
