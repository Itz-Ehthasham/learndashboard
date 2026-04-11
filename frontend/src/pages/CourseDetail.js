import React from 'react';
import { useParams } from 'react-router-dom';

const CourseDetail = () => {
  const { id } = useParams();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Course Details</h1>
        <p className="mt-1 text-sm text-gray-600">
          View and manage course information.
        </p>
      </div>

      <div className="card">
        <div className="card-body">
          <p className="text-gray-600">Course ID: {id}</p>
          <p className="text-sm text-gray-500 mt-2">
            Course details page will be implemented with full course information, 
            enrolled students, assessments, and analytics.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
