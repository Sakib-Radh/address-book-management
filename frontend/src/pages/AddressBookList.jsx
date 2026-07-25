import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus } from 'lucide-react';
import axiosInstance from '../lib/axios';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import useDebounced from '../hooks/useDebounced';
import DeleteConfirmationModal from '../components/common/DeleteConfirmationModal';
import AddressBookFilters from '../components/address-book/AddressBookFilters';
import AddressBookTable from '../components/address-book/AddressBookTable';
import Pagination from '../components/common/Pagination';
import Button from '../components/common/Button';

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

  const debouncedSearch = useDebounced(search, 300);
  const debouncedNationality = useDebounced(filters.nationality, 300);

  const [page, setPage] = useState(1);
  const [perPage] = useState(15);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchRecords = useCallback(async (signal) => {
    setIsLoading(true);
    try {
      const params = {
        page,
        per_page: perPage,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(filters.gender && { gender: filters.gender }),
        ...(debouncedNationality && { nationality: debouncedNationality }),
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
  }, [page, perPage, debouncedSearch, debouncedNationality, filters.gender, filters.age_min, filters.age_max, showToast]);

  const querySignature = JSON.stringify({
    search: debouncedSearch,
    gender: filters.gender,
    nationality: debouncedNationality,
    age_min: filters.age_min,
    age_max: filters.age_max,
  });

  const lastSignature = useRef(null);

  useEffect(() => {
    if (lastSignature.current !== null && lastSignature.current !== querySignature && page !== 1) {
      lastSignature.current = querySignature;
      setPage(1);
      return;
    }
    lastSignature.current = querySignature;

    const controller = new AbortController();
    fetchRecords(controller.signal);
    return () => controller.abort();
  }, [querySignature, page, fetchRecords]);

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
      
      if (!response.data.status) {
        throw new Error('Failed to delete entry.');
      }

      showToast('Entry deleted successfully.', 'success');
      setDeleteModalOpen(false);
      setRecordToDelete(null);

      records.length === 1 && page > 1 
        ? setPage(p => p - 1) 
        : fetchRecords();
        
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to delete entry.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Address Book</h2>
        <Button to="/address-book/create" icon={Plus}>
          Add New Entry
        </Button>
      </div>

      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-200 p-4 sm:p-6 space-y-4">
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
          startIndex={(page - 1) * perPage}
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
