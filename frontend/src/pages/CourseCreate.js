import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation } from 'react-query';
import { courseService, userService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  BookOpenIcon,
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

const CourseCreate = () => {
  const navigate = useNavigate();
  const { user, isTrainer, isAdmin } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm();

  const {
    data: usersData,
    isLoading: usersLoading
  } = useQuery('users', () => userService.getUsers(), {
    enabled: isAdmin()
  });

  const createCourseMutation = useMutation(courseService.createCourse, {
    onSuccess: (response) => {
      toast.success('Course created successfully!');
      navigate(`/courses/${response.data.data.course._id}`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create course');
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    
    // Format the data for API
    const courseData = {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      schedule: {
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        daysOfWeek: data.daysOfWeek || [],
        startTime: data.startTime || '',
        endTime: data.endTime || ''
      }
    };

    // Remove schedule fields from main data
    delete courseData.daysOfWeek;
    delete courseData.startTime;
    delete courseData.endTime;

    createCourseMutation.mutate(courseData);
  };

  const daysOfWeek = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];

  const categories = [
    'Computer Science', 'Mathematics', 'Science', 'Engineering', 
    'Business', 'Arts', 'Language', 'Health', 'Other'
  ];

  const branches = [
    'CSE', 'CSM', 'EEE', 'ECE', 'EIE', 'MECH', 'CHEM', 'CIVIL', 'CSC', 'DS', 'AI', 'IT', 'BTech', 'MTech', 'BSc', 'MSc', 'PhD', 'Other'
  ];

  const levels = ['Beginner', 'Intermediate', 'Advanced'];

  if (!isAdmin() && !isTrainer()) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">Only trainers and administrators can create courses.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <button
          onClick={() => navigate('/courses')}
          className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Courses
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Create New Course</h1>
        <p className="mt-1 text-sm text-gray-600">
          Fill in the details to create a new course.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Information */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <BookOpenIcon className="h-5 w-5 mr-2" />
              Basic Information
            </h3>
          </div>
          <div className="card-body space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="title" className="form-label">
                  Course Title *
                </label>
                <input
                  {...register('title', {
                    required: 'Course title is required',
                    maxLength: {
                      value: 200,
                      message: 'Title cannot exceed 200 characters'
                    }
                  })}
                  type="text"
                  className="form-input"
                  placeholder="e.g., Introduction to Web Development"
                />
                {errors.title && (
                  <p className="form-error">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="code" className="form-label">
                  Course Code *
                </label>
                <input
                  {...register('code', {
                    required: 'Course code is required',
                    pattern: {
                      value: /^[A-Z0-9-]+$/,
                      message: 'Course code must contain only uppercase letters, numbers, and hyphens'
                    }
                  })}
                  type="text"
                  className="form-input"
                  placeholder="e.g., CS101"
                />
                {errors.code && (
                  <p className="form-error">{errors.code.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="description" className="form-label">
                Description *
              </label>
              <textarea
                {...register('description', {
                  required: 'Description is required',
                  minLength: {
                    value: 10,
                    message: 'Description must be at least 10 characters long'
                  }
                })}
                rows={4}
                className="form-input"
                placeholder="Provide a detailed description of the course..."
              />
              {errors.description && (
                <p className="form-error">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="category" className="form-label">
                  Category *
                </label>
                <select
                  {...register('category', { required: 'Course category is required' })}
                  className="form-input"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="form-error">{errors.category.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="branch" className="form-label">
                  Engineering Branch *
                </label>
                <select
                  {...register('branch', { required: 'Engineering branch is required' })}
                  className="form-input"
                >
                  {branches.map((branch) => (
                    <option key={branch} value={branch}>
                      {branch}
                    </option>
                  ))}
                </select>
                {errors.branch && (
                  <p className="form-error">{errors.branch.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="level" className="form-label">
                  Level *
                </label>
                <select
                  {...register('level', { required: 'Level is required' })}
                  className="form-input"
                >
                  <option value="">Select a level</option>
                  {levels.map(level => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
                {errors.level && (
                  <p className="form-error">{errors.level.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="credits" className="form-label">
                  Credits *
                </label>
                <input
                  {...register('credits', {
                    required: 'Credits are required',
                    min: {
                      value: 1,
                      message: 'Credits must be at least 1'
                    },
                    max: {
                      value: 10,
                      message: 'Credits cannot exceed 10'
                    }
                  })}
                  type="number"
                  className="form-input"
                  placeholder="3"
                />
                {errors.credits && (
                  <p className="form-error">{errors.credits.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Course Details */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <ClockIcon className="h-5 w-5 mr-2" />
              Course Details
            </h3>
          </div>
          <div className="card-body space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="duration" className="form-label">
                  Duration (weeks) *
                </label>
                <input
                  {...register('duration', {
                    required: 'Duration is required',
                    min: {
                      value: 1,
                      message: 'Duration must be at least 1 week'
                    },
                    max: {
                      value: 52,
                      message: 'Duration cannot exceed 52 weeks'
                    }
                  })}
                  type="number"
                  className="form-input"
                  placeholder="12"
                />
                {errors.duration && (
                  <p className="form-error">{errors.duration.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="maxStudents" className="form-label">
                  Maximum Students *
                </label>
                <input
                  {...register('maxStudents', {
                    required: 'Maximum students is required',
                    min: {
                      value: 1,
                      message: 'Maximum students must be at least 1'
                    },
                    max: {
                      value: 500,
                      message: 'Maximum students cannot exceed 500'
                    }
                  })}
                  type="number"
                  className="form-input"
                  placeholder="30"
                />
                {errors.maxStudents && (
                  <p className="form-error">{errors.maxStudents.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="prerequisites" className="form-label">
                Prerequisites
              </label>
              <textarea
                {...register('prerequisites')}
                rows={3}
                className="form-input"
                placeholder="List any prerequisites for this course..."
              />
            </div>

            <div>
              <label htmlFor="learningOutcomes" className="form-label">
                Learning Outcomes
              </label>
              <textarea
                {...register('learningOutcomes')}
                rows={4}
                className="form-input"
                placeholder="What will students learn after completing this course?"
              />
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2" />
              Schedule
            </h3>
          </div>
          <div className="card-body space-y-6">
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

            <div>
              <label className="form-label">Days of Week</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {daysOfWeek.map(day => (
                  <label key={day} className="flex items-center">
                    <input
                      {...register('daysOfWeek')}
                      type="checkbox"
                      value={day}
                      className="mr-2"
                    />
                    <span className="text-sm">{day}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="startTime" className="form-label">
                  Start Time
                </label>
                <input
                  {...register('startTime')}
                  type="time"
                  className="form-input"
                />
              </div>

              <div>
                <label htmlFor="endTime" className="form-label">
                  End Time
                </label>
                <input
                  {...register('endTime')}
                  type="time"
                  className="form-input"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Instructor Assignment (Admin Only) */}
        {isAdmin() && (
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <AcademicCapIcon className="h-5 w-5 mr-2" />
                Instructor Assignment
              </h3>
            </div>
            <div className="card-body">
              <div>
                <label htmlFor="instructor" className="form-label">
                  Assign Instructor
                </label>
                <select
                  {...register('instructor')}
                  className="form-input"
                  disabled={usersLoading}
                >
                  <option value="">Select an instructor</option>
                  {usersData?.data?.data?.users
                    ?.filter(user => user.role === 'trainer')
                    ?.map(instructor => (
                      <option key={instructor._id} value={instructor._id}>
                        {instructor.firstName} {instructor.lastName} ({instructor.email})
                      </option>
                    ))}
                </select>
                {usersLoading && (
                  <p className="text-sm text-gray-500 mt-1">Loading instructors...</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/courses')}
            className="btn btn-outline"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <div className="spinner h-4 w-4 mr-2" />
                Creating Course...
              </div>
            ) : (
              'Create Course'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CourseCreate;
