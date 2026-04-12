import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Courses from './pages/Courses';
import CourseCreate from './pages/CourseCreate';
import CourseDetail from './pages/CourseDetail';
import Assessments from './pages/Assessments';
import AssessmentCreate from './pages/AssessmentCreate';
import AssessmentDetail from './pages/AssessmentDetail';
import ScoreEntry from './pages/ScoreEntry';
import Analytics from './pages/Analytics';
import AnalyticsEntry from './pages/AnalyticsEntry';
import AnalyticsDetail from './pages/AnalyticsDetail';
import Reports from './pages/Reports';
import ReportsGenerate from './pages/ReportsGenerate';
import ReportView from './pages/ReportView';
import Users from './pages/Users';
import UserDetail from './pages/UserDetail';
import StudentManagement from './pages/StudentManagement';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="profile" element={<Profile />} />
                <Route path="courses" element={<ProtectedRoute><Courses /></ProtectedRoute>} />
                <Route path="courses/create" element={<ProtectedRoute><CourseCreate /></ProtectedRoute>} />
                <Route path="courses/:id" element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} />
                <Route path="assessments" element={<ProtectedRoute><Assessments /></ProtectedRoute>} />
                <Route path="assessments/create" element={<ProtectedRoute><AssessmentCreate /></ProtectedRoute>} />
                <Route path="assessments/:id" element={<ProtectedRoute><AssessmentDetail /></ProtectedRoute>} />
                <Route path="assessments/:id/scores" element={<ProtectedRoute><ScoreEntry /></ProtectedRoute>} />
                <Route path="reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
                <Route path="reports/generate" element={<ProtectedRoute><ReportsGenerate /></ProtectedRoute>} />
                <Route path="reports/view/:id" element={<ProtectedRoute><ReportView /></ProtectedRoute>} />
                <Route path="analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                <Route path="analytics/entry" element={<ProtectedRoute><AnalyticsEntry /></ProtectedRoute>} />
                <Route path="analytics/view/:id" element={<ProtectedRoute><AnalyticsDetail /></ProtectedRoute>} />
                <Route path="students" element={
                  <ProtectedRoute>
                    <StudentManagement />
                  </ProtectedRoute>
                } />
                <Route path="users" element={
                  <ProtectedRoute requiredRole="admin">
                    <Users />
                  </ProtectedRoute>
                } />
                <Route path="users/:id" element={
                  <ProtectedRoute requiredRole="admin">
                    <UserDetail />
                  </ProtectedRoute>
                } />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#4ade80',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 5000,
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
