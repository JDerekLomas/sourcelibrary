import React, { useEffect, useState } from 'react';
import { UserIcon, CheckBadgeIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

import Button from '../../components/ui/Buttons/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import { apiService } from '../../services/api';
import type { UserSummary, UserCreate, UserUpdate } from "../../types/user_interfaces";
import { ROLE_NAME, STATUS_OPTIONS, type RoleName, type EntityStatus } from "../../types/tenant_interfaces";
import DashboardButton from '../../components/ui/Buttons/DashboardButton';

const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add user form state
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<RoleName[]>([ROLE_NAME.USER]);
  const [userAddStatus, setUserAddStatus] = useState<string | null>(null);

  // Edit user state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<EntityStatus>(STATUS_OPTIONS.ACTIVE);
  const [editRoles, setEditRoles] = useState<RoleName[]>([]);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  // Delete user state
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [deleteConfirmUsername, setDeleteConfirmUsername] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = () => {
    setLoading(true);
    apiService.getAllUsers()
      .then(setUsers)
      .catch((err) => setError(err.message || 'Failed to fetch users'))
      .finally(() => setLoading(false));
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserAddStatus(null);
    try {
      const payload: UserCreate = {
        username: newUsername,
        email: newEmail,
        password: newPassword,
        display_name: newDisplayName || undefined,
        roles: selectedRoles,
      };
      await apiService.registerUser(payload);
      setUserAddStatus("User added successfully!");
      setNewUsername("");
      setNewEmail("");
      setNewPassword("");
      setNewDisplayName("");
      setSelectedRoles([ROLE_NAME.USER]);
      fetchUsers();
    } catch (err: any) {
      let errorMessage = "Unknown error";
      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.detail || err.message || "Unknown error";
      } else if (err.message) {
        errorMessage = err.message;
      }
      setUserAddStatus("Failed to add user: " + errorMessage);
    }
  };

  const toggleRole = (role: RoleName) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const startEdit = (user: UserSummary) => {
    setEditingUserId(user.id);
    setEditStatus(user.status);
    setEditRoles([...user.roles]);
    setEditError(null);
  };

  const cancelEdit = () => {
    setEditingUserId(null);
    setEditStatus(STATUS_OPTIONS.ACTIVE);
    setEditRoles([]);
    setEditError(null);
  };

  // Helper function to check if user is the last admin
  const isLastAdmin = (user: UserSummary): boolean => {
    const adminUsers = users.filter(u => u.roles.includes(ROLE_NAME.ADMIN));
    return adminUsers.length === 1 && user.roles.includes(ROLE_NAME.ADMIN);
  };

  const toggleEditRole = (role: RoleName, user: UserSummary) => {
    // Prevent removing admin role if this is the last admin
    if (role === ROLE_NAME.ADMIN && isLastAdmin(user) && editRoles.includes(ROLE_NAME.ADMIN)) {
      setEditError("Cannot remove admin role from the last administrator");
      return;
    }

    setEditRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
    setEditError(null);
  };

  const handleSaveEdit = async (userId: string) => {
    setEditError(null);
    if (editRoles.length === 0) {
      setEditError("User must have at least one role");
      return;
    }

    setEditSaving(true);
    try {
      const payload: UserUpdate = {
        status: editStatus,
        roles: editRoles,
      };
      await apiService.updateUser(userId, payload);
      setEditingUserId(null);
      fetchUsers();
    } catch (err: any) {
      let errorMessage = "Unknown error";
      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.detail || err.message || "Unknown error";
      } else if (err.message) {
        errorMessage = err.message;
      }
      setEditError("Failed to update user: " + errorMessage);
    } finally {
      setEditSaving(false);
    }
  };

  const startDelete = (user: UserSummary) => {
    if (isLastAdmin(user)) {
      return; // This shouldn't be called due to UI protection, but as safety measure
    }
    setDeletingUserId(user.id);
    setDeleteConfirmUsername("");
    setDeleteError(null);
  };

  const cancelDelete = () => {
    setDeletingUserId(null);
    setDeleteConfirmUsername("");
    setDeleteError(null);
  };

  const handleDelete = async (userId: string, username: string) => {
    if (deleteConfirmUsername !== username) {
      setDeleteError(`Please type "${username}" to confirm deletion`);
      return;
    }

    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await apiService.deleteUser(userId);
      setDeletingUserId(null);
      setDeleteConfirmUsername("");
      fetchUsers();
    } catch (err: any) {
      let errorMessage = "Unknown error";
      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.detail || err.message || "Unknown error";
      } else if (err.message) {
        errorMessage = err.message;
      }
      setDeleteError("Failed to delete user: " + errorMessage);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-white pb-16">
      <header className="border-b border-amber-200 bg-white/80 backdrop-blur-sm mb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-amber-100 border border-amber-200 flex-shrink-0 self-center">
                <UserIcon className="h-7 w-7 text-amber-700" />
              </div>
              <div>
                <h1 className="text-xl font-serif font-bold text-gray-900">User Management</h1>
                <p className="text-sm text-gray-600 font-serif">View all users and their roles</p>
              </div>
            </div>
            <DashboardButton />
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card padding="md">
          {loading ? (
            <div className="text-center py-8 text-lg font-serif text-gray-500">Loading users...</div>
          ) : error ? (
            <div className="text-center py-8 text-lg font-serif text-red-500">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-amber-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 font-serif">Username</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 font-serif">Display Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 font-serif">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 font-serif">Roles</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 font-serif">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {users.map(user => {
                    const isProtectedAdmin = isLastAdmin(user);
                    return (
                      <React.Fragment key={user.id}>
                        <tr className="hover:bg-amber-50 transition-colors">
                          <td className="px-4 py-3 align-top font-serif text-gray-900">
                            <div className="flex items-center gap-2">
                              <UserIcon className="h-4 w-4 text-gray-400" />
                              {user.username}
                            </div>
                          </td>
                          <td className="px-4 py-3 align-top font-serif text-gray-700">
                            {user.display_name || '-'}
                          </td>
                          <td className="px-4 py-3 align-top font-serif">
                            {editingUserId === user.id ? (
                              <select
                                value={editStatus}
                                onChange={(e) => setEditStatus(e.target.value as EntityStatus)}
                                disabled={isProtectedAdmin}
                                className={`text-xs px-2 py-1 border rounded capitalize ${isProtectedAdmin ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''
                                  }`}
                                title={isProtectedAdmin ? "Cannot change status of last administrator" : ""}
                              >
                                {Object.values(STATUS_OPTIONS).map((s) => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                            ) : (
                              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold capitalize ${user.status === STATUS_OPTIONS.ACTIVE ? 'bg-green-100 text-green-800' :
                                user.status === STATUS_OPTIONS.INACTIVE ? 'bg-gray-100 text-gray-800' :
                                  user.status === STATUS_OPTIONS.SUSPENDED ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'
                                }`}>
                                {user.status}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 align-top font-serif">
                            {editingUserId === user.id ? (
                              <div className="flex flex-wrap gap-1">
                                {Object.values(ROLE_NAME).map((role) => {
                                  const isAdminRole = role === ROLE_NAME.ADMIN;
                                  const isDisabled = isAdminRole && isProtectedAdmin;
                                  return (
                                    <label
                                      key={role}
                                      className={`inline-flex items-center space-x-1 text-xs px-2 py-1 rounded ${isDisabled
                                        ? 'bg-gray-200 cursor-not-allowed opacity-60'
                                        : 'bg-gray-100 cursor-pointer hover:bg-gray-200'
                                        }`}
                                      title={isDisabled ? "Cannot remove admin role from last administrator" : ""}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={editRoles.includes(role)}
                                        onChange={() => toggleEditRole(role, user)}
                                        disabled={isDisabled}
                                        className={`rounded w-3 h-3 ${isDisabled ? 'cursor-not-allowed' : ''}`}
                                      />
                                      <span className="capitalize">{role}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {user.roles.map(role => (
                                  <span key={role} className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold capitalize ${role === ROLE_NAME.ADMIN ? 'bg-purple-100 text-purple-800' :
                                    role === ROLE_NAME.EDITOR ? 'bg-blue-100 text-blue-800' :
                                      role === ROLE_NAME.USER ? 'bg-gray-100 text-gray-800' :
                                        'bg-amber-100 text-amber-800'
                                    }`}>
                                    {role === ROLE_NAME.ADMIN && <CheckBadgeIcon className="h-3 w-3 mr-1" />}
                                    {role}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 align-top">
                            {editingUserId === user.id ? (
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleSaveEdit(user.id)}
                                  disabled={editSaving}
                                  className="text-green-600 hover:text-green-800 disabled:text-gray-400 transition-colors"
                                  title="Save changes"
                                >
                                  <CheckBadgeIcon className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  disabled={editSaving}
                                  className="text-gray-600 hover:text-gray-800 disabled:text-gray-400 transition-colors"
                                  title="Cancel"
                                >
                                  <XMarkIcon className="h-5 w-5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => startEdit(user)}
                                  className="text-blue-600 hover:text-blue-800 transition-colors"
                                  title="Edit user"
                                >
                                  <PencilIcon className="h-5 w-5" />
                                </button>
                                {!isProtectedAdmin && (
                                  <button
                                    onClick={() => startDelete(user)}
                                    className="text-red-600 hover:text-red-800 transition-colors"
                                    title="Delete user"
                                  >
                                    <TrashIcon className="h-5 w-5" />
                                  </button>
                                )}
                                {isProtectedAdmin && (
                                  <div
                                    className="text-gray-300 cursor-not-allowed"
                                    title="Cannot delete the last administrator"
                                  >
                                    <TrashIcon className="h-5 w-5" />
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                        {editingUserId === user.id && editError && (
                          <tr>
                            <td colSpan={5} className="px-4 py-2">
                              <div className="text-red-600 text-sm bg-red-50 p-2 rounded">{editError}</div>
                            </td>
                          </tr>
                        )}
                        {deletingUserId === user.id && (
                          <tr>
                            <td colSpan={5} className="px-4 py-3 bg-red-50">
                              <div className="flex flex-col gap-2">
                                <p className="text-sm font-medium text-red-800">
                                  Are you sure you want to delete user "{user.username}"?
                                </p>
                                <p className="text-xs text-red-700">
                                  Type <strong>{user.username}</strong> to confirm:
                                </p>
                                <input
                                  type="text"
                                  value={deleteConfirmUsername}
                                  onChange={(e) => setDeleteConfirmUsername(e.target.value)}
                                  className="w-full max-w-xs px-2 py-1 text-sm border border-red-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                                  placeholder={user.username}
                                />
                                {deleteError && (
                                  <p className="text-xs text-red-600">{deleteError}</p>
                                )}
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleDelete(user.id, user.username)}
                                    disabled={deleteLoading}
                                    className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded transition-colors"
                                  >
                                    {deleteLoading ? 'Deleting...' : 'Delete'}
                                  </button>
                                  <button
                                    onClick={cancelDelete}
                                    disabled={deleteLoading}
                                    className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card padding="md" className="mt-8">
          <h2 className="text-lg font-serif font-bold mb-4 text-gray-900 border-b border-amber-100 pb-2 flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-amber-700" /> Add New User
          </h2>
          <form onSubmit={handleAddUser} className="flex flex-col gap-4 max-w-md mx-auto">
            <Input
              label="Username"
              type="text"
              placeholder="Enter username"
              value={newUsername}
              onChange={e => setNewUsername(e.target.value)}
              required
            />
            <Input
              label="Email"
              type="email"
              placeholder="Enter email"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              required
            />
            <Input
              label="Display Name"
              type="text"
              placeholder="Enter display name (optional)"
              value={newDisplayName}
              onChange={e => setNewDisplayName(e.target.value)}
            />
            <Input
              label="Password"
              type="password"
              placeholder="Enter password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Roles</label>
              <div className="flex flex-wrap gap-2">
                {Object.values(ROLE_NAME).map((role) => (
                  <label key={role} className="inline-flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedRoles.includes(role)}
                      onChange={() => toggleRole(role)}
                      className="rounded"
                    />
                    <span className="capitalize">{role}</span>
                  </label>
                ))}
              </div>
            </div>
            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
            >
              Add User
            </Button>
            {userAddStatus && (
              <div className={`mt-2 text-sm text-center ${userAddStatus.includes("successfully") ? "text-green-600" : "text-red-600"}`}>{userAddStatus}</div>
            )}
          </form>
        </Card>
      </main>
    </div>
  );
};

export default AdminUsersPage;