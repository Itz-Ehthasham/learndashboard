import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
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
  ArrowLeftIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { appendGeneratedReport } from '../utils/reportsHistory';
import GeneratedReportDisplay, { normalizeReportRows } from '../components/GeneratedReportDisplay';

function enrichReportPayload(payload) {
  if (!payload) return payload;
  const rows = normalizeReportRows(payload.report);
  const scores = rows.map((r) => r?.data?.averageScore).filter((x) => x != null && Number.isFinite(Number(x)));
  const avg = scores.length ? scores.reduce((a, b) => a + Number(b), 0) / scores.length : undefined;
  return {
    ...payload,
    summary: {
      totalRecords: rows.length,
      ...payload.summary,
      averageScore: payload.summary?.averageScore ?? avg,
    },
  };
}

const ReportsGenerate = () => {
  const navigate = useNavigate();
  const { isTrainer, isAdmin, isStudent } = useAuth();
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
    ({ params }) => analyticsService.getPerformanceReport(params),
    {
      onSuccess: (response, variables) => {
        const payload = enrichReportPayload(response.data?.data ?? response.data);
        setReportData(payload);
        const { meta } = variables;
        const titleParts = ['Performance'];
        if (meta?.courseName) titleParts.push(meta.courseName);
        else if (meta?.courseId) titleParts.push('Course report');
        if (meta?.userName) titleParts.push(meta.userName);
        appendGeneratedReport({
          kind: 'performance',
          title: titleParts.join(' — '),
          courseId: meta?.courseId || undefined,
          courseName: meta?.courseName || undefined,
          userId: meta?.userId || undefined,
          userName: meta?.userName || undefined,
          period: payload.period,
          summary: payload.summary,
          snapshot: payload,
        });
        toast.success('Performance report generated — see Reports page to view or export.');
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
    ({ params }) => analyticsService.getAttendanceReport(params),
    {
      onSuccess: (response, variables) => {
        const payload = enrichReportPayload(response.data?.data ?? response.data);
        setReportData(payload);
        const { meta } = variables;
        appendGeneratedReport({
          kind: 'attendance',
          title: meta?.courseName
            ? `Attendance — ${meta.courseName}`
            : 'Attendance report',
          courseId: meta?.courseId || undefined,
          courseName: meta?.courseName || undefined,
          period: payload.period,
          summary: payload.summary,
          snapshot: payload,
        });
        toast.success('Attendance report generated — see Reports page to view or export.');
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

    if (data.reportType === 'performance' && isTrainer() && !data.course) {
      toast.error('Please select a course for this report.');
      setIsGenerating(false);
      return;
    }

    const params = {
      format: data.format || 'json',
      courseId: data.course || undefined,
      userId: data.user || undefined,
    };
    if (data.startDate) params.startDate = new Date(data.startDate).toISOString();
    if (data.endDate) params.endDate = new Date(data.endDate).toISOString();

    const courses = coursesData?.data?.data?.courses || [];
    const users = usersData?.data?.data?.users || [];
    const courseDoc = data.course ? courses.find((c) => c._id === data.course) : null;
    const userDoc = data.user ? users.find((u) => u._id === data.user) : null;
    const meta = {
      courseId: data.course || undefined,
      courseName: courseDoc?.title || courseDoc?.code || null,
      userId: data.user || undefined,
      userName: userDoc ? `${userDoc.firstName} ${userDoc.lastName}`.trim() : null,
      reportType: data.reportType,
    };

    if (data.reportType === 'performance') {
      generatePerformanceReportMutation.mutate({ params, meta });
    } else if (data.reportType === 'attendance') {
      if (!data.course) {
        toast.error('Attendance reports require a course.');
        setIsGenerating(false);
        return;
      }
      generateAttendanceReportMutation.mutate({ params, meta });
    } else {
      toast.error('This report type is not wired to the API yet.');
      setIsGenerating(false);
    }
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

  if (isStudent()) {
    return <Navigate to="/reports" replace />;
  }

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
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <FunnelIcon className="h-5 w-5 mr-2" />
              Filters
            </h3>
          </div>
          <div className="card-body space-y-6">
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

      {reportData && (
        <GeneratedReportDisplay
          reportData={reportData}
          filePrefix={`${reportType || 'report'}-report`}
        />
      )}
    </div>
  );
};

export default ReportsGenerate;
