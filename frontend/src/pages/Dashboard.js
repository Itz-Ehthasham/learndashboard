import React from 'react';
import { useQuery } from 'react-query';
import { useAuth } from '../context/AuthContext';
import { analyticsService } from '../services/api';
import {
  ChartBarIcon,
  BookOpenIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  AcademicCapIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const safeFixed = (val, digits = 1) => {
  const n = Number(val);
  return Number.isFinite(n) ? n.toFixed(digits) : 'N/A';
};

const Dashboard = () => {
  const { user, isAdmin, isTrainer, isStudent } = useAuth();

  const { data: dashboardData, isLoading, error } = useQuery(
    'dashboardAnalytics',
    analyticsService.getDashboardAnalytics,
    {
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  );

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner h-8 w-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading dashboard</h3>
        <p className="text-gray-600">Please try refreshing the page.</p>
      </div>
    );
  }

  const analytics = dashboardData?.data?.data?.analytics ?? dashboardData?.data?.analytics ?? {};

  // Sample data for charts (replace with real data)
  const performanceData = [
    { name: 'Week 1', score: 75, attendance: 90 },
    { name: 'Week 2', score: 82, attendance: 85 },
    { name: 'Week 3', score: 78, attendance: 92 },
    { name: 'Week 4', score: 88, attendance: 88 },
    { name: 'Week 5', score: 85, attendance: 95 },
    { name: 'Week 6', score: 92, attendance: 90 },
  ];

  const courseDistribution = [
    { name: 'Computer Science', value: 35, color: '#3b82f6' },
    { name: 'Mathematics', value: 25, color: '#10b981' },
    { name: 'Science', value: 20, color: '#f59e0b' },
    { name: 'Engineering', value: 20, color: '#ef4444' },
  ];

  const renderStudentDashboard = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stats-card">
          <div className="stats-card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <AcademicCapIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Average Score</dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {(() => {
                      const s = safeFixed(analytics.overallAverage, 1);
                      return s === 'N/A' ? 'N/A' : `${s}%`;
                    })()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <BookOpenIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Enrolled Courses</dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {analytics.enrolledCourses || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                <ClipboardDocumentListIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Assessments</dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {analytics.totalAssessments || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                <ArrowTrendingUpIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Progress</dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {analytics.progress || '75%'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="chart-container">
          <h3 className="chart-title">Performance Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} />
              <Line type="monotone" dataKey="attendance" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3 className="chart-title">Course Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={courseDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name || ''} ${percent != null && Number.isFinite(percent) ? (percent * 100).toFixed(0) : 0}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {courseDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        </div>
        <div className="card-body">
          <div className="space-y-4">
            <div className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Completed Assessment: JavaScript Basics</p>
                <p className="text-xs text-gray-500">Score: 85% - 2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center">
              <BookOpenIcon className="h-5 w-5 text-blue-500 mr-3" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Enrolled in: Advanced React Development</p>
                <p className="text-xs text-gray-500">Yesterday</p>
              </div>
            </div>
            <div className="flex items-center">
              <ClockIcon className="h-5 w-5 text-yellow-500 mr-3" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Assessment Due: Data Structures Quiz</p>
                <p className="text-xs text-gray-500">Tomorrow at 11:59 PM</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTrainerDashboard = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stats-card">
          <div className="stats-card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <BookOpenIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Courses</dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {analytics.totalCourses || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <UsersIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Students</dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {analytics.totalStudents || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                <ChartBarIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Class Average</dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {(() => {
                      const s = safeFixed(analytics.classAverage, 1);
                      return s === 'N/A' ? 'N/A' : `${s}%`;
                    })()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                <ClipboardDocumentListIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Grades</dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {analytics.pendingGrades || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="chart-container">
          <h3 className="chart-title">Class Performance Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="score" fill="#3b82f6" />
              <Bar dataKey="attendance" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3 className="chart-title">Course Enrollment</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={courseDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name || ''} ${percent != null && Number.isFinite(percent) ? (percent * 100).toFixed(0) : 0}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {courseDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderAdminDashboard = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stats-card">
          <div className="stats-card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <UsersIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {analytics.totalUsers || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <BookOpenIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Courses</dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {analytics.totalCourses || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                <ClipboardDocumentListIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Assessments</dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {analytics.totalAssessments || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                <ArrowTrendingUpIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">System Health</dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    <span className="text-green-600">Excellent</span>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Distribution */}
      {analytics.usersByRole && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">User Distribution</h3>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Administrators</span>
                  <span className="badge badge-info">{analytics.usersByRole.admin || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Trainers</span>
                  <span className="badge badge-warning">{analytics.usersByRole.trainer || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Students</span>
                  <span className="badge badge-success">{analytics.usersByRole.student || 0}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">System Overview</h3>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Active Users</span>
                  <span className="text-sm text-gray-900">{analytics.totalUsers || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Active Courses</span>
                  <span className="text-sm text-gray-900">{analytics.totalCourses || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Total Assessments</span>
                  <span className="text-sm text-gray-900">{analytics.totalAssessments || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Here's what's happening with your learning analytics today.
        </p>
      </div>

      {isStudent() && renderStudentDashboard()}
      {isTrainer() && renderTrainerDashboard()}
      {isAdmin() && renderAdminDashboard()}
    </div>
  );
};

export default Dashboard;
