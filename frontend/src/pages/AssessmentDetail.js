import React from 'react';
import { useParams } from 'react-router-dom';

const AssessmentDetail = () => {
  const { id } = useParams();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Assessment Details</h1>
        <p className="mt-1 text-sm text-gray-600">
          View assessment information and submissions.
        </p>
      </div>

      <div className="card">
        <div className="card-body">
          <p className="text-gray-600">Assessment ID: {id}</p>
          <p className="text-sm text-gray-500 mt-2">
            Assessment details page will be implemented with full assessment information, 
            questions, submissions, and grading interface.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AssessmentDetail;
