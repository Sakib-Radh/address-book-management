import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Edit2, Trash2, Filter } from 'lucide-react';
import axiosInstance from '../lib/axios';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import Loader from '../components/Loader';

export default function AddressBookList() {
  const [records, setRecords] = useState([]);
  const [meta, setMeta] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();
  const { user } = useAuth();

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    gender: '',
    nationality: '',
    age_min: '',
    age_max: ''
  });
  
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchRecords = useCallback(async (signal) => {
    setIsLoading(true);
    try {
      const params = {
        page,
        per_page: perPage,
        search,
        ...(filters.gender && { gender: filters.gender }),
        ...(filters.nationality && { nationality: filters.nationality }),
        ...(filters.age_min && { age_min: filters.age_min }),
        ...(filters.age_max && { age_max: filters.age_max }),
      };
      const response = await axiosInstance.get('/address-books', { params, signal });
      if (response.data.status) {
        setRecords(response.data.data);
        setMeta(response.data.meta);
        setIsLoading(false);
      }
    } catch (error) {
      if (error.name !== 'CanceledError' && error.message !== 'canceled') {
        showToast('Failed to fetch address book entries.', 'error');
        setIsLoading(false);
      }
    }
  }, [page, perPage, search, filters, showToast]);

  useEffect(() => {
    const controller = new AbortController();
    fetchRecords(controller.signal);
    return () => controller.abort();
  }, [fetchRecords]);

  // Reset page to 1 when search or filters change
  useEffect(() => {
    setPage(1);
  }, [search, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const confirmDelete = (record) => {
    setRecordToDelete(record);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!recordToDelete) return;
    setIsDeleting(true);
    try {
      const response = await axiosInstance.delete(`/address-books/${recordToDelete.id}`);
      if (response.data.status) {
        showToast('Entry deleted successfully.', 'success');
        setDeleteModalOpen(false);
        setRecordToDelete(null);
        fetchRecords();
      }
    } catch (error) {
      showToast('Failed to delete entry.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Address Book</h2>
        <Link
          to="/address-book/create"
          className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          Add New Entry
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm ring-1 ring-gray-900/5 p-4 sm:p-6 space-y-4">
        {/* Filters and Search Bar */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              name="search"
              id="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Search by name, email, or phone..."
            />
          </div>
          
          <div className="flex flex-wrap md:flex-nowrap gap-4 items-center">
            <div className="flex items-center gap-2 border border-gray-300 rounded-md px-3 py-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                name="gender"
                value={filters.gender}
                onChange={handleFilterChange}
                className="text-sm bg-transparent focus:outline-none text-gray-700"
              >
                <option value="">All Genders</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <input
              type="text"
              name="nationality"
              value={filters.nationality}
              onChange={handleFilterChange}
              placeholder="Nationality"
              className="block w-full md:w-32 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            
            <div className="flex items-center gap-2">
              <input
                type="number"
                name="age_min"
                value={filters.age_min}
                onChange={handleFilterChange}
                placeholder="Min Age"
                className="block w-full md:w-24 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-gray-500">-</span>
              <input
                type="number"
                name="age_max"
                value={filters.age_max}
                onChange={handleFilterChange}
                placeholder="Max Age"
                className="block w-full md:w-24 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="mt-4 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Name</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Contact</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Demographics</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 hidden md:table-cell">Website</th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {isLoading ? (
                      <tr>
                        <td colSpan="5" className="py-10 text-center">
                          <Loader />
                        </td>
                      </tr>
                    ) : records.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-10 text-center text-gray-500">
                          No address book entries found.
                        </td>
                      </tr>
                    ) : (
                      records.map((record) => (
                        <tr key={record.id}>
                          <td className="py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 break-words max-w-xs">
                            {record.name}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500 break-words max-w-xs">
                            <div>{record.email}</div>
                            <div className="text-gray-400">{record.phone}</div>
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500 capitalize break-words max-w-xs">
                            <div>{record.gender}, {record.age}</div>
                            <div className="text-gray-400">{record.nationality}</div>
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500 hidden md:table-cell break-words max-w-xs">
                            {record.website ? (
                              <a href={record.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                {record.website.replace(/^https?:\/\//, '')}
                              </a>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            {record.created_by === user?.id && (
                              <div className="flex justify-end gap-2">
                                <Link
                                  to={`/address-book/edit/${record.id}`}
                                  className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 p-1.5 rounded"
                                  title="Edit"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Link>
                                <button
                                  onClick={() => confirmDelete(record)}
                                  className="text-red-600 hover:text-red-900 bg-red-50 p-1.5 rounded"
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Pagination */}
        {!isLoading && meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6 mt-4">
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(meta.current_page - 1) * meta.per_page + 1}</span> to <span className="font-medium">{Math.min(meta.current_page * meta.per_page, meta.total)}</span> of <span className="font-medium">{meta.total}</span> results
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                  >
                    <span className="sr-only">Previous</span>
                    &laquo;
                  </button>
                  {[...Array(meta.last_page)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setPage(i + 1)}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 ${
                        page === i + 1
                          ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                          : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
                    disabled={page === meta.last_page}
                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                  >
                    <span className="sr-only">Next</span>
                    &raquo;
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
