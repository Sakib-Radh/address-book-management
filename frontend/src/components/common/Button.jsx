import React from 'react';
import { Link } from 'react-router-dom';

const variants = {
  primary: 'border-transparent bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700 focus:ring-indigo-500 shadow-md hover:shadow-lg',
  secondary: 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 focus:ring-indigo-500 shadow-sm',
  danger: 'border-transparent bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-700 hover:to-rose-700 focus:ring-red-500 shadow-md hover:shadow-lg',
  ghost: 'border-transparent bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-500 shadow-none',
};

export default function Button({ 
  children, 
  variant = 'primary', 
  isLoading = false, 
  icon: Icon,
  className = '', 
  disabled, 
  to,
  ...props 
}) {
  const baseStyle = 'inline-flex items-center justify-center rounded-xl border px-5 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98]';
  const combinedClassName = `${baseStyle} ${variants[variant]} ${className}`;

  const content = (
    <>
      {Icon && !isLoading && <Icon className="-ml-1 mr-2 h-4 w-4" aria-hidden="true" />}
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={combinedClassName} {...props}>
        {content}
      </Link>
    );
  }

  return (
    <button 
      className={combinedClassName}
      disabled={isLoading || disabled}
      {...props}
    >
      {content}
    </button>
  );
}
