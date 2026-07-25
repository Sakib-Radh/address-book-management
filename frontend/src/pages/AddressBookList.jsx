import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import axiosInstance from '../lib/axios';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import DeleteConfirmationModal from '../components/common/DeleteConfirmationModal';
import AddressBookFilters from '../components/address-book/AddressBookFilters';
import AddressBookTable from '../components/address-book/AddressBookTable';
import Pagination from '../components/common/Pagination';

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
        <AddressBookFilters
          search={search}
          setSearch={setSearch}
          filters={filters}
          handleFilterChange={handleFilterChange}
        />

        {/* Data Table */}
        <AddressBookTable
          records={records}
          isLoading={isLoading}
          user={user}
          confirmDelete={confirmDelete}
        />

        {/* Pagination */}
        <Pagination
          meta={meta}
          page={page}
          setPage={setPage}
          isLoading={isLoading}
        />
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
