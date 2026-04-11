import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation } from 'react-query';
import { analyticsService, courseService, userService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  DocumentTextIcon,
  ChartBarIcon,
  UserGroupIcon,
  BookOpenIcon,
  CalendarIcon,
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

const ReportsGenerate = () => {
  const navigate = useNavigate();
  const { user, isTrainer, isAdmin, isStudent } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm();

  const {
    data: coursesData,
    isLoading: coursesLoading
  } = useQuery('courses', courseService.getCourses, {
    enabled: isAdmin() || isTrainer()
  });

  const {
    data: usersData,
    isLoading: usersLoading
  } = useQuery('users', userService.getUsers, {
    enabled: isAdmin()
  });

  const generatePerformanceReportMutation = useMutation(
    analyticsService.getPerformanceReport,
    {
      onSuccess: (response) => {
        setReportData(response.data);
        toast.success('Performance report generated successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to generate report');
      },
      onSettled: () => {
        setIsGenerating(false);
      }
    }
  );

  const generateAttendanceReportMutation = useMutation(
    analyticsService.getAttendanceReport,
    {
      onSuccess: (response) => {
        setReportData(response.data);
        toast.success('Attendance report generated successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to generate report');
      },
      onSettled: () => {
        setIsGenerating(false);
      }
    }
  );

  const reportType = watch('reportType');
  const dateRange = watch('dateRange');

  const onSubmit = async (data) => {
    setIsGenerating(true);
    setReportData(null);

    const params = {
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      course: data.course,
      user: data.user,
      format: data.format || 'json'
    };

    if (data.reportType === 'performance') {
      generatePerformanceReportMutation.mutate(params);
    } else if (data.reportType === 'attendance') {
      generateAttendanceReportMutation.mutate(params);
    }
  };

  const exportToCSV = (data, filename) => {
    if (!data || !data.report) return;

    const csvContent = [
      Object.keys(data.report[0] || {}).join(','),
      ...data.report.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToJSON = (data, filename) => {
    if (!data) return;

    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const reportTypes = [
    { value: 'performance', label: 'Performance Report', description: 'Student performance metrics and scores' },
    { value: 'attendance', label: 'Attendance Report', description: 'Attendance tracking and patterns' },
    { value: 'engagement', label: 'Engagement Report', description: 'Student engagement and activity metrics' },
    { value: 'progress', label: 'Progress Report', description: 'Course completion and progress tracking' }
  ];

  const dateRanges = [
    { value: 'last7days', label: 'Last 7 Days' },
    { value: 'last30days', label: 'Last 30 Days' },
    { value: 'last90days', label: 'Last 90 Days' },
    { value: 'custom', label: 'Custom Range' }
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <button
          onClick={() => navigate('/reports')}
          className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Reports
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Generate Reports</h1>
        <p className="mt-1 text-sm text-gray-600">
          Create detailed reports with custom filters and export options.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Report Configuration */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              Report Configuration
            </h3>
          </div>
          <div className="card-body space-y-6">
            <div>
              <label htmlFor="reportType" className="form-label">
                Report Type *
              </label>
              <select
                {...register('reportType', { required: 'Report type is required' })}
                className="form-input"
              >
                <option value="">Select report type</option>
                {reportTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {errors.reportType && (
                <p className="form-error">{errors.reportType.message}</p>
              )}
              {reportType && (
                <p className="mt-2 text-sm text-gray-500">
                  {reportTypes.find(t => t.value === reportType)?.description}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="dateRange" className="form-label">
                Date Range *
              </label>
              <select
                {...register('dateRange', { required: 'Date range is required' })}
                className="form-input"
              >
                <option value="">Select date range</option>
                {dateRanges.map(range => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
              {errors.dateRange && (
                <p className="form-error">{errors.dateRange.message}</p>
              )}
            </div>

            {dateRange === 'custom' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="startDate" className="form-label">
                    Start Date *
                  </label>
                  <input
                    {...register('startDate', { required: 'Start date is required for custom range' })}
                    type="date"
                    className="form-input"
                  />
                  {errors.startDate && (
                    <p className="form-error">{errors.startDate.message}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="endDate" className="form-label">
                    End Date *
                  </label>
                  <input
                    {...register('endDate', { required: 'End date is required for custom range' })}
                    type="date"
                    className="form-input"
                  />
                  {errors.endDate && (
                    <p className="form-error">{errors.endDate.message}</p>
                  )}
                </div>
              </div>
            )}

            <div>
              <label htmlFor="format" className="form-label">
                Output Format
              </label>
              <select
                {...register('format')}
                className="form-input"
              >
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
                <option value="pdf">PDF</option>
              </select>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <FunnelIcon className="h-5 w-5 mr-2" />
              Filters
            </h3>
          </div>
          <div className="card-body space-y-6">
            {/* Course Filter */}
            {(isAdmin() || isTrainer()) && (
              <div>
                <label htmlFor="course" className="form-label">
                  Course
                </label>
                <select
                  {...register('course')}
                  className="form-input"
                  disabled={coursesLoading}
                >
                  <option value="">All Courses</option>
                  {coursesData?.data?.data?.courses?.map(course => (
                    <option key={course._id} value={course._id}>
                      {course.title} ({course.code})
                    </option>
                  ))}
                </select>
                {coursesLoading && (
                  <p className="text-sm text-gray-500 mt-1">Loading courses...</p>
                )}
              </div>
            )}

            {/* User Filter */}
            {isAdmin() && (
              <div>
                <label htmlFor="user" className="form-label">
                  User
                </label>
                <select
                  {...register('user')}
                  className="form-input"
                  disabled={usersLoading}
                >
                  <option value="">All Users</option>
                  {usersData?.data?.data?.users?.map(user => (
                    <option key={user._id} value={user._id}>
                      {user.firstName} {user.lastName} ({user.role})
                    </option>
                  ))}
                </select>
                {usersLoading && (
                  <p className="text-sm text-gray-500 mt-1">Loading users...</p>
                )}
              </div>
            )}

            {/* Role Filter (Admin Only) */}
            {isAdmin() && (
              <div>
                <label htmlFor="role" className="form-label">
                  Role
                </label>
                <select
                  {...register('role')}
                  className="form-input"
                >
                  <option value="">All Roles</option>
                  <option value="admin">Administrators</option>
                  <option value="trainer">Trainers</option>
                  <option value="student">Students</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Generate Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isGenerating}
            className="btn btn-primary disabled:opacity-50"
          >
            {isGenerating ? (
              <div className="flex items-center">
                <div className="spinner h-4 w-4 mr-2" />
                Generating Report...
              </div>
            ) : (
              <div className="flex items-center">
                <ChartBarIcon className="h-4 w-4 mr-2" />
                Generate Report
              </div>
            )}
          </button>
        </div>
      </form>

      {/* Report Results */}
      {reportData && (
        <div className="card mt-8">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              Report Results
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => exportToCSV(reportData, `${reportType}-report`)}
                className="btn btn-secondary btn-sm"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Export CSV
              </button>
              <button
                onClick={() => exportToJSON(reportData, `${reportType}-report`)}
                className="btn btn-secondary btn-sm"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Export JSON
              </button>
            </div>
          </div>
          <div className="card-body">
            {/* Report Summary */}
            <div className="mb-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-600 font-medium">Total Records</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {reportData.summary?.totalRecords || 0}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-600 font-medium">Average Score</p>
                  <p className="text-2xl font-bold text-green-900">
                    {reportData.summary?.averageScore?.toFixed(1) || 'N/A'}
                  </p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <p className="text-sm text-yellow-600 font-medium">Pass Rate</p>
                  <p className="text-2xl font-bold text-yellow-900">
                    {reportData.summary?.passRate ? `${reportData.summary.passRate.toFixed(1)}%` : 'N/A'}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm text-purple-600 font-medium">Completion Rate</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {reportData.summary?.completionRate ? `${reportData.summary.completionRate.toFixed(1)}%` : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Report Data Table */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Detailed Data</h4>
              <div className="table-responsive max-h-96 overflow-y-auto">
                <table className="table">
                  <thead className="table-header sticky top-0">
                    <tr>
                      {reportData.report?.[0] && Object.keys(reportData.report[0]).map(key => (
                        <th key={key} className="table-header-cell">
                          {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="table-body">
                    {reportData.report?.slice(0, 50).map((row, index) => (
                      <tr key={index} className="table-row">
                        {Object.values(row).map((value, cellIndex) => (
                          <td key={cellIndex} className="table-cell">
                            {typeof value === 'object' ? JSON.stringify(value) : value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {reportData.report?.length > 50 && (
                <p className="text-sm text-gray-500 mt-2">
                  Showing first 50 of {reportData.report.length} records. Export to see all data.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsGenerate;
