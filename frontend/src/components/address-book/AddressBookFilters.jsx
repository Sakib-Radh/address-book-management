import React from 'react';
import { Search, Filter } from 'lucide-react';

export default function AddressBookFilters({ search, setSearch, filters, handleFilterChange }) {
  return (
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
  );
}
