import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { courseService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { BookOpenIcon, UserGroupIcon, CalendarIcon, PlusIcon } from '@heroicons/react/24/outline';

const Courses = () => {
  const navigate = useNavigate();
  const { user, isTrainer, isAdmin } = useAuth();
  
  const { data: coursesData, isLoading, error } = useQuery(
    'courses',
    courseService.getCourses
  );

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
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading courses</h3>
        <p className="text-gray-600">Please try refreshing the page.</p>
      </div>
    );
  }

  const courses = coursesData?.data?.data?.courses || [];

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
          <p className="mt-1 text-sm text-gray-600">
            Browse and manage your courses.
          </p>
        </div>
        {(isAdmin() || isTrainer()) && (
          <button
            onClick={() => navigate('/courses/create')}
            className="btn btn-primary"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Course
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div key={course._id} className="card">
            <div className="card-body">
              <div className="flex items-center mb-4">
                <BookOpenIcon className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{course.title}</h3>
                  <p className="text-sm text-gray-500">{course.code}</p>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {course.description}
              </p>
              
              <div className="space-y-2 text-sm text-gray-500">
                <div className="flex items-center">
                  <UserGroupIcon className="h-4 w-4 mr-2" />
                  {course.enrolledStudents?.length || 0} students enrolled
                </div>
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {course.duration} weeks
                </div>
              </div>
              
              <div className="mt-4 flex justify-between items-center">
                <span className="badge badge-info">{course.level}</span>
                <span className="badge badge-success">{course.credits} credits</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {courses.length === 0 && (
        <div className="text-center py-12">
          <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No courses available</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new course.
          </p>
        </div>
      )}
    </div>
  );
};

export default Courses;
