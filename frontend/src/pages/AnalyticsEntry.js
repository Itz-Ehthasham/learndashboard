import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { analyticsService, courseService, userService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  ChartBarIcon,
  UserGroupIcon,
  BookOpenIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

const AnalyticsEntry = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isTrainer, isAdmin } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analyticsData, setAnalyticsData] = useState({
    performance: {
      averageScore: '',
      totalAssessments: '',
      completedAssessments: '',
      passRate: ''
    },
    attendance: {
      totalSessions: '',
      attendedSessions: '',
      attendanceRate: ''
    },
    engagement: {
      loginFrequency: '',
      timeSpent: '',
      resourceAccessCount: ''
    },
    progress: {
      completedModules: '',
      totalModules: '',
      progressPercentage: ''
    }
  });

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
  } = useQuery(
    ['users', 'analytics-admin'],
    () => userService.getUsers({ limit: 500 }),
    { enabled: isAdmin() }
  );

  const {
    data: studentsData,
    isLoading: studentsLoading
  } = useQuery(
    ['users', 'students', 'analytics'],
    () => userService.getUsers({ role: 'student', limit: 500 }),
    { enabled: isTrainer() && !isAdmin() }
  );

  const generatePerformanceAnalyticsMutation = useMutation(
    analyticsService.generatePerformanceAnalytics,
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries(['analytics-records']);
        toast.success('Performance analytics generated successfully!');
        navigate('/analytics');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to generate analytics');
      },
      onSettled: () => {
        setIsSubmitting(false);
      }
    }
  );

  const generateAttendanceAnalyticsMutation = useMutation(
    analyticsService.generateAttendanceAnalytics,
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries(['analytics-records']);
        toast.success('Attendance analytics generated successfully!');
        navigate('/analytics');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to generate analytics');
      },
      onSettled: () => {
        setIsSubmitting(false);
      }
    }
  );

  const generateEngagementAnalyticsMutation = useMutation(
    analyticsService.generateEngagementAnalytics,
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries(['analytics-records']);
        toast.success('Engagement analytics generated successfully!');
        navigate('/analytics');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to generate analytics');
      },
      onSettled: () => {
        setIsSubmitting(false);
      }
    }
  );

  const generateProgressAnalyticsMutation = useMutation(
    analyticsService.generateProgressAnalytics,
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries(['analytics-records']);
        toast.success('Progress analytics generated successfully!');
        navigate('/analytics');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to generate analytics');
      },
      onSettled: () => {
        setIsSubmitting(false);
      }
    }
  );

  const handleAnalyticsDataChange = (category, field, value) => {
    setAnalyticsData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  
  const buildGenerateBody = (data) => {
    const end = data.endDate ? new Date(data.endDate) : new Date();
    end.setHours(23, 59, 59, 999);
    let start;
    if (data.startDate) {
      start = new Date(data.startDate);
      start.setHours(0, 0, 0, 0);
    } else {
      start = new Date(end);
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
    }

    return {
      userId: data.user,
      courseId: data.course,
      period: { start, end },
      data: analyticsData[data.analyticsType] || {},
    };
  };

  const onSubmit = async (data) => {
    if (!data.course) {
      toast.error('Please select a course.');
      return;
    }
    if (!data.user) {
      toast.error('Please select a user (student).');
      return;
    }

    setIsSubmitting(true);

    const apiBody = buildGenerateBody(data);

    switch (data.analyticsType) {
      case 'performance':
        generatePerformanceAnalyticsMutation.mutate(apiBody);
        break;
      case 'attendance':
        generateAttendanceAnalyticsMutation.mutate(apiBody);
        break;
      case 'engagement':
        generateEngagementAnalyticsMutation.mutate(apiBody);
        break;
      case 'progress':
        generateProgressAnalyticsMutation.mutate(apiBody);
        break;
      default:
        toast.error('Please select an analytics type');
        setIsSubmitting(false);
    }
  };

  const analyticsTypes = [
    { 
      value: 'performance', 
      label: 'Performance Analytics', 
      description: 'Student performance metrics, scores, and academic achievement data',
      icon: ChartBarIcon
    },
    { 
      value: 'attendance', 
      label: 'Attendance Analytics', 
      description: 'Class attendance records, patterns, and participation metrics',
      icon: UserGroupIcon
    },
    { 
      value: 'engagement', 
      label: 'Engagement Analytics', 
      description: 'Student engagement metrics, login frequency, and activity tracking',
      icon: ArrowTrendingUpIcon
    },
    { 
      value: 'progress', 
      label: 'Progress Analytics', 
      description: 'Course completion rates, module progress, and learning milestones',
      icon: BookOpenIcon
    }
  ];

  if (!isAdmin() && !isTrainer()) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">Only trainers and administrators can enter analytics data.</p>
      </div>
    );
  }

  const selectedAnalyticsType = watch('analyticsType');
  const currentType = analyticsTypes.find(t => t.value === selectedAnalyticsType);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <button
          onClick={() => navigate('/analytics')}
          className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Analytics
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Enter Analytics Data</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manually enter or generate analytics data for reporting and insights.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Analytics Type</h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analyticsTypes.map((type) => {
                const IconComponent = type.icon;
                return (
                  <label
                    key={type.value}
                    className={`relative rounded-lg border p-4 cursor-pointer transition-colors ${
                      selectedAnalyticsType === type.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input
                      {...register('analyticsType', { required: 'Please select an analytics type' })}
                      type="radio"
                      value={type.value}
                      className="sr-only"
                    />
                    <div className="flex items-start space-x-3">
                      <IconComponent className="h-6 w-6 text-blue-600 mt-1" />
                      <div>
                        <h4 className="font-medium text-gray-900">{type.label}</h4>
                        <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
            {errors.analyticsType && (
              <p className="form-error mt-2">{errors.analyticsType.message}</p>
            )}
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2" />
              Basic Information
            </h3>
            <p className="text-sm text-gray-500 mt-2">
              Choose a <strong>course</strong> and <strong>user</strong> (required). Date range is optional — if you leave dates empty, the last 30 days through today are used.
            </p>
          </div>
          <div className="card-body space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(isAdmin() || isTrainer()) && (
                <div>
                  <label htmlFor="course" className="form-label">
                    Course
                  </label>
                  <select
                    {...register('course', { required: 'Select a course' })}
                    className="form-input"
                    disabled={coursesLoading}
                  >
                    <option value="">Select a course</option>
                    {coursesData?.data?.data?.courses?.map(course => (
                      <option key={course._id} value={course._id}>
                        {course.title} ({course.code})
                      </option>
                    ))}
                  </select>
                  {coursesLoading && (
                    <p className="text-sm text-gray-500 mt-1">Loading courses...</p>
                  )}
                  {errors.course && (
                    <p className="form-error mt-1">{errors.course.message}</p>
                  )}
                </div>
              )}
              {(isAdmin() || isTrainer()) && (
                <div>
                  <label htmlFor="user" className="form-label">
                    User (student)
                  </label>
                  <select
                    {...register('user', { required: 'Select a user' })}
                    className="form-input"
                    disabled={isAdmin() ? usersLoading : studentsLoading}
                  >
                    <option value="">Select a user</option>
                    {(isAdmin()
                      ? usersData?.data?.data?.users
                      : studentsData?.data?.data?.users
                    )?.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.firstName} {u.lastName} ({u.role})
                      </option>
                    ))}
                  </select>
                  {(isAdmin() ? usersLoading : studentsLoading) && (
                    <p className="text-sm text-gray-500 mt-1">Loading users...</p>
                  )}
                  {errors.user && (
                    <p className="form-error mt-1">{errors.user.message}</p>
                  )}
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="startDate" className="form-label">
                  Start Date
                </label>
                <input
                  {...register('startDate')}
                  type="date"
                  className="form-input"
                />
              </div>
              <div>
                <label htmlFor="endDate" className="form-label">
                  End Date
                </label>
                <input
                  {...register('endDate')}
                  type="date"
                  className="form-input"
                />
              </div>
            </div>
          </div>
        </div>
        {selectedAnalyticsType && (
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                {currentType && <currentType.icon className="h-5 w-5 mr-2" />}
                {currentType?.label} Data
              </h3>
            </div>
            <div className="card-body">
              {selectedAnalyticsType === 'performance' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="form-label">Average Score (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={analyticsData.performance.averageScore}
                        onChange={(e) => handleAnalyticsDataChange('performance', 'averageScore', e.target.value)}
                        className="form-input"
                        placeholder="85.5"
                      />
                    </div>
                    <div>
                      <label className="form-label">Total Assessments</label>
                      <input
                        type="number"
                        min="0"
                        value={analyticsData.performance.totalAssessments}
                        onChange={(e) => handleAnalyticsDataChange('performance', 'totalAssessments', e.target.value)}
                        className="form-input"
                        placeholder="10"
                      />
                    </div>
                    <div>
                      <label className="form-label">Completed Assessments</label>
                      <input
                        type="number"
                        min="0"
                        value={analyticsData.performance.completedAssessments}
                        onChange={(e) => handleAnalyticsDataChange('performance', 'completedAssessments', e.target.value)}
                        className="form-input"
                        placeholder="8"
                      />
                    </div>
                    <div>
                      <label className="form-label">Pass Rate (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={analyticsData.performance.passRate}
                        onChange={(e) => handleAnalyticsDataChange('performance', 'passRate', e.target.value)}
                        className="form-input"
                        placeholder="80.0"
                      />
                    </div>
                  </div>
                </div>
              )}
              {selectedAnalyticsType === 'attendance' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="form-label">Total Sessions</label>
                      <input
                        type="number"
                        min="0"
                        value={analyticsData.attendance.totalSessions}
                        onChange={(e) => handleAnalyticsDataChange('attendance', 'totalSessions', e.target.value)}
                        className="form-input"
                        placeholder="20"
                      />
                    </div>
                    <div>
                      <label className="form-label">Attended Sessions</label>
                      <input
                        type="number"
                        min="0"
                        value={analyticsData.attendance.attendedSessions}
                        onChange={(e) => handleAnalyticsDataChange('attendance', 'attendedSessions', e.target.value)}
                        className="form-input"
                        placeholder="18"
                      />
                    </div>
                    <div>
                      <label className="form-label">Attendance Rate (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={analyticsData.attendance.attendanceRate}
                        onChange={(e) => handleAnalyticsDataChange('attendance', 'attendanceRate', e.target.value)}
                        className="form-input"
                        placeholder="90.0"
                      />
                    </div>
                  </div>
                </div>
              )}
              {selectedAnalyticsType === 'engagement' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="form-label">Login Frequency (per week)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={analyticsData.engagement.loginFrequency}
                        onChange={(e) => handleAnalyticsDataChange('engagement', 'loginFrequency', e.target.value)}
                        className="form-input"
                        placeholder="5.2"
                      />
                    </div>
                    <div>
                      <label className="form-label">Time Spent (hours per week)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={analyticsData.engagement.timeSpent}
                        onChange={(e) => handleAnalyticsDataChange('engagement', 'timeSpent', e.target.value)}
                        className="form-input"
                        placeholder="12.5"
                      />
                    </div>
                    <div>
                      <label className="form-label">Resource Access Count</label>
                      <input
                        type="number"
                        min="0"
                        value={analyticsData.engagement.resourceAccessCount}
                        onChange={(e) => handleAnalyticsDataChange('engagement', 'resourceAccessCount', e.target.value)}
                        className="form-input"
                        placeholder="45"
                      />
                    </div>
                  </div>
                </div>
              )}
              {selectedAnalyticsType === 'progress' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="form-label">Completed Modules</label>
                      <input
                        type="number"
                        min="0"
                        value={analyticsData.progress.completedModules}
                        onChange={(e) => handleAnalyticsDataChange('progress', 'completedModules', e.target.value)}
                        className="form-input"
                        placeholder="8"
                      />
                    </div>
                    <div>
                      <label className="form-label">Total Modules</label>
                      <input
                        type="number"
                        min="0"
                        value={analyticsData.progress.totalModules}
                        onChange={(e) => handleAnalyticsDataChange('progress', 'totalModules', e.target.value)}
                        className="form-input"
                        placeholder="10"
                      />
                    </div>
                    <div>
                      <label className="form-label">Progress Percentage (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={analyticsData.progress.progressPercentage}
                        onChange={(e) => handleAnalyticsDataChange('progress', 'progressPercentage', e.target.value)}
                        className="form-input"
                        placeholder="80.0"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !selectedAnalyticsType}
            className="btn btn-primary disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <div className="spinner h-4 w-4 mr-2" />
                Generating Analytics...
              </div>
            ) : (
              <div className="flex items-center">
                <ChartBarIcon className="h-4 w-4 mr-2" />
                Generate Analytics
              </div>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AnalyticsEntry;
