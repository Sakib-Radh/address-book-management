import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import axiosInstance from '../lib/axios';
import { useToast } from '../contexts/ToastContext';
import Loader from '../components/Loader';

export default function AddressBookForm() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    website: '',
    gender: '',
    age: '',
    nationality: ''
  });
  
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditMode);

  const fetchRecord = useCallback(async () => {
    if (!isEditMode) return;
    try {
      const response = await axiosInstance.get(`/address-books/${id}`);
      if (response.data.status) {
        const data = response.data.data;
        setFormData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          website: data.website || '',
          gender: data.gender || '',
          age: data.age || '',
          nationality: data.nationality || ''
        });
      }
    } catch (error) {
      showToast('Failed to load record.', 'error');
      navigate('/address-book');
    } finally {
      setIsLoading(false);
    }
  }, [id, isEditMode, navigate, showToast]);

  useEffect(() => {
    fetchRecord();
  }, [fetchRecord]);

  const validateForm = () => {
    const errors = {};
    let hasError = false;

    if (!formData.name.trim()) {
      errors.name = 'Name is required.';
      hasError = true;
    } else if (formData.name.length > 255) {
      errors.name = 'Name must not exceed 255 characters.';
      hasError = true;
    }

    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      errors.email = 'Please enter a valid email address.';
      hasError = true;
    }

    if (!formData.phone.match(/^\+?[0-9\s\-\(\)]{7,20}$/)) {
      errors.phone = 'The phone must be 7-20 characters and may contain digits, spaces, +, -, and parentheses.';
      hasError = true;
    }

    if (formData.website && !formData.website.match(/^(https?:\/\/)?[\w.-]+\.[a-z]{2,}/i)) {
      errors.website = 'Please enter a valid URL.';
      hasError = true;
    }

    if (!['male', 'female', 'other'].includes(formData.gender)) {
      errors.gender = 'Please select a valid gender.';
      hasError = true;
    }

    const ageInt = parseInt(formData.age, 10);
    if (!formData.age || isNaN(ageInt) || ageInt < 1 || ageInt > 150) {
      errors.age = 'Age must be an integer between 1 and 150.';
      hasError = true;
    }

    if (!formData.nationality.trim()) {
      errors.nationality = 'Nationality is required.';
      hasError = true;
    } else if (formData.nationality.length > 255) {
      errors.nationality = 'Nationality must not exceed 255 characters.';
      hasError = true;
    }

    if (hasError) {
      setFieldErrors(errors);
      return false;
    }
    return true;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      let formattedWebsite = formData.website;
      if (formattedWebsite && !/^https?:\/\//i.test(formattedWebsite)) {
        formattedWebsite = 'https://' + formattedWebsite;
      }

      const payload = {
        ...formData,
        website: formattedWebsite,
        age: parseInt(formData.age, 10)
      };

      let response;
      if (isEditMode) {
        response = await axiosInstance.put(`/address-books/${id}`, payload);
      } else {
        response = await axiosInstance.post('/address-books', payload);
      }

      if (response.data.status) {
        showToast(isEditMode ? 'Entry updated successfully!' : 'Entry created successfully!', 'success');
        navigate('/address-book');
      }
    } catch (error) {
      if (error.response?.status === 422 && error.response?.data?.errors) {
        const formattedErrors = {};
        Object.keys(error.response.data.errors).forEach(key => {
          formattedErrors[key] = error.response.data.errors[key][0];
        });
        setFieldErrors(formattedErrors);
      } else {
        showToast(error.response?.data?.message || 'Something went wrong.', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <Loader className="py-20" />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/address-book" className="p-2 -ml-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h2 className="text-2xl font-bold text-gray-900">
          {isEditMode ? 'Edit Entry' : 'Add New Entry'}
        </h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-900/5 p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border px-3 py-2 sm:text-sm focus:outline-none ${
                  fieldErrors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
              />
              {fieldErrors.name && <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border px-3 py-2 sm:text-sm focus:outline-none ${
                  fieldErrors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
              />
              {fieldErrors.email && <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number *</label>
              <input
                type="text"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+880"
                className={`mt-1 block w-full rounded-md border px-3 py-2 sm:text-sm focus:outline-none ${
                  fieldErrors.phone ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
              />
              {fieldErrors.phone && <p className="mt-1 text-sm text-red-600">{fieldErrors.phone}</p>}
            </div>

            <div className="md:col-span-2">
              <label htmlFor="website" className="block text-sm font-medium text-gray-700">Website</label>
              <input
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://example.com"
                className={`mt-1 block w-full rounded-md border px-3 py-2 sm:text-sm focus:outline-none ${
                  fieldErrors.website ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
              />
              {fieldErrors.website && <p className="mt-1 text-sm text-red-600">{fieldErrors.website}</p>}
            </div>

            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700">Gender *</label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border px-3 py-2 sm:text-sm focus:outline-none bg-white ${
                  fieldErrors.gender ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
              >
                <option value="" disabled>Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              {fieldErrors.gender && <p className="mt-1 text-sm text-red-600">{fieldErrors.gender}</p>}
            </div>

            <div>
              <label htmlFor="age" className="block text-sm font-medium text-gray-700">Age *</label>
              <input
                type="number"
                id="age"
                name="age"
                value={formData.age}
                onChange={handleChange}
                min="1"
                max="150"
                className={`mt-1 block w-full rounded-md border px-3 py-2 sm:text-sm focus:outline-none ${
                  fieldErrors.age ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
              />
              {fieldErrors.age && <p className="mt-1 text-sm text-red-600">{fieldErrors.age}</p>}
            </div>

            <div className="md:col-span-2">
              <label htmlFor="nationality" className="block text-sm font-medium text-gray-700">Nationality *</label>
              <input
                type="text"
                id="nationality"
                name="nationality"
                value={formData.nationality}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border px-3 py-2 sm:text-sm focus:outline-none ${
                  fieldErrors.nationality ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
              />
              {fieldErrors.nationality && <p className="mt-1 text-sm text-red-600">{fieldErrors.nationality}</p>}
            </div>
          </div>

          <div className="pt-5 flex justify-end gap-3 border-t border-gray-100">
            <Link
              to="/address-book"
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <Save className="-ml-1 mr-2 h-4 w-4" />
              {isSubmitting ? 'Saving...' : 'Save Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
