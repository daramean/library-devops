import toast from 'react-hot-toast';

export const userToast = {
  success: (message) => {
    toast.success(message, {
      className: 'bg-green-50 text-green-900 border border-green-200 rounded-2xl shadow-lg',
      iconTheme: {
        primary: '#15803d',
        secondary: '#f0fdf4',
      },
      duration: 3000,
    });
  },
  error: (message) => {
    toast.error(message, {
      className: 'bg-red-50 text-red-900 border border-red-200 rounded-2xl shadow-lg',
      iconTheme: {
        primary: '#dc2626',
        secondary: '#fef2f2',
      },
      duration: 3000,
    });
  },
  loading: (message) => {
    return toast.loading(message, {
      className: 'bg-blue-50 text-blue-900 border border-blue-200 rounded-2xl shadow-lg',
    });
  },
  promise: (promise, messages) => {
    return toast.promise(promise, {
      loading: messages.loading || 'Loading...',
      success: messages.success || 'Success!',
      error: messages.error || 'Error!',
    }, {
      className: 'rounded-2xl shadow-lg border',
    });
  },
};
