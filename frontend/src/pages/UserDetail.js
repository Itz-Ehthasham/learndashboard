import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import { userService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const { data, isLoading, error } = useQuery(
    ['user', id],
    () => userService.getUser(id),
    { enabled: !!id, retry: 1 }
  );

  const user = data?.data?.data?.user ?? null;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm();

  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        role: user.role || 'student',
        isActive: user.isActive !== false,
      });
    }
  }, [user, reset]);

  const updateMutation = useMutation(
    (payload) => userService.updateUser(id, payload),
    {
      onSuccess: () => {
        toast.success('User updated successfully');
        queryClient.invalidateQueries(['user', id]);
        queryClient.invalidateQueries('users');
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || 'Update failed');
      },
    }
  );

  const deleteMutation = useMutation(() => userService.deleteUser(id), {
    onSuccess: () => {
      toast.success('User deleted');
      queryClient.invalidateQueries('users');
      navigate('/users');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Delete failed');
    },
  });

  const onSubmit = (form) => {
    const payload = {
      firstName: form.firstName,
      lastName: form.lastName,
      phone: form.phone || undefined,
    };
    if (!isSelf) {
      payload.role = form.role;
      payload.isActive = form.isActive;
    }
    updateMutation.mutate(payload);
  };

  const handleDelete = () => {
    if (!window.confirm('Delete this user permanently? This cannot be undone.')) return;
    deleteMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner h-8 w-8" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">Could not load user.</p>
        <button type="button" className="btn btn-primary" onClick={() => navigate('/users')}>
          Back to users
        </button>
      </div>
    );
  }

  const isSelf = String(currentUser?._id) === String(user?._id);

  return (
    <div className="max-w-2xl mx-auto">
      <button
        type="button"
        onClick={() => navigate('/users')}
        className="flex items-center text-blue-600 hover:text-blue-700 mb-6"
      >
        <ArrowLeftIcon className="h-4 w-4 mr-2" />
        Back to users
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        {user.firstName} {user.lastName}
      </h1>
      <p className="text-sm text-gray-500 mb-8">{user.email}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="card">
        <div className="card-body space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">First name</label>
              <input {...register('firstName', { required: 'Required' })} className="form-input" />
              {errors.firstName && <p className="form-error">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className="form-label">Last name</label>
              <input {...register('lastName', { required: 'Required' })} className="form-input" />
              {errors.lastName && <p className="form-error">{errors.lastName.message}</p>}
            </div>
          </div>

          <div>
            <label className="form-label">Phone</label>
            <input {...register('phone')} className="form-input" />
          </div>

          <div>
            <label className="form-label">Role</label>
            <select {...register('role')} className="form-input" disabled={isSelf}>
              <option value="student">Student</option>
              <option value="trainer">Trainer</option>
              <option value="admin">Administrator</option>
            </select>
            {isSelf && (
              <p className="text-sm text-amber-700 mt-1">You cannot change your own role here.</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="isActive" {...register('isActive')} disabled={isSelf} />
            <label htmlFor="isActive" className="text-sm text-gray-700">
              Active account
            </label>
            {isSelf && (
              <span className="text-sm text-amber-700">(Use another admin to deactivate your account.)</span>
            )}
          </div>

          <div className="flex flex-wrap gap-3 pt-4">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!isDirty || updateMutation.isLoading}
            >
              {updateMutation.isLoading ? 'Saving…' : 'Save changes'}
            </button>
            <button
              type="button"
              className="btn btn-outline text-red-600 border-red-300 hover:bg-red-50"
              onClick={handleDelete}
              disabled={isSelf || deleteMutation.isLoading}
            >
              {deleteMutation.isLoading ? 'Deleting…' : 'Delete user'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default UserDetail;
