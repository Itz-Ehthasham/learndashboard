import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { userService } from '../services/api';
import { UserGroupIcon } from '@heroicons/react/24/outline';

const Users = () => {
  const navigate = useNavigate();
  const { data: usersData, isLoading, error } = useQuery(
    'users',
    userService.getUsers
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
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading users</h3>
        <p className="text-gray-600">Please try refreshing the page.</p>
      </div>
    );
  }

  const users = usersData?.data?.data?.users || [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage system users and their roles.
        </p>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="flex items-center">
            <UserGroupIcon className="h-6 w-6 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">All Users</h3>
          </div>
        </div>
        <div className="card-body">
          {users.length > 0 ? (
            <div className="table-responsive">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">Name</th>
                    <th className="table-header-cell">Email</th>
                    <th className="table-header-cell">Role</th>
                    <th className="table-header-cell">Status</th>
                    <th className="table-header-cell">Actions</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {users.map((user) => (
                    <tr key={user._id} className="table-row">
                      <td className="table-cell">
                        {user.firstName} {user.lastName}
                      </td>
                      <td className="table-cell">{user.email}</td>
                      <td className="table-cell">
                        <span className={`badge capitalize ${
                          user.role === 'admin' ? 'badge-danger' :
                          user.role === 'trainer' ? 'badge-warning' :
                          'badge-success'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className={`badge ${
                          user.isActive ? 'badge-success' : 'badge-danger'
                        }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="table-cell">
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => navigate(`/users/${user._id}`)}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
              <p className="mt-1 text-sm text-gray-500">
                No users are currently registered in the system.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Users;
