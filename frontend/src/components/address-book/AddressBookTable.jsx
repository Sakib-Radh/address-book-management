import React from 'react';
import { Link } from 'react-router-dom';
import { Edit2, Trash2 } from 'lucide-react';
import Loader from '../common/Loader';

export default function AddressBookTable({ records, isLoading, user, confirmDelete }) {
  return (
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
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">Actions</th>
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
  );
}
