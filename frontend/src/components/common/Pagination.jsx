import React from 'react';

export default function Pagination({ meta, page, setPage, isLoading }) {
  if (isLoading || !meta || meta.last_page <= 1) return null;

  const getPageNumbers = () => {
    const totalPages = meta.last_page;
    const currentPage = page;
    const delta = 1;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }

    range.forEach(i => {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    });

    return rangeWithDots;
  };

  const goPrev = () => setPage(p => Math.max(1, p - 1));
  const goNext = () => setPage(p => Math.min(meta.last_page, p + 1));

  return (
    <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 sm:px-6 mt-4">
      <div className="flex flex-1 items-center justify-between sm:hidden">
        <button
          onClick={goPrev}
          disabled={page === 1}
          className="relative inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold text-slate-900 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 disabled:opacity-50"
        >
          Previous
        </button>
        <p className="text-sm text-slate-700">
          Page <span className="font-medium">{meta.current_page}</span> of <span className="font-medium">{meta.last_page}</span>
        </p>
        <button
          onClick={goNext}
          disabled={page === meta.last_page}
          className="relative inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold text-slate-900 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 disabled:opacity-50"
        >
          Next
        </button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-700">
            Showing <span className="font-medium">{(meta.current_page - 1) * meta.per_page + 1}</span> to <span className="font-medium">{Math.min(meta.current_page * meta.per_page, meta.total)}</span> of <span className="font-medium">{meta.total}</span> results
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            <button
              onClick={goPrev}
              disabled={page === 1}
              className="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
            >
              <span className="sr-only">Previous</span>
              &laquo;
            </button>
            {getPageNumbers().map((pageNum, idx) => {
              if (pageNum === '...') {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-300"
                  >
                    ...
                  </span>
                );
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  aria-current={page === pageNum ? 'page' : undefined}
                  aria-label={`Go to page ${pageNum}`}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 transition-colors ${
                    page === pageNum
                      ? 'z-10 bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 shadow-sm'
                      : 'text-slate-900 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:outline-offset-0'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={goNext}
              disabled={page === meta.last_page}
              className="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
            >
              <span className="sr-only">Next</span>
              &raquo;
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}
