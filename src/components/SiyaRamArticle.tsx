import React, { useState, useEffect, useCallback } from 'react';
import './SiyaRamArticle.css';

interface Image {
  id: number;
  path: string;
}

interface Article {
  id: number;
  article_number: string;
  created_at: string;
  images: Image[];
}

interface SiyaRamArticleProps {
  onLogout: () => void;
}

const SiyaRamArticle: React.FC<SiyaRamArticleProps> = ({ onLogout }) => {
  // Article states
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoadingList, setIsLoadingList] = useState<boolean>(false);
  const [listError, setListError] = useState<string | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [articleNumber, setArticleNumber] = useState<string>('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Edit and Delete states
  const [editMode, setEditMode] = useState<boolean>(false);
  const [editArticleId, setEditArticleId] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [deleteArticleId, setDeleteArticleId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Image viewer states
  const [isImageViewerOpen, setIsImageViewerOpen] = useState<boolean>(false);
  const [currentImages, setCurrentImages] = useState<Image[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [currentArticleNumber, setCurrentArticleNumber] = useState<string>('');

  // New modern features
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('darkMode') === 'true' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [copiedArticleId, setCopiedArticleId] = useState<number | null>(null);
  
  // View mode state
  const [isSmallView, setIsSmallView] = useState<boolean>(() => {
    return localStorage.getItem('viewMode') === 'small' || false;
  });
  
  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  
  // Header scroll state
  const [isScrolled, setIsScrolled] = useState<boolean>(false);

  useEffect(() => {
    fetchArticles();
  }, []);
  
  // Header scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Mobile menu toggle functionality
  useEffect(() => {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const navMenu = document.getElementById('nav-menu');
    
    const handleMobileMenuToggle = () => {
      setIsMobileMenuOpen(prevState => !prevState);
      if (navMenu) {
        if (isMobileMenuOpen) {
          navMenu.classList.add('hidden');
          navMenu.classList.remove('flex');
        } else {
          navMenu.classList.remove('hidden');
          navMenu.classList.add('flex');
        }
      }
    };
    
    if (mobileMenuButton) {
      mobileMenuButton.addEventListener('click', handleMobileMenuToggle);
    }
    
    // Handle resize to show menu on larger screens
    const handleResize = () => {
      if (window.innerWidth >= 640 && navMenu) { // 640px is the sm breakpoint in Tailwind
        navMenu.classList.remove('hidden');
        navMenu.classList.add('flex');
      } else if (window.innerWidth < 640 && navMenu && !isMobileMenuOpen) {
        navMenu.classList.add('hidden');
        navMenu.classList.remove('flex');
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      if (mobileMenuButton) {
        mobileMenuButton.removeEventListener('click', handleMobileMenuToggle);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [isMobileMenuOpen]);

  // Apply dark mode to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', isDarkMode.toString());
  }, [isDarkMode]);

  // Filter articles based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredArticles(articles);
    } else {
      const filtered = articles.filter(article =>
        article.article_number.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredArticles(filtered);
    }
  }, [searchQuery, articles]);

  const fetchArticles = async () => {
    setIsLoadingList(true);
    setListError(null);

    try {
      const response = await fetch('http://localhost:5000/api/articles');

      // Check content type to avoid JSON parse errors
      const contentType = response.headers.get('content-type');

      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Server returned non-JSON response: ${await response.text()}`);
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to fetch articles');
      }

      const data = await response.json();
      setArticles(data);
    } catch (err: any) {
      console.error('Fetch error:', err);
      if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
        setListError('Cannot connect to server. Please make sure the server is running at http://localhost:5000');
      } else if (err.message && err.message.includes('Server returned non-JSON response')) {
        setListError('Server error: Invalid response format. Please check server logs.');
      } else {
        setListError(err.message || 'Failed to load articles. Please try again.');
      }
    } finally {
      setIsLoadingList(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const openModal = (article?: Article) => {
    if (article) {
      // Edit mode
      setEditMode(true);
      setEditArticleId(article.id);
      setArticleNumber(article.article_number);
      setSelectedFiles([]);
    } else {
      // Add mode
      setEditMode(false);
      setEditArticleId(null);
      setArticleNumber('');
      setSelectedFiles([]);
    }
    setIsModalOpen(true);
    setUploadError(null);
    setUploadSuccess(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setArticleNumber('');
    setSelectedFiles([]);
    setUploadError(null);
    setUploadSuccess(null);
    setEditMode(false);
    setEditArticleId(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...filesArray]);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files) {
      const filesArray = Array.from(e.dataTransfer.files);
      const imageFiles = filesArray.filter(file => 
        file.type.startsWith('image/') || file.name.toLowerCase().endsWith('.heic')
      );

      if (imageFiles.length > 0) {
        setSelectedFiles(prev => [...prev, ...imageFiles]);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!articleNumber.trim()) {
      setUploadError('Please enter an article number');
      return;
    }

    if (!editMode && selectedFiles.length === 0) {
      setUploadError('Please select at least one image');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    const formData = new FormData();
    formData.append('articleNumber', articleNumber);

    selectedFiles.forEach(file => {
      formData.append('images', file);
    });

    try {
      let response;

      if (editMode) {
        // Update existing article
        response = await fetch(`http://localhost:5000/api/articles/${editArticleId}`, {
          method: 'PUT',
          body: formData,
        });
      } else {
        // Create new article
        response = await fetch('http://localhost:5000/api/articles', {
          method: 'POST',
          body: formData,
        });
      }

      // Check content type to avoid JSON parse errors
      const contentType = response.headers.get('content-type');

      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Server returned non-JSON response: ${await response.text()}`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload');
      }

      setUploadSuccess(editMode ? 'Article updated successfully!' : 'Article and images uploaded successfully!');
      setArticleNumber('');
      setSelectedFiles([]);
      fetchArticles(); // Refresh the article list after successful upload

      // Close modal after short delay to show success message
      setTimeout(() => {
        closeModal();
      }, 1500);
    } catch (err: any) {
      console.error('Upload error:', err);
      if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
        setUploadError('Cannot connect to server. Please make sure the server is running at http://localhost:5000');
      } else if (err.message && err.message.includes('Server returned non-JSON response')) {
        setUploadError('Server error: Invalid response format. Please check server logs.');
      } else {
        setUploadError(err.message || 'Failed to upload. Please try again.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFilePreview = (file: File) => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    // For HEIC files that might not have proper mime type
    if (file.name.toLowerCase().endsWith('.heic')) {
      // Return a placeholder for HEIC files
      return null;
    }
    return null;
  };

  const openDeleteModal = (articleId: number) => {
    setDeleteArticleId(articleId);
    setIsDeleteModalOpen(true);
    setDeleteError(null);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeleteArticleId(null);
    setDeleteError(null);
  };

  const handleDelete = async () => {
    if (!deleteArticleId) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch(`http://localhost:5000/api/articles/${deleteArticleId}`, {
        method: 'DELETE',
      });

      // Check content type to avoid JSON parse errors
      const contentType = response.headers.get('content-type');
      let data;

      if (!response.ok) {
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error(`Server returned non-JSON response: ${await response.text()}`);
        }
        data = await response.json();
        throw new Error(data.message || 'Failed to delete article');
      }

      // Remove the deleted article from the state
      setArticles(prev => prev.filter(article => article.id !== deleteArticleId));
      closeDeleteModal();
    } catch (err: any) {
      console.error('Delete error:', err);
      if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
        setDeleteError('Cannot connect to server. Please make sure the server is running at http://localhost:5000');
      } else if (err.message && err.message.includes('Server returned non-JSON response')) {
        setDeleteError('Server error: Invalid response format. Please check server logs.');
      } else {
        setDeleteError(err.message || 'Failed to delete article. Please try again.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const renderDeleteModal = () => {
    if (!isDeleteModalOpen) return null;

    const article = articles.find(a => a.id === deleteArticleId);
    if (!article) return null;

    return (
      <div className="fixed z-50 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity backdrop-blur-sm" aria-hidden="true" onClick={closeDeleteModal}></div>

          {/* Modal panel */}
          <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-100 dark:border-gray-700 animate-fadeIn">
            <div className="bg-white dark:bg-gray-800 px-6 pt-6 pb-5">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-14 w-14 rounded-full bg-red-100 dark:bg-red-900/30 sm:mx-0 sm:h-12 sm:w-12 shadow-lg">
                  <svg className="h-7 w-7 text-red-600 dark:text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-5 sm:text-left">
                  <h3 className="text-xl leading-6 font-bold text-gray-900 dark:text-white" id="modal-title">
                    Delete Article
                  </h3>
                  <div className="mt-3">
                    {deleteError && (
                      <div className="mb-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-4 rounded-r-md">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400 dark:text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-red-700 dark:text-red-400">{deleteError}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <p className="text-base text-gray-600 dark:text-gray-300">
                      Are you sure you want to delete Article #{" "}
                      <span className="font-semibold text-gray-900 dark:text-white">{article.article_number}</span>?
                      <br className="hidden sm:block" /> This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900/30 px-6 py-5 sm:flex sm:flex-row-reverse gap-3">
              <button
                type="button"
                className="w-full inline-flex justify-center rounded-full border border-transparent shadow-lg px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-500 text-base font-medium text-white hover:from-red-700 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm transition-all duration-200"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Deleting...</span>
                  </div>
                ) : (
                  'Delete'
                )}
              </button>
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-full border border-gray-200 dark:border-gray-600 shadow-md px-5 py-2.5 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm transition-all duration-200"
                onClick={closeDeleteModal}
                disabled={isDeleting}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderArticleModal = () => {
    if (!isModalOpen) return null;

    return (
      <div className="fixed inset-0 overflow-y-auto z-50" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-60 transition-opacity backdrop-blur-lg" aria-hidden="true" onClick={closeModal}></div>

          {/* Modal panel */}
          <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-100 dark:border-gray-700 animate-fadeIn">
            <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 px-6 pt-6 pb-5">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="text-2xl leading-6 font-bold text-gray-900 dark:text-white" id="modal-title">
                  {editMode ? 'Edit Article' : 'Add New Article'}
                </h3>
                <button
                  type="button"
                  className="bg-white dark:bg-gray-700 rounded-full p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 transform hover:rotate-90"
                  onClick={closeModal}
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mt-5">
                {uploadError && (
                  <div className="mb-5 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-4 rounded-r-lg animate-fadeIn">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400 dark:text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-700 dark:text-red-300">{uploadError}</p>
                        {uploadError.includes('Cannot connect to server') && (
                          <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                            <p className="font-medium">To start the server:</p>
                            <ol className="mt-1 list-decimal list-inside">
                              <li>Open a terminal in the project root</li>
                              <li>Run <code className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/40 rounded font-mono">node server.js</code></li>
                            </ol>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {uploadSuccess && (
                  <div className="mb-5 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-400 p-4 rounded-r-lg animate-fadeIn">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-green-700 dark:text-green-300">{uploadSuccess}</p>
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="mb-5">
                    <label htmlFor="articleNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Article Number</label>
                    <input
                      type="text"
                      id="articleNumber"
                      value={articleNumber}
                      onChange={(e) => setArticleNumber(e.target.value)}
                      placeholder="Enter article number"
                      disabled={isUploading}
                      required
                      className="w-full px-4 py-2.5 rounded-xl shadow-sm border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors duration-200"
                    />
                  </div>

                  <div
                    className={`mt-5 flex justify-center px-6 pt-5 pb-6 border-2 ${isDragging ? 'border-indigo-300 bg-indigo-50 dark:border-indigo-600 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700 border-dashed'} rounded-xl transition-all duration-200 hover:border-indigo-300 dark:hover:border-indigo-600`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <div className="space-y-2 text-center">
                      <svg className="mx-auto h-14 w-14 text-gray-400 dark:text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="flex text-sm text-gray-600 dark:text-gray-400 justify-center">
                        <label htmlFor="images" className="relative cursor-pointer bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-lg font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500 transition-all duration-200 px-3 py-2">
                          <span>{editMode ? 'Upload new images' : 'Upload images'}</span>
                          <input
                            id="images"
                            type="file"
                            accept="image/*,.heic"
                            multiple
                            onChange={handleFileChange}
                            disabled={isUploading}
                            className="sr-only"
                          />
                        </label>
                        <p className="pl-2 self-center">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, GIF, HEIC up to 10MB</p>
                      {editMode && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-medium">
                          Note: Uploading new images will replace all existing images for this article.
                        </p>
                      )}
                    </div>
                  </div>

                  {selectedFiles.length > 0 && (
                    <div className="mt-5">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Selected Images</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {selectedFiles.map((file, index) => {
                          const preview = getFilePreview(file);
                          return (
                            <div key={index} className="relative group">
                              <div className="aspect-w-1 aspect-h-1 rounded-xl bg-gray-100 dark:bg-gray-700 overflow-hidden shadow-md transition-transform duration-200 hover:scale-105 group-hover:shadow-lg">
                                {preview ? (
                                  <img src={preview} alt={file.name} className="object-cover" />
                                ) : (
                                  <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                                    {file.name.toLowerCase().endsWith('.heic') ? (
                                      <div className="flex flex-col items-center">
                                        <svg className="h-10 w-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span className="text-xs mt-1">HEIC</span>
                                      </div>
                                    ) : (
                                      <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                      </svg>
                                    )}
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeFile(index)}
                                disabled={isUploading}
                                className="absolute -top-2 -right-2 bg-red-100 dark:bg-red-900/70 rounded-full p-1.5 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800 focus:outline-none shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                              >
                                <span className="sr-only">Remove file</span>
                                <svg className="h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 truncate">{file.name}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="mt-6 sm:grid sm:grid-cols-2 sm:gap-4 sm:grid-flow-row-dense">
                    <button
                      type="submit"
                      disabled={isUploading}
                      className="w-full inline-flex justify-center rounded-full border border-transparent shadow-xl px-5 py-3 bg-gradient-to-r from-violet-600 to-blue-600 text-base font-medium text-white hover:from-violet-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm transition-all duration-200 transform hover:translate-y-[-2px] active:translate-y-0"
                    >
                      {isUploading ? (
                        <div className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>{editMode ? 'Updating...' : 'Saving...'}</span>
                        </div>
                      ) : (
                        editMode ? 'Update Article' : 'Save Article'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={closeModal}
                      disabled={isUploading}
                      className="mt-3 w-full inline-flex justify-center rounded-full border border-gray-200 dark:border-gray-600 shadow-md px-5 py-3 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm transition-all duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Image Viewer functions
  const openImageViewer = (article: Article, imageIndex: number = 0) => {
    setCurrentImages(article.images);
    setCurrentImageIndex(imageIndex);
    setCurrentArticleNumber(article.article_number);
    setIsImageViewerOpen(true);
    // Prevent body scrolling when viewer is open
    document.body.style.overflow = 'hidden';
  };

  const closeImageViewer = () => {
    setIsImageViewerOpen(false);
    setCurrentImages([]);
    setCurrentImageIndex(0);
    setCurrentArticleNumber('');
    // Restore body scrolling
    document.body.style.overflow = '';
  };

  const goToNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentImageIndex < currentImages.length - 1) {
      setCurrentImageIndex(prevIndex => prevIndex + 1);
    }
  };

  const goToPrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentImageIndex > 0) {
      setCurrentImageIndex(prevIndex => prevIndex - 1);
    }
  };

  // Handle keyboard navigation for image viewer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isImageViewerOpen) return;

      switch (e.key) {
        case 'ArrowRight':
          if (currentImageIndex < currentImages.length - 1) {
            setCurrentImageIndex(prevIndex => prevIndex + 1);
          }
          break;
        case 'ArrowLeft':
          if (currentImageIndex > 0) {
            setCurrentImageIndex(prevIndex => prevIndex - 1);
          }
          break;
        case 'Escape':
          closeImageViewer();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isImageViewerOpen, currentImageIndex, currentImages.length]);

  const renderImageViewer = () => {
    if (!isImageViewerOpen || currentImages.length === 0) return null;

    const currentImage = currentImages[currentImageIndex];

    return (
      <div
        className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center"
        onClick={closeImageViewer}
      >
        {/* Close button */}
        <button
          className="absolute top-4 right-4 text-white p-2 rounded-full bg-black/20 hover:bg-black/40 transition-colors z-[110]"
          onClick={closeImageViewer}
          aria-label="Close image viewer"
        >
          <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Image title */}
        <div className="absolute top-4 left-4 text-white">
          <h3 className="text-xl font-medium">
            Article #{currentArticleNumber} - Image {currentImageIndex + 1} of {currentImages.length}
          </h3>
        </div>

        {/* Previous button */}
        {currentImageIndex > 0 && (
          <button
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white p-3 rounded-full bg-black/20 hover:bg-black/40 transition-colors z-[110]"
            onClick={goToPrevImage}
            aria-label="Previous image"
          >
            <svg className="h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Next button */}
        {currentImageIndex < currentImages.length - 1 && (
          <button
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white p-3 rounded-full bg-black/20 hover:bg-black/40 transition-colors z-[110]"
            onClick={goToNextImage}
            aria-label="Next image"
          >
            <svg className="h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* Main image */}
        <div className="max-w-[90vw] max-h-[85vh] relative" onClick={e => e.stopPropagation()}>
          <img
            src={`http://localhost:5000/${currentImage.path}`}
            alt={`Article ${currentArticleNumber} image ${currentImageIndex + 1}`}
            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl animate-fadeIn"
          />

          {/* Thumbnails */}
          {currentImages.length > 1 && (
            <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 flex space-x-2 bg-black/30 p-2 rounded-xl overflow-auto max-w-[90vw]">
              {currentImages.map((image, index) => (
                <button
                  key={image.id}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${index === currentImageIndex
                    ? 'border-violet-500 scale-110 shadow-lg shadow-violet-500/20'
                    : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(index);
                  }}
                >
                  <img
                    src={`http://localhost:5000/${image.path}`}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Add new function to toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  const copyToClipboard = (text: string, articleId: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedArticleId(articleId);
      setTimeout(() => setCopiedArticleId(null), 1500);
    });
  };

  // Function to download all images of an article
  const downloadAllImages = async (article: Article) => {
    if (!article.images || article.images.length === 0) {
      alert('No images available to download');
      return;
    }
    
    try {
      // Show loading indicator or notification if you want
      
      // Download images sequentially
      for (let i = 0; i < article.images.length; i++) {
        const image = article.images[i];
        const imageUrl = `http://localhost:5000/${image.path}`;
        
        // Fetch the image as a blob
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        
        // Create a blob URL
        const blobUrl = window.URL.createObjectURL(blob);
        
        // Create a link element
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `article-${article.article_number}-image-${i+1}.jpg`;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up by revoking the blob URL
        window.URL.revokeObjectURL(blobUrl);
        
        // Add a small delay between downloads
        if (i < article.images.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
    } catch (error) {
      console.error('Error downloading images:', error);
      alert('Failed to download images. Please try again.');
    }
  };

  // Add new function to toggle view mode
  const toggleViewMode = () => {
    const newViewMode = !isSmallView;
    setIsSmallView(newViewMode);
    localStorage.setItem('viewMode', newViewMode ? 'small' : 'large');
  };

  const renderArticleList = () => {
    if (isLoadingList) {
      return (
        <div className="flex flex-col justify-center items-center py-20">
          <div className="relative w-24 h-24">
            <div className="absolute top-0 left-0 w-full h-full border-4 border-gray-200 dark:border-gray-700 rounded-full"></div>
            <div className="absolute top-0 left-0 w-full h-full border-4 border-violet-600 dark:border-violet-500 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <div className="mt-8 text-lg font-medium text-gray-600 dark:text-gray-300 relative">
            <span className="relative inline-block">
              Loading your articles...
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-violet-600 to-blue-600 rounded animate-pulse"></div>
            </span>
          </div>
        </div>
      );
    }

    if (listError) {
      return (
        <div className="bg-white dark:bg-gray-800 shadow-2xl rounded-2xl p-8 text-center border border-gray-100 dark:border-gray-700 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-full shadow-lg">
              <svg className="h-14 w-14 text-red-400 dark:text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <div className="text-xl font-medium text-red-600 dark:text-red-400 mb-4">{listError}</div>
          {listError.includes('Cannot connect to server') && (
            <div className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-xl text-sm mb-6 max-w-md mx-auto border border-gray-200 dark:border-gray-700">
              <p className="font-medium text-gray-800 dark:text-gray-200 mb-3">To start the server:</p>
              <ol className="list-decimal list-inside text-gray-600 dark:text-gray-400 space-y-2">
                <li>Open a terminal in the project root</li>
                <li>Run <code className="bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded font-mono text-sm">node server.js</code></li>
              </ol>
            </div>
          )}
          <button
            onClick={fetchArticles}
            className="mt-4 inline-flex items-center px-6 py-3 border border-transparent rounded-full shadow-lg text-base font-medium text-white bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 transform hover:scale-105"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
            </svg>
            Try Again
          </button>
        </div>
      );
    }

    if (articles.length === 0 && !searchQuery) {
      return (
        <div className="bg-white dark:bg-gray-800 shadow-2xl rounded-2xl p-12 text-center border border-gray-100 dark:border-gray-700 backdrop-blur-sm bg-white/80 dark:bg-gray-800/80">
          <div className="flex justify-center mb-8">
            <div className="p-6 bg-indigo-50 dark:bg-indigo-900/30 rounded-full shadow-lg">
              <svg className="h-16 w-16 text-indigo-400 dark:text-indigo-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="9" y1="9" x2="15" y2="9"></line>
                <line x1="9" y1="13" x2="15" y2="13"></line>
                <line x1="9" y1="17" x2="13" y2="17"></line>
              </svg>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">No Articles Yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-10 max-w-md mx-auto text-lg">It looks like you haven't added any articles yet. Click the button below to get started.</p>
          <button
            onClick={() => openModal()}
            className="inline-flex items-center px-6 py-3 border border-transparent rounded-full shadow-lg text-base font-medium text-white bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 transform hover:scale-105"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add Your First Article
          </button>
        </div>
      );
    }

    // Use filtered articles when search is active, otherwise use all articles
    const displayedArticles = searchQuery ? filteredArticles : articles;

    return (
      <div className={`grid gap-4 ${isSmallView 
        ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5' 
        : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
        {displayedArticles.map(article => (
          <div key={article.id} className={`group bg-white dark:bg-gray-800 overflow-hidden ${isSmallView 
            ? 'shadow-md rounded-xl border border-gray-100 dark:border-gray-700 hover:shadow-lg' 
            : 'shadow-xl rounded-2xl border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2'} 
            backdrop-blur-sm bg-white/90 dark:bg-gray-800/90`}>
            <div className={`${isSmallView 
              ? 'px-3 py-2 border-b border-gray-100 dark:border-gray-700' 
              : 'px-6 py-5 sm:px-8 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-750'}`}>
              <h3 className={`${isSmallView ? 'text-sm' : 'text-xl'} font-bold text-gray-900 dark:text-white flex items-center`}>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-blue-600 dark:from-violet-400 dark:to-blue-400">
                  #{article.article_number}
                </span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(article.article_number, article.id);
                  }}
                  className={`ml-2 p-1 rounded-md text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
                  title="Copy article number"
                >
                  {copiedArticleId === article.id ? (
                    <svg className={`${isSmallView ? 'h-3 w-3' : 'h-4 w-4'} text-green-500`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className={`${isSmallView ? 'h-3 w-3' : 'h-4 w-4'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  )}
                </button>
              </h3>
              {!isSmallView && (
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {formatDate(article.created_at)}
                </p>
              )}
            </div>

            <div className={`${isSmallView ? 'p-2' : 'p-6 sm:p-8'}`}>
              {article.images && article.images.length > 0 ? (
                <div className={`grid ${isSmallView ? 'grid-cols-2 gap-1' : 'grid-cols-2 gap-4'}`}>
                  {article.images.slice(0, isSmallView ? 4 : article.images.length).map((image, index) => (
                    <div
                      key={index}
                      className={`relative ${isSmallView ? 'h-16' : 'h-36'} bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden shadow-md transition-transform duration-200 hover:scale-105 group-hover:shadow-lg cursor-pointer`}
                      onClick={() => openImageViewer(article, index)}
                    >
                      <img
                        src={`http://localhost:5000/${image.path}`}
                        alt={`Image ${index + 1} for Article ${article.article_number}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                        <div className={`bg-white/20 backdrop-blur-sm ${isSmallView ? 'p-1' : 'p-2'} rounded-full transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300`}>
                          <svg className={`${isSmallView ? 'h-3 w-3' : 'h-5 w-5'} text-white`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ))}
                  {isSmallView && article.images.length > 4 && (
                    <div 
                      className="relative h-16 bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden shadow-md flex items-center justify-center cursor-pointer"
                      onClick={() => openImageViewer(article, 4)}
                    >
                      <div className="text-gray-500 dark:text-gray-300 font-medium text-sm">
                        +{article.images.length - 4}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className={`text-center ${isSmallView ? 'py-2 px-2' : 'py-10 px-6'}`}>
                  <div className={`inline-block ${isSmallView ? 'p-1' : 'p-3'} bg-gray-100 dark:bg-gray-700 rounded-full mb-1`}>
                    <svg className={`${isSmallView ? 'h-3 w-3' : 'h-6 w-6'} text-gray-400 dark:text-gray-500`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className={`${isSmallView ? 'text-xs' : 'text-sm'} text-gray-500 dark:text-gray-400 italic`}>No images</p>
                </div>
              )}
            </div>

            <div className={`border-t border-gray-100 dark:border-gray-700 ${isSmallView ? 'px-2 py-2' : 'px-6 py-4 sm:px-8'} flex ${isSmallView ? 'space-x-1' : 'space-x-3'} justify-end bg-gray-50 dark:bg-gray-800/50`}>
              <button
                className={`inline-flex items-center ${isSmallView ? 'px-2 py-1 text-xs' : 'px-4 py-2 text-sm'} border border-gray-200 dark:border-gray-700 shadow-md font-medium rounded-full text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200`}
                onClick={() => openModal(article)}
                aria-label="Edit article"
              >
                <svg className={`${isSmallView ? 'h-3 w-3' : 'h-4 w-4'} ${isSmallView ? '' : 'mr-1.5'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {!isSmallView && "Edit"}
              </button>
              {/* Download button */}
              {article.images && article.images.length > 0 && (
                <button
                  type="button"
                  onClick={() => downloadAllImages(article)}
                  className={`inline-flex items-center ${isSmallView ? 'px-2 py-1 text-xs' : 'px-4 py-2 text-sm'} border border-blue-200 dark:border-blue-700 shadow-md font-medium rounded-full text-blue-700 dark:text-blue-300 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200`}
                  aria-label="Download images"
                >
                  <svg className={`${isSmallView ? 'h-3 w-3' : 'h-4 w-4'} ${isSmallView ? '' : 'mr-1.5'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  {!isSmallView && "Download"}
                </button>
              )}
              <button
                className={`inline-flex items-center ${isSmallView ? 'px-2 py-1 text-xs' : 'px-4 py-2 text-sm'} border border-red-100 dark:border-red-900/30 shadow-md font-medium rounded-full text-red-700 dark:text-red-400 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200`}
                onClick={() => openDeleteModal(article.id)}
                aria-label="Delete article"
              >
                <svg className={`${isSmallView ? 'h-3 w-3' : 'h-4 w-4'} ${isSmallView ? '' : 'mr-1.5'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {!isSmallView && "Delete"}
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-slate-900 transition-colors duration-300">
      <header className={`sticky top-0 z-40 bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 shadow-lg py-6 px-4 sm:px-6 relative overflow-hidden transition-all duration-300 ${isScrolled ? 'py-3 shadow-2xl' : 'py-6'}`}>
        <div className="absolute inset-0 bg-grid-white/[0.1] bg-[length:20px_20px]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-transparent"></div>
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center relative z-10">
          <div className="flex items-center space-x-4 w-full sm:w-auto justify-between sm:justify-start mb-4 sm:mb-0">
            <div className="bg-white/20 backdrop-blur-md p-2 rounded-xl shadow-xl">
              <img src="/siyaram-lace.png" alt="SiyaRam Logo" className="h-10 sm:h-12 w-auto rounded-lg" />
            </div>
            <div className="block sm:hidden">
              <button id="mobile-menu-button" className="text-white p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              </button>
            </div>
          </div>

          <div id="nav-menu" className="hidden sm:flex w-full sm:w-auto items-center space-x-2 sm:space-x-4 flex-wrap sm:flex-nowrap">
            {/* Search Bar */}
            <div className="relative w-full sm:w-auto mb-3 sm:mb-0 order-3 sm:order-none">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-auto bg-white/10 backdrop-blur-md border border-white/20 rounded-full py-2 pl-10 pr-4 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/70 hover:text-white"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* View toggle button */}
            <button
              className="inline-flex items-center px-3 py-2 border border-gray-200 dark:border-gray-700 shadow-lg text-sm font-medium rounded-full text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
              onClick={toggleViewMode}
              title={isSmallView ? "Switch to large view" : "Switch to compact view"}
            >
              {isSmallView ? (
                <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              ) : (
                <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              )}
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="inline-flex items-center justify-center p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/30"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            <button
              className="inline-flex items-center px-4 py-2 sm:px-5 sm:py-2.5 border border-white/20 rounded-full shadow-xl text-sm font-medium text-white bg-white/10 hover:bg-white/20 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/50 transition-all duration-200 transform hover:scale-105"
              onClick={() => openModal()}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span className="hidden xs:inline">Add Article</span>
            </button>
            
            <button
              onClick={onLogout}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-3 sm:px-4 rounded-lg transition duration-300"
              aria-label="Logout"
            >
              <span className="hidden xs:inline">Logout</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 xs:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white tracking-tight">Your Articles</h2>
          </div>
          <div className="flex space-x-3">
            {/* Mobile search button */}
            <button
              className="md:hidden inline-flex items-center px-3 py-2 border border-gray-200 dark:border-gray-700 shadow-lg text-sm font-medium rounded-full text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
              onClick={() => document.getElementById('mobileSearch')?.classList.toggle('hidden')}
            >
              <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>

            <button
              className="inline-flex items-center px-4 py-2 border border-gray-200 dark:border-gray-700 shadow-lg text-sm font-medium rounded-full text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
              onClick={fetchArticles}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Mobile search bar, hidden by default */}
        <div id="mobileSearch" className="md:hidden mb-6 hidden">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg py-2 pl-10 pr-4 text-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {searchQuery && filteredArticles.length === 0 && !isLoadingList && (
          <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No matches found</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">We couldn't find any articles matching "{searchQuery}"</p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors duration-200"
            >
              Clear search
            </button>
          </div>
        )}

        {renderArticleList()}
      </div>

      {renderArticleModal()}
      {renderDeleteModal()}
      {renderImageViewer()}
    </div>
  );
};

export default SiyaRamArticle;