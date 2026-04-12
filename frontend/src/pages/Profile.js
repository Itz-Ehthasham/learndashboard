import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { EyeIcon, EyeSlashIcon, CameraIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateProfile, changePassword, isLoading } = useAuth();
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    reset: resetProfile,
  } = useForm({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
      dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    watch,
    reset: resetPassword,
  } = useForm();

  const newPassword = watch('newPassword');

  const onProfileUpdate = async (data) => {
    setIsUpdating(true);
    try {
      const result = await updateProfile(data);
      if (result.success) {
        toast.success('Profile updated successfully!');
      }
    } catch (error) {
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const onPasswordChange = async (data) => {
    setIsChangingPassword(true);
    try {
      const result = await changePassword(data.currentPassword, data.newPassword);
      if (result.success) {
        toast.success('Password changed successfully!');
        resetPassword();
        setShowPasswordForm(false);
      }
    } catch (error) {
      toast.error('Failed to change password. Please try again.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'trainer':
        return 'bg-blue-100 text-blue-800';
      case 'student':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your personal information and account settings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="card">
            <div className="card-body text-center">
              <div className="relative inline-block">
                <div className="h-24 w-24 rounded-full bg-gray-300 mx-auto flex items-center justify-center">
                  <span className="text-3xl font-medium text-gray-700">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </span>
                </div>
                <button
                  type="button"
                  className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <CameraIcon className="h-4 w-4" />
                </button>
              </div>
              
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                {user?.firstName} {user?.lastName}
              </h3>
              <p className="text-sm text-gray-600">{user?.email}</p>
              
              <div className="mt-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user?.role)}`}>
                  {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                </span>
              </div>
              
              <div className="mt-6 space-y-2 text-sm text-gray-600">
                <div>
                  <strong>Member since:</strong> {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </div>
                <div>
                  <strong>Last login:</strong> {user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="lg:col-span-2 space-y-8">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Profile Information</h3>
            </div>
            <div className="card-body">
              <form onSubmit={handleProfileSubmit(onProfileUpdate)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="firstName" className="form-label">
                      First Name
                    </label>
                    <input
                      {...registerProfile('firstName', {
                        required: 'First name is required',
                        pattern: {
                          value: /^[a-zA-Z\s]+$/,
                          message: 'First name can only contain letters',
                        },
                      })}
                      type="text"
                      className="form-input"
                      disabled={isUpdating}
                    />
                    {profileErrors.firstName && (
                      <p className="form-error">{profileErrors.firstName.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="lastName" className="form-label">
                      Last Name
                    </label>
                    <input
                      {...registerProfile('lastName', {
                        required: 'Last name is required',
                        pattern: {
                          value: /^[a-zA-Z\s]+$/,
                          message: 'Last name can only contain letters',
                        },
                      })}
                      type="text"
                      className="form-input"
                      disabled={isUpdating}
                    />
                    {profileErrors.lastName && (
                      <p className="form-error">{profileErrors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="form-label">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    className="form-input bg-gray-50"
                    disabled
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Email cannot be changed. Contact administrator if needed.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="phone" className="form-label">
                      Phone Number
                    </label>
                    <input
                      {...registerProfile('phone', {
                        pattern: {
                          value: /^[+]?[\d\s\-\(\)]+$/,
                          message: 'Invalid phone number format',
                        },
                      })}
                      type="tel"
                      className="form-input"
                      placeholder="+1 (555) 123-4567"
                      disabled={isUpdating}
                    />
                    {profileErrors.phone && (
                      <p className="form-error">{profileErrors.phone.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="dateOfBirth" className="form-label">
                      Date of Birth
                    </label>
                    <input
                      {...registerProfile('dateOfBirth')}
                      type="date"
                      className="form-input"
                      disabled={isUpdating}
                    />
                    {profileErrors.dateOfBirth && (
                      <p className="form-error">{profileErrors.dateOfBirth.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isUpdating || isLoading}
                    className="btn btn-primary disabled:opacity-50"
                  >
                    {isUpdating ? (
                      <div className="flex items-center">
                        <div className="spinner h-4 w-4 mr-2" />
                        Updating...
                      </div>
                    ) : (
                      'Update Profile'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Change Password</h3>
            </div>
            <div className="card-body">
              {!showPasswordForm ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-600 mb-4">
                    For security reasons, you should change your password regularly.
                  </p>
                  <button
                    onClick={() => setShowPasswordForm(true)}
                    className="btn btn-secondary"
                  >
                    Change Password
                  </button>
                </div>
              ) : (
                <form onSubmit={handlePasswordSubmit(onPasswordChange)} className="space-y-6">
                  <div>
                    <label htmlFor="currentPassword" className="form-label">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        {...registerPassword('currentPassword', {
                          required: 'Current password is required',
                        })}
                        type={showCurrentPassword ? 'text' : 'password'}
                        className="form-input pr-10"
                        placeholder="Enter current password"
                        disabled={isChangingPassword}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? (
                          <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                        ) : (
                          <EyeIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {passwordErrors.currentPassword && (
                      <p className="form-error">{passwordErrors.currentPassword.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="newPassword" className="form-label">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        {...registerPassword('newPassword', {
                          required: 'New password is required',
                          minLength: {
                            value: 6,
                            message: 'Password must be at least 6 characters',
                          },
                          pattern: {
                            value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                            message: 'Password must contain at least one lowercase letter, one uppercase letter, and one number',
                          },
                        })}
                        type={showNewPassword ? 'text' : 'password'}
                        className="form-input pr-10"
                        placeholder="Enter new password"
                        disabled={isChangingPassword}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                        ) : (
                          <EyeIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {passwordErrors.newPassword && (
                      <p className="form-error">{passwordErrors.newPassword.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="form-label">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        {...registerPassword('confirmPassword', {
                          required: 'Please confirm your new password',
                          validate: (value) =>
                            value === newPassword || 'Passwords do not match',
                        })}
                        type={showConfirmPassword ? 'text' : 'password'}
                        className="form-input pr-10"
                        placeholder="Confirm new password"
                        disabled={isChangingPassword}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                        ) : (
                          <EyeIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {passwordErrors.confirmPassword && (
                      <p className="form-error">{passwordErrors.confirmPassword.message}</p>
                    )}
                  </div>

                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordForm(false);
                        resetPassword();
                      }}
                      className="btn btn-outline"
                      disabled={isChangingPassword}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isChangingPassword || isLoading}
                      className="btn btn-primary disabled:opacity-50"
                    >
                      {isChangingPassword ? (
                        <div className="flex items-center">
                          <div className="spinner h-4 w-4 mr-2" />
                          Changing Password...
                        </div>
                      ) : (
                        'Change Password'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
