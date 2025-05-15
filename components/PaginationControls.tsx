// src/components/PaginationControls.tsx
'use client';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export default function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  isLoading,
}: PaginationControlsProps) {
  if (totalPages <= 1) {
    return null; // Don't render pagination if there's only one page or less
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  // Simple page numbers logic: show current page, and a few around it.
  // For more complex logic (e.g., ellipsis for many pages), this can be expanded.
  const pageNumbers = [];
  const maxPagesToShow = 5; // Max number of page links to show (e.g., Prev 1 2 *3* 4 5 Next)
  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

  // Adjust startPage if endPage is at the limit and we can show more pages at the beginning
  if (endPage === totalPages && (endPage - startPage + 1) < maxPagesToShow) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }


  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <nav aria-label="Pagination" className="flex items-center justify-between mt-8 text-sm">
      <div className="flex-1 flex justify-start">
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1 || isLoading}
          className={`relative inline-flex items-center px-4 py-2 border border-gray-300 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          Previous
        </button>
      </div>

      <div className="hidden md:flex space-x-1">
        {startPage > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-md"
            >
              1
            </button>
            {startPage > 2 && <span className="px-4 py-2 text-gray-500">...</span>}
          </>
        )}

        {pageNumbers.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            disabled={isLoading}
            aria-current={page === currentPage ? 'page' : undefined}
            className={`px-4 py-2 border ${
              page === currentPage
                ? 'border-indigo-500 bg-indigo-50 text-indigo-600 z-10'
                : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
            } rounded-md`}
          >
            {page}
          </button>
        ))}

         {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-4 py-2 text-gray-500">...</span>}
            <button
              onClick={() => onPageChange(totalPages)}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-md"
            >
              {totalPages}
            </button>
          </>
        )}
      </div>
       <div className="md:hidden flex-1 flex justify-center text-gray-700">
         Page {currentPage} of {totalPages}
       </div>

      <div className="flex-1 flex justify-end">
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages || isLoading}
          className={`relative inline-flex items-center px-4 py-2 border border-gray-300 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          Next
        </button>
      </div>
    </nav>
  );
}