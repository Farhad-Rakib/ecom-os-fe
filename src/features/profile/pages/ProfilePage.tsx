import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Shield, Lock, Eye, EyeOff, Pencil, X } from 'lucide-react';
import { userApi } from '../../../core/api/services/user.api';
import { fileApi } from '../../../core/api/services/file.api';
import { AuthService } from '../../../core/services/impl/auth.service';
import { toast } from '../../../components/ui/Toast/toast.store';
import { ImageUpload } from '../../../components/ui/ImageUpload/ImageUpload';

const authService = new AuthService();

export const ProfilePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    email: '',
    profileImageUrl: '',
  });
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => userApi.getMe(),
    staleTime: 2 * 60 * 1000,
  });

  useEffect(() => {
    if (profile) {
      setProfileForm({
        fullName: profile.fullName || '',
        email: profile.email || '',
        profileImageUrl: profile.profileImageUrl || '',
      });
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: (dto: { fullName: string; email: string; profileImageUrl: string }) =>
      userApi.updateMe(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      toast.success('Profile updated successfully');
      setIsEditing(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to update profile'),
  });

  const changePasswordMutation = useMutation({
    mutationFn: () => {
      if (!profile?.id) throw new Error('User ID not found');
      return authService.changePassword({
        userId: profile.id,
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
    },
    onSuccess: () => {
      toast.success('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowChangePassword(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to change password'),
  });

  const handleUploadImage = async (file: File): Promise<string> => {
    const url = await fileApi.uploadImage(file);
    return url;
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.fullName.trim()) {
      toast.error('Full name is required');
      return;
    }
    if (!profileForm.email.trim()) {
      toast.error('Email is required');
      return;
    }
    updateProfileMutation.mutate(profileForm);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    changePasswordMutation.mutate();
  };

  const cancelEdit = () => {
    setIsEditing(false);
    if (profile) {
      setProfileForm({
        fullName: profile.fullName || '',
        email: profile.email || '',
        profileImageUrl: profile.profileImageUrl || '',
      });
    }
  };

  const initials = profile?.fullName
    ?.split(' ')
    .map((p: string) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';

  const inputCls = 'w-full px-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow';

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Your account information</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-blue-600 to-blue-400" />
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-12">
            {profile?.profileImageUrl ? (
              <img
                src={profile.profileImageUrl}
                alt={profile.fullName || 'Profile'}
                className="w-24 h-24 rounded-xl border-4 border-white dark:border-gray-800 object-cover shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 rounded-xl border-4 border-white dark:border-gray-800 bg-blue-600 flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold text-white">{initials}</span>
              </div>
            )}
            <div className="sm:mb-1">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{profile?.fullName || 'User'}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{profile?.email}</p>
            </div>
            <div className="sm:ml-auto sm:mb-1 flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                profile?.isActive
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${profile?.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                {profile?.isActive ? 'Active' : 'Inactive'}
              </span>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Form */}
      {isEditing && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-gray-400" />
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Edit Profile</h3>
              </div>
              <button onClick={cancelEdit} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <form onSubmit={handleUpdateProfile} className="p-6 space-y-5">
            <ImageUpload
              value={profileForm.profileImageUrl}
              onChange={(url) => setProfileForm(prev => ({ ...prev, profileImageUrl: url }))}
              onUpload={handleUploadImage}
              label="Profile Photo"
              hint="Upload a profile photo. Recommended size: 256x256px."
              previewSize="md"
              shape="circle"
              maxSizeMB={5}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
              <input
                type="text"
                value={profileForm.fullName}
                onChange={(e) => setProfileForm(prev => ({ ...prev, fullName: e.target.value }))}
                required
                className={inputCls}
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                required
                className={inputCls}
                placeholder="Enter your email"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
              >
                {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Details */}
      {!isEditing && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-gray-400" />
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Account Details</h3>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Full Name</span>
                <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{profile?.fullName || '-'}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Email</span>
                <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{profile?.email || '-'}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">User ID</span>
                <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{profile?.id || '-'}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</span>
                <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{profile?.isActive ? 'Active' : 'Inactive'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Roles */}
      {profile?.roles && profile.roles.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-gray-400" />
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Roles</h3>
            </div>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap gap-2">
              {profile.roles.map((role) => (
                <span
                  key={role}
                  className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm font-medium"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Change Password */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-gray-400" />
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Change Password</h3>
            </div>
            {!showChangePassword && (
              <button
                onClick={() => setShowChangePassword(true)}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Change Password
              </button>
            )}
          </div>
        </div>

        {showChangePassword && (
          <form onSubmit={handleChangePassword} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrentPw ? 'text' : 'password'}
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                  required
                  className={inputCls}
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw(!showCurrentPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">New Password</label>
              <div className="relative">
                <input
                  type={showNewPw ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  required
                  className={inputCls}
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Confirm New Password</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                required
                className={inputCls}
                placeholder="Confirm new password"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowChangePassword(false);
                  setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                }}
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={changePasswordMutation.isPending}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
              >
                {changePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
