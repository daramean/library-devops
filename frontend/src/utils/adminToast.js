import toast from 'react-hot-toast';

export const adminToast = {
  success: (message) => {
    toast.success(message, {
      className: 'bg-gradient-to-r from-brand-50 to-brand-100 text-brand-900 border border-brand-300 rounded-lg shadow-lg font-semibold',
      iconTheme: {
        primary: '#5B21B6',
        secondary: '#F3E8FF',
      },
      duration: 3000,
    });
  },
  error: (message) => {
    toast.error(message, {
      className: 'bg-gradient-to-r from-red-50 to-red-100 text-red-900 border border-red-300 rounded-lg shadow-lg font-semibold',
      iconTheme: {
        primary: '#DC2626',
        secondary: '#FEE2E2',
      },
      duration: 3000,
    });
  },
  loading: (message) => {
    return toast.loading(message, {
      className: 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-900 border border-blue-300 rounded-lg shadow-lg',
    });
  },
  promise: (promise, messages) => {
    return toast.promise(promise, {
      loading: messages.loading || 'Loading...',
      success: messages.success || 'Success!',
      error: messages.error || 'Error!',
    }, {
      className: 'rounded-lg shadow-lg border',
    });
  },
};
