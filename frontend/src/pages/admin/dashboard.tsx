import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Buttons/Button';
import Card from '../../components/ui/Card';
import Grid from '../../components/ui/Grid';
import { apiService } from '../../services/api';
import type { Request } from '../../types';
import HomeButton from '../../components/ui/Buttons/HomeButton';
import { usePaths } from '../../hooks/usePaths';
import {
  BookOpenIcon,
  DocumentTextIcon,
  UserIcon,
  EyeIcon,
  CheckCircleIcon,
  ClockIcon,
  TagIcon,
  BuildingLibraryIcon,
  Cog8ToothIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { ResourceType, ActionType } from '../../auth/RoleGuard';

const AdminHomePage: React.FC = () => {
  const navigate = useNavigate();
  const paths = usePaths();
  // auth check
  const { can } = useAuth() || {};

  const [stats, setStats] = useState({
    totalBooks: 0,
    totalArticles: 0,
    pendingRequests: 0,
    totalCategories: 0
  });

  const [recentRequests] = useState([
    { id: 1, type: 'Book Edit', title: 'Republic - Page 15', status: 'pending', date: '2024-01-15' },
    { id: 2, type: 'Translation', title: 'Principia Mathematica - Chapter 3', status: 'approved', date: '2024-01-14' },
    { id: 3, type: 'Article Edit', title: 'Stoicism and Modern Life', status: 'pending', date: '2024-01-13' },
  ]);

  useEffect(() => {
    Promise.all([
      apiService.getAllBooks(),
      apiService.getAllRequests()
    ])
      .then(([books, requests]) => {
        setStats(stats => ({
          ...stats,
          totalBooks: books.length,
          pendingRequests: requests.filter((r: Request) => r.status === 'pending').length
        }));
      })
      .catch(error => console.error('Error fetching dashboard data:', error));
  }, []);

  // build quick actions
  const quickActions = [
    { title: 'Add New Book', icon: <BookOpenIcon className="h-5 w-5" />, path: paths.addBook, color: 'bg-red-700 text-white' },
    { title: 'Manage Categories', icon: <TagIcon className="h-5 w-5" />, path: paths.admin.categories, color: 'bg-green-600 text-white' },
    { title: 'Review Requests', icon: <CheckCircleIcon className="h-5 w-5" />, path: paths.admin.requests, color: 'bg-pink-600 text-white' },
    { title: 'User Management', icon: <UserIcon className="h-5 w-5" />, path: paths.admin.users, color: 'bg-yellow-500 text-white' },
    { title: 'Settings', icon: <Cog8ToothIcon className="h-5 w-5" />, path: paths.admin.settings, color: 'bg-gray-500 text-white' },
    { title: 'Tenant Management', icon: <BuildingLibraryIcon className="h-5 w-5" />, path: paths.admin.tenants, color: 'bg-indigo-700 text-white' }
  ];

  const statCards = [
    {
      title: 'Total Books',
      value: stats.totalBooks,
      icon: <BookOpenIcon className="h-7 w-7 text-amber-700" />,
      color: 'text-amber-700'
    },
    {
      title: 'Total Articles',
      value: stats.totalArticles,
      icon: <DocumentTextIcon className="h-7 w-7 text-green-600" />,
      color: 'text-green-600'
    },
    {
      title: 'Pending Requests',
      value: stats.pendingRequests,
      icon: <ClockIcon className="h-7 w-7 text-yellow-500" />,
      color: 'text-yellow-500'
    },
    {
      title: 'Categories',
      value: stats.totalCategories,
      icon: <TagIcon className="h-7 w-7 text-purple-700" />,
      color: 'text-purple-700'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-white">
      {/* Header */}
      <header className="border-b border-amber-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-amber-100 border border-amber-200">
                <EyeIcon className="h-6 w-6 text-amber-700" />
              </div>
              <div>
                <h1 className="text-xl font-serif font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-600 font-serif">Manage content, users, and requests</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <HomeButton />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        {/* Statistics Cards */}
        <Grid cols={4} gap="md" className="mb-12">
          {statCards.map((stat) => (
            <Card key={stat.title} className="flex items-center space-x-4" padding="md">
              <div>{stat.icon}</div>
              <div>
                <div className={`text-2xl font-bold font-serif ${stat.color}`}>{stat.value}</div>
                <div className="text-gray-700 font-serif text-base">{stat.title}</div>
              </div>
            </Card>
          ))}
        </Grid>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions */}
          <Card className="" padding="md">
            <div className="flex items-center mb-4">
              <EyeIcon className="h-5 w-5 text-amber-700 mr-2" />
              <h2 className="text-lg font-serif font-bold text-gray-900">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quickActions.map((action) => {
                if (action.path === paths.admin.tenants && !can?.(ResourceType.TENANT, ActionType.DELETE))
                  return null;

                return (
                  <Button
                    key={action.title}
                    onClick={() => navigate(action.path)}
                    className={`w-full flex items-center justify-center space-x-2 py-4 text-base ${action.color}`}
                    variant="primary"
                  >
                    {action.icon}
                    <span>{action.title}</span>
                  </Button>
                );
              })}
            </div>
          </Card>

          {/* Recent Requests */}
          <Card className="" padding="md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-serif font-bold text-gray-900">Recent Edit Requests</h2>
              <Button variant="secondary" onClick={() => navigate(paths.admin.requests)} className="text-amber-700 font-serif font-medium px-2 py-1 text-sm">View All</Button>
            </div>
            <ul className="divide-y divide-gray-200">
              {recentRequests.map((item) => (
                <li key={item.id} className="py-3 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-serif font-semibold text-gray-900">{item.title}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                      {item.status}
                    </span>
                  </div>
                  <span className="text-gray-500 text-sm font-serif">{item.type} • {item.date}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Divider */}
        <div className="border-t border-amber-200 my-8" />

        {/* Management Sections */}
        <Grid cols={3} gap="md">
          <Card padding="md">
            <h3 className="text-lg font-serif font-bold text-gray-900 mb-2">Content Management</h3>
            <p className="text-gray-600 font-serif mb-4">Add, edit, and organize books and articles. Manage translations and content reviews.</p>
            <div className="flex flex-col gap-2">
              <Button variant="secondary" className="w-full">Manage Books</Button>
              <Button variant="secondary" className="w-full">Manage Articles</Button>
            </div>
          </Card>
          <Card padding="md">
            <h3 className="text-lg font-serif font-bold text-gray-900 mb-2">Category & Metadata</h3>
            <p className="text-gray-600 font-serif mb-4">Organize content with categories, tags, and metadata for better discoverability.</p>
            <div className="flex flex-col gap-2">
              <Button variant="secondary" onClick={() => navigate(paths.admin.categories)} className="w-full">Categories</Button>
              <Button variant="secondary" className="w-full">Metadata</Button>
            </div>
          </Card>
          <Card padding="md">
            <h3 className="text-lg font-serif font-bold text-gray-900 mb-2">User & Requests</h3>
            <p className="text-gray-600 font-serif mb-4">Manage user accounts and review content edit requests from the community.</p>
            <div className="flex flex-col gap-2">
              <Button variant="secondary" onClick={() => navigate(paths.admin.users)} className="w-full">Users</Button>
              <Button variant="secondary" onClick={() => navigate(paths.admin.requests)} className="w-full">Requests</Button>
            </div>
          </Card>
        </Grid>
      </main>
    </div>
  );
};

export default AdminHomePage;