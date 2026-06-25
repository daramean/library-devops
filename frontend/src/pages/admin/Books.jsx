import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Plus, Search, Download, Edit, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, normalizeCoverUrl } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

function BookModal({ book, categories, onClose, onSaved }) {
  const isEdit = !!book?.id;
  const defaults = {
    title: '', author: '', isbn: '', category_id: '',
    publisher: '', publish_year: '', total_copies: 1,
    location: '', description: '', cover_url: '', language: 'English',
    default_loan_days: book?.default_loan_days ?? '',
    ...(book || {}),
  };

  const titleRef = useRef(null);
  const authorRef = useRef(null);
  const isbnRef = useRef(null);
  const categoryRef = useRef(null);
  const publisherRef = useRef(null);
  const publishYearRef = useRef(null);
  const totalCopiesRef = useRef(null);
  const locationRef = useRef(null);
  const coverUrlRef = useRef(null);
  const languageRef = useRef(null);
  const descriptionRef = useRef(null);
  const defaultLoanRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({}); // Track field errors
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(normalizeCoverUrl(defaults.cover_url));

  useEffect(() => {
    setCoverPreview(normalizeCoverUrl(book?.cover_url || defaults.cover_url));
  }, [book]);

  useEffect(() => {
    return () => {
      if (coverPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(coverPreview);
      }
    };
  }, [coverPreview]);

  const getFormData = () => ({
    title: titleRef.current?.value || defaults.title || '',
    author: authorRef.current?.value || defaults.author || '',
    isbn: isbnRef.current?.value || defaults.isbn || '',
    category_id: categoryRef.current?.value || defaults.category_id || '',
    publisher: publisherRef.current?.value || defaults.publisher || '',
    publish_year: publishYearRef.current?.value || defaults.publish_year || '',
    total_copies: Number(totalCopiesRef.current?.value || defaults.total_copies || '1'),
    location: locationRef.current?.value || defaults.location || '',
    description: descriptionRef.current?.value || defaults.description || '',
    cover_url: coverUrlRef.current?.value || defaults.cover_url || '',
    language: languageRef.current?.value || defaults.language || 'English',
    default_loan_days: defaultLoanRef.current
      ? (defaultLoanRef.current.value ? Number(defaultLoanRef.current.value) : null)
      : defaults.default_loan_days || null,
  });

  const { addNotification } = useNotifications();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFieldErrors({}); // Clear previous errors
    const formData = getFormData();
    if (coverFile) {
      delete formData.cover_url;
    }
    try {
      let response;
      // If a file is selected, send multipart/form-data
      if (coverFile) {
        const fd = new FormData();
        Object.entries(formData).forEach(([k, v]) => { if (v !== undefined && v !== null) fd.append(k, v); });
        fd.append('cover', coverFile);
        if (isEdit) response = await api.put(`/books/${book.id}`, fd);
        else response = await api.post('/books', fd);
      } else {
        if (isEdit) response = await api.put(`/books/${book.id}`, formData);
        else response = await api.post('/books', formData);
      }

      if (isEdit) {
        toast.success('Book updated successfully');
        addNotification({
          title: 'Book updated',
          message: `${formData.title} was updated successfully.`,
        });
      } else {
        // Check if there are field-level errors
        if (response.data?.errors && Object.keys(response.data.errors).length > 0) {
          setFieldErrors(response.data.errors);
          toast.success('Book created with some field errors');
          addNotification({
            title: 'Book added (with warnings)',
            message: `${formData.title} has been added, but some fields had issues.`,
          });
          // Still close modal after successful save
          setTimeout(() => onSaved(), 2000);
          return;
        } else {
          toast.success('Book created successfully');
          addNotification({
            title: 'New book added',
            message: `${formData.title} by ${formData.author} has been added.`,
          });
        }
      }

      onSaved();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error saving book';
      toast.error(errorMsg);
      // Special handling for ISBN duplicates
      if (errorMsg.includes('ISBN')) {
        isbnRef.current?.focus();
      }
    } finally {
      setLoading(false);
    }
  };

  const F = ({ label, name, type = 'text', inputRef, defaultValue, ...props }) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
      <input
        ref={inputRef}
        name={name}
        type={type}
        className="input text-sm"
        placeholder={label}
        defaultValue={defaultValue}
        {...props}
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="font-display font-bold text-lg">{isEdit ? 'Edit Book' : 'Add Book'}</h2>
          <button onClick={onClose}><X size={20}/></button>
        </div>
        
        {/* Error Table - Show if there are field errors */}
        {Object.keys(fieldErrors).length > 0 && (
          <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
            <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-3">Field Errors</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-yellow-200 dark:border-yellow-800">
                    <th className="text-left py-2 px-3 font-semibold text-yellow-700 dark:text-yellow-300">Field</th>
                    <th className="text-left py-2 px-3 font-semibold text-yellow-700 dark:text-yellow-300">Issue</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(fieldErrors).map(([field, message]) => (
                    <tr key={field} className="border-b border-yellow-100 dark:border-yellow-800/50 hover:bg-yellow-100/50 dark:hover:bg-yellow-800/30">
                      <td className="py-2 px-3 font-medium text-yellow-700 dark:text-yellow-300 capitalize">{field}</td>
                      <td className="py-2 px-3 text-yellow-600 dark:text-yellow-400">{message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-3">✓ Book was saved successfully. Fields with errors were skipped.</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-2 gap-4">
          <div className="col-span-2"><F label="Title *" name="title" required inputRef={titleRef} defaultValue={defaults.title} /></div>
          <F label="Author *" name="author" required inputRef={authorRef} defaultValue={defaults.author} />
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              ISBN <span className="text-gray-400">(optional, must be unique)</span>
            </label>
            <input
              ref={isbnRef}
              name="isbn"
              type="text"
              className={`input text-sm ${fieldErrors.isbn ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' : ''}`}
              placeholder="ISBN"
              defaultValue={defaults.isbn}
            />
            {fieldErrors.isbn && <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">{fieldErrors.isbn}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Category</label>
            <select
              ref={categoryRef}
              name="category_id"
              className="input text-sm"
              defaultValue={defaults.category_id}>
              <option value="">Select category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <F label="Publisher" name="publisher" inputRef={publisherRef} defaultValue={defaults.publisher} />
          <F label="Publish Year" name="publish_year" type="number" inputRef={publishYearRef} defaultValue={defaults.publish_year} />
          <F label="Total Copies" name="total_copies" type="number" min="1" required inputRef={totalCopiesRef} defaultValue={defaults.total_copies} />
          <F label="Default loan days" name="default_loan_days" type="number" min="1" inputRef={defaultLoanRef} defaultValue={defaults.default_loan_days} />
          <F label="Location (shelf)" name="location" inputRef={locationRef} defaultValue={defaults.location} />
          <F label="Cover URL" name="cover_url" inputRef={coverUrlRef} defaultValue={defaults.cover_url} />
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Cover Image (PNG / JPG only)</label>
            <input name="cover" type="file" accept="image/png,image/jpeg" onChange={e => {
              const f = e.target.files?.[0] || null;
              if (f && !['image/png', 'image/jpeg', 'image/jpg', 'image/pjpeg'].includes(f.type)) {
                toast.error('Only PNG and JPG files are allowed');
                e.target.value = '';
                setCoverFile(null);
                setCoverPreview(normalizeCoverUrl(defaults.cover_url));
                return;
              }
              setCoverFile(f);
              if (f) setCoverPreview(URL.createObjectURL(f));
              else setCoverPreview(normalizeCoverUrl(defaults.cover_url));
            }} />
            {coverPreview && (
              <div className="mt-2">
                <img src={normalizeCoverUrl(coverPreview)} alt="cover preview" className="h-24 object-contain border" />
              </div>
            )}
          </div>
          <F label="Language" name="language" inputRef={languageRef} defaultValue={defaults.language} />
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Description</label>
            <textarea
              ref={descriptionRef}
              name="description"
              className="input text-sm resize-none"
              rows={3}
              placeholder="Description"
              defaultValue={defaults.description}
            />
          </div>
          <div className="col-span-2 flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Book'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminBooks() {
  const [books, setBooks]       = useState([]);
  const [cats, setCats]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [brokenCoverIds, setBrokenCoverIds] = useState({});
  const [search, setSearch]     = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [page, setPage]         = useState(1);
  const [pagination, setPagination] = useState({});
  const [modal, setModal]       = useState(null); // null | 'add' | book object

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, cRes] = await Promise.all([
        api.get('/books', { params: { search, category_id: catFilter, page, limit: 15 } }),
        api.get('/categories'),
      ]);
      setBooks(bRes.data.data);
      setPagination(bRes.data.pagination);
      setCats(cRes.data.data);
    } catch {}
    finally { setLoading(false); }
  }, [search, catFilter, page]);

  useEffect(() => { load(); }, [load]);

  const handleCoverError = useCallback((id) => {
    setBrokenCoverIds((prev) => ({ ...prev, [id]: true }));
  }, []);

  const { addNotification } = useNotifications();

  const handleDelete = async (id, title) => {
    if (!confirm(`Delete "${title}"?`)) return;
    try {
      await api.delete(`/books/${id}`);
      toast.success('Book deleted');
      addNotification({
        title: 'Book deleted',
        message: `${title} was removed from the library.`,
      });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting book');
    }
  };

  const exportCSV = async () => {
    try {
      const response = await api.get('/books/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'books.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to export books');
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Books</h1>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="btn-secondary"><Download size={16}/>Export</button>
          <button onClick={() => setModal('add')} className="btn-primary"><Plus size={16}/>Add Book</button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input className="input pl-9 text-sm" placeholder="Search title, author, ISBN…"
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="input text-sm w-44" value={catFilter}
          onChange={e => { setCatFilter(e.target.value); setPage(1); }}>
          <option value="">All categories</option>
          {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-800/50">
              <tr className="text-left text-xs text-gray-500">
                {['Cover','Title','Author','Category','ISBN','Copies','Available',''].map(h => (
                  <th key={h} className="px-4 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? [...Array(8)].map((_,i) => (
                <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="skeleton h-5 w-full"/></td></tr>
              )) : books.map(b => (
                <tr key={b.id} className="table-row">
                  <td className="px-4 py-3 max-w-[80px]">
                  {(() => {
                    const coverUrl = normalizeCoverUrl(b.cover_url);
                    const showImage = coverUrl && !brokenCoverIds[b.id];
                    return showImage ? (
                      <img
                        src={coverUrl}
                        alt={b.title}
                        className="h-12 w-12 rounded-md object-cover"
                        onError={() => handleCoverError(b.id)}
                      />
                    ) : (
                      <div className="h-12 w-12 bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center text-gray-400 text-xs">No cover</div>
                    );
                  })()}
                </td>
                <td className="px-4 py-3 font-medium max-w-[200px] truncate">{b.title}</td>
                  <td className="px-4 py-3 text-gray-500">{b.author}</td>
                  <td className="px-4 py-3">
                    {b.category_name && (
                      <span className="badge" style={{ background: b.category_color + '22', color: b.category_color }}>
                        {b.category_name}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{b.isbn || '—'}</td>
                  <td className="px-4 py-3">{b.total_copies}</td>
                  <td className="px-4 py-3">
                    <span className={`font-medium ${b.available_copies > 0 ? 'text-green-500' : 'text-red-400'}`}>
                      {b.available_copies}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => setModal(b)} className="text-gray-400 hover:text-brand-500 transition">
                        <Edit size={15}/>
                      </button>
                      <button onClick={() => handleDelete(b.id, b.title)} className="text-gray-400 hover:text-red-500 transition">
                        <Trash2 size={15}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-gray-500">
          <span>{pagination.total || 0} books total</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p-1)} className="btn-secondary py-1 px-3">Prev</button>
            <span className="px-3 py-1">{page} / {pagination.pages || 1}</span>
            <button disabled={page >= pagination.pages} onClick={() => setPage(p => p+1)} className="btn-secondary py-1 px-3">Next</button>
          </div>
        </div>
      </div>

      {modal && (
        <BookModal
          key={modal === 'add' ? 'add-book' : modal.id}
          book={modal === 'add' ? null : modal}
          categories={cats}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
}
