import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TagIcon, PencilSquareIcon, TrashIcon, PlusIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import Button from '../../components/ui/Buttons/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { apiService } from '../../services/api';
import type { Category, Book } from '../../types';
import { usePaths } from '../../hooks/usePaths';
import DashboardButton from '../../components/ui/Buttons/DashboardButton';

const AdminCategoriesPage: React.FC = () => {
  const paths = usePaths();

  const [categories, setCategories] = useState<Category[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [form, setForm] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookDropdown, setBookDropdown] = useState<{ [bookId: string]: boolean }>({});
  const [bookSelectedCat, setBookSelectedCat] = useState<{ [bookId: string]: string }>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cats, bks] = await Promise.all([
        apiService.getAllCategories(),
        apiService.getAllBooks()
      ]);
      setCategories(cats);
      setBooks(bks);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setForm({ name: '', description: '' });
    setModalMode('add');
    setShowModal(true);
  };

  const openEditModal = (cat: Category) => {
    setForm({ name: cat.name, description: cat.description || '' });
    setSelectedCategory(cat);
    setModalMode('edit');
    setShowModal(true);
  };

  const handleModalSave = async () => {
    try {
      if (modalMode === 'add') {
        await apiService.createCategory(form);
      } else if (modalMode === 'edit' && selectedCategory) {
        await apiService.updateCategory(selectedCategory.id, form);
      }
      setShowModal(false);
      setSelectedCategory(null);
      fetchData();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save category');
    }
  };

  const handleDelete = async (cat: Category) => {
    if (!window.confirm(`Delete category "${cat.name}"?`)) return;
    try {
      await apiService.deleteCategory(cat.id);
      fetchData();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to delete category');
    }
  };

  const handleAssign = async (bookId: string, categoryId: string) => {
    try {
      await apiService.assignCategoryToBook(bookId, categoryId);
      fetchData();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to assign category');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-white">
      <header className="border-b border-amber-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-amber-100 border border-amber-200">
                <TagIcon className="h-6 w-6 text-amber-700" />
              </div>
              <div>
                <h1 className="text-xl font-serif font-bold text-gray-900">Category Management</h1>
                <p className="text-sm text-gray-600 font-serif">Manage categories and assign them to books</p>
              </div>
            </div>
            <DashboardButton />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        <Card padding="md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-serif font-bold text-gray-900 flex items-center"><TagIcon className="h-5 w-5 text-amber-700 mr-2" /> Categories</h2>
            <Button onClick={openAddModal} variant="primary" className="flex items-center"><PlusIcon className="h-5 w-5 mr-1" /> Add Category</Button>
          </div>
          {loading ? (
            <div className="text-center py-8 text-lg font-serif text-gray-500">Loading...</div>
          ) : error ? (
            <div className="text-center py-8 text-lg font-serif text-red-500">{error}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map(cat => (
                <Card key={cat.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <TagIcon className="h-5 w-5 text-amber-700" />
                      <span className="font-serif font-semibold text-gray-900">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditModal(cat)}><PencilSquareIcon className="h-4 w-4" /></Button>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(cat)}><TrashIcon className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  <div className="text-gray-600 text-sm font-serif">{cat.description}</div>
                </Card>
              ))}
            </div>
          )}
        </Card>

        {/* Books and Categories Section */}
        <Card padding="md">
          <h2 className="text-lg font-serif font-bold text-gray-900 mb-4 flex items-center"><BookOpenIcon className="h-5 w-5 text-amber-700 mr-2" /> Books with Categories</h2>
          {loading ? (
            <div className="text-center py-8 text-lg font-serif text-gray-500">Loading...</div>
          ) : error ? (
            <div className="text-center py-8 text-lg font-serif text-red-500">{error}</div>
          ) : (
            <div className="space-y-6">
              {books.map(book => {
                const bookCategories = categories.filter(cat => (book.categories || []).includes(cat.id));
                const availableCategories = categories.filter(cat => !(book.categories || []).includes(cat.id));
                return (
                  <Card key={book.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="font-serif font-semibold text-gray-900 text-base">
                        <Link to={paths.bookDetails(book.id)} style={{ color: 'inherit' }}>
                          {book.title}
                        </Link>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-serif text-gray-500">Categories:</span>
                        {bookCategories.map(cat => (
                          <span key={cat.id} className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-xs font-serif mr-1">{cat.name}</span>
                        ))}
                        <Button variant="ghost" size="sm" onClick={() => setBookDropdown(d => ({ ...d, [book.id]: !d[book.id] }))}><PlusIcon className="h-4 w-4" /></Button>
                        {bookDropdown[book.id] && (
                          <div className="absolute bg-white border rounded shadow p-2 mt-2 z-10">
                            <select
                              className="border rounded px-2 py-1 text-sm"
                              value={bookSelectedCat[book.id] || ''}
                              onChange={e => setBookSelectedCat(s => ({ ...s, [book.id]: e.target.value }))}
                            >
                              <option value="">Select category...</option>
                              {availableCategories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                              ))}
                            </select>
                            <Button
                              variant="primary"
                              size="sm"
                              className="ml-2"
                              onClick={async () => {
                                if (bookSelectedCat[book.id]) {
                                  await handleAssign(book.id, bookSelectedCat[book.id]);
                                  setBookSelectedCat(s => ({ ...s, [book.id]: '' }));
                                  setBookDropdown(d => ({ ...d, [book.id]: false }));
                                }
                              }}
                              disabled={!bookSelectedCat[book.id]}
                            >Add</Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </Card>

        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={modalMode === 'add' ? 'Add Category' : 'Edit Category'}
          message={
            <div className="space-y-4">
              <Input
                label="Name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
              />
              <Input
                label="Description"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
          }
          type="info"
          showCancel={true}
          confirmText={modalMode === 'add' ? 'Add' : 'Save'}
          cancelText="Cancel"
          onConfirm={handleModalSave}
          onCancel={() => setShowModal(false)}
        />
      </main>
    </div>
  );
};

export default AdminCategoriesPage; 