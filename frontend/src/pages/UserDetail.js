import React from 'react';
import { useParams } from 'react-router-dom';

const UserDetail = () => {
  const { id } = useParams();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">User Details</h1>
        <p className="mt-1 text-sm text-gray-600">
          View and manage user information.
        </p>
      </div>

      <div className="card">
        <div className="card-body">
          <p className="text-gray-600">User ID: {id}</p>
          <p className="text-sm text-gray-500 mt-2">
            User details page will be implemented with full user profile information, 
            course enrollment, assessment history, and performance analytics.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserDetail;
