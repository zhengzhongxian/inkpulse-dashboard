import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { TbArrowLeft, TbDeviceFloppy, TbTrash, TbBookUpload, TbLoader2, TbChevronDown, TbCheck, TbChevronLeft, TbChevronRight, TbBox } from 'react-icons/tb';
import {
  getInternalBookDetailApi,
  getPagedPublishersApi,
  getInternalBookEditionDetailApi,
  createBookEditionApi,
  updateBookEditionApi,
  deleteBookEditionApi,
  getBadgesApi,
  importStockApi,
  adjustStockApi
} from '../api/books';
import { toast } from '../utils/toast';

interface Publisher {
  id: string;
  name: string;
}

interface Badge {
  id: string;
  text: string;
  textColor: string;
  bgColor: string;
}

const formatNumberWithDots = (val: string | number) => {
  if (val === undefined || val === null || val === '') return '';
  const str = typeof val === 'number' ? val.toString() : val.replace(/\D/g, '');
  return str.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

export default function EditionForm() {
  const { bookId, editionId } = useParams<{ bookId: string; editionId?: string }>();
  const navigate = useNavigate();
  const isEdit = !!editionId;
  const initialValuesRef = useRef<any>(null);

  const [bookTitle, setBookTitle] = useState('');
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [selectedPublisher, setSelectedPublisher] = useState<Publisher | null>(null);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [selectedBadgeIds, setSelectedBadgeIds] = useState<string[]>([]);
  const [loadingBook, setLoadingBook] = useState(true);
  const [loadingPublishers, setLoadingPublishers] = useState(true);
  const [loadingBadges, setLoadingBadges] = useState(true);
  const [loadingEdition, setLoadingEdition] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [isDeletingModalOpen, setIsDeletingModalOpen] = useState(false);

  // Stock modal states
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [stockActionType, setStockActionType] = useState<'IMPORT' | 'EXPORT' | null>(null);
  const [stockQtyInput, setStockQtyInput] = useState<number>(0);
  const [stockNoteInput, setStockNoteInput] = useState('');
  const [isStockSubmitting, setIsStockSubmitting] = useState(false);

  // Form states
  const [isbn, setIsbn] = useState('');
  const [price, setPrice] = useState('');
  const [oldPrice, setOldPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('0');
  const [editionNumber, setEditionNumber] = useState('1');
  const [coverType, setCoverType] = useState('SOFT_COVER');
  const [pageCount, setPageCount] = useState('');
  const [publicationYear, setPublicationYear] = useState('');
  const [weightGram, setWeightGram] = useState('');
  const [widthCm, setWidthCm] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [lengthCm, setLengthCm] = useState('');
  const [language, setLanguage] = useState('Tiếng Việt');
  const [publisherId, setPublisherId] = useState('');

  // File and preview states
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [additionalImages, setAdditionalImages] = useState<FileList | null>(null);
  const [galleryPreviewUrls, setGalleryPreviewUrls] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [pdfError, setPdfError] = useState<string | null>('Tệp PDF tối đa 90MB');
  const [galleryError, setGalleryError] = useState<string | null>('Tổng ảnh bộ sưu tập tối đa 90MB (khuyến nghị mỗi ảnh < 5MB)');
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);

  // Select dropdown open states
  const [isPublisherSelectOpen, setIsPublisherSelectOpen] = useState(false);
  const [isCoverTypeSelectOpen, setIsCoverTypeSelectOpen] = useState(false);

  // Publisher Pagination State
  const [publisherSearchTerm, setPublisherSearchTerm] = useState('');
  const [publisherPageNumber, setPublisherPageNumber] = useState(1);
  const [publisherHasMore, setPublisherHasMore] = useState(true);
  const [publisherLoadingMore, setPublisherLoadingMore] = useState(false);

  const fetchPublishers = async (page: number, keyword: string, isAppend: boolean) => {
    setPublisherLoadingMore(true);
    try {
      const res = await getPagedPublishersApi({
        pageNumber: page,
        pageSize: 4, // 4 NXB mỗi trang
        searchKeyword: keyword || undefined
      });
      if (res.data && res.data.success) {
        const paged = res.data.data;
        const newItems = paged.items || [];
        if (isAppend) {
          setPublishers(prev => {
            const combined = [...prev, ...newItems];
            const uniqueMap = new Map(combined.map(item => [item.id, item]));
            return Array.from(uniqueMap.values());
          });
        } else {
          setPublishers(newItems);
        }
        setPublisherHasMore(page < paged.totalPages);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách NXB:', err);
    } finally {
      setPublisherLoadingMore(false);
    }
  };

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.custom-dropdown-container')) {
        setIsPublisherSelectOpen(false);
        setIsCoverTypeSelectOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  useEffect(() => {
    const loadStaticAndDetail = async () => {
      // 1. Load book detail for parent title
      if (bookId) {
        setLoadingBook(true);
        getInternalBookDetailApi(bookId)
          .then(bookRes => {
            if (bookRes.data && bookRes.data.success) {
              setBookTitle(bookRes.data.data.title || '');
            }
          })
          .catch(error => {
            console.error('Error loading parent book detail:', error);
          })
          .finally(() => {
            setLoadingBook(false);
          });
      } else {
        setLoadingBook(false);
      }

      // 2. Fetch trang 1 NXB
      setLoadingPublishers(true);
      fetchPublishers(1, '', false)
        .catch(error => {
          console.error('Error fetching publishers:', error);
        })
        .finally(() => {
          setLoadingPublishers(false);
        });

      // 2.1 Load badges list
      setLoadingBadges(true);
      getBadgesApi()
        .then(badgeRes => {
          if (badgeRes.data && badgeRes.data.success) {
            setAllBadges(badgeRes.data.data || []);
          }
        })
        .catch(error => {
          console.error('Error loading badges list:', error);
        })
        .finally(() => {
          setLoadingBadges(false);
        });

      // 3. Load edition details if edit mode
      if (isEdit && editionId) {
        setLoadingEdition(true);
        getInternalBookEditionDetailApi(editionId)
          .then(edRes => {
            if (edRes.data && edRes.data.success) {
              const ed = edRes.data.data;
              setIsbn(ed.isbn || '');
              setPrice(formatNumberWithDots(ed.price || ''));
              setOldPrice(formatNumberWithDots(ed.oldPrice || ''));
              setStockQuantity(formatNumberWithDots(ed.stockQuantity || '0'));
              setEditionNumber(ed.editionNumber?.toString() || '1');
              setCoverType(ed.coverType || 'SOFT_COVER');
              setPageCount(formatNumberWithDots(ed.pageCount || ''));
              setPublicationYear(ed.publicationYear?.toString() || '');
              setWeightGram(ed.weightGram?.toString() || '');
              setWidthCm(ed.widthCm?.toString() || '');
              setHeightCm(ed.heightCm?.toString() || '');
              setLengthCm(ed.lengthCm?.toString() || '');
              setLanguage(ed.language || 'Tiếng Việt');
              setCoverPreviewUrl(ed.thumbnailUrl || null);

              if (ed.filePathPdf) {
                setPdfFileName('Tệp PDF hiện tại');
                setPdfError(null);
              } else {
                setPdfFileName(null);
              }

              // Set existing publisher directly from API response
              if (ed.publisherId) {
                setPublisherId(ed.publisherId);
                setSelectedPublisher({
                  id: ed.publisherId,
                  name: ed.publisherName || 'Nhà xuất bản'
                });
              }

              // Set existing additional gallery images
              if (ed.imageUrls) {
                setExistingImages(ed.imageUrls);
                if (ed.imageUrls.length > 0) {
                  setGalleryError(null);
                }
              }

              // Set selected badge ids
              const badgeIds = ed.badges ? ed.badges.map((b: any) => b.id) : [];
              if (ed.badges) {
                setSelectedBadgeIds(badgeIds);
              }

              // Save initial values for dirty-checking
              initialValuesRef.current = {
                isbn: ed.isbn || '',
                price: formatNumberWithDots(ed.price || ''),
                oldPrice: formatNumberWithDots(ed.oldPrice || ''),
                stockQuantity: formatNumberWithDots(ed.stockQuantity || '0'),
                editionNumber: ed.editionNumber?.toString() || '1',
                coverType: ed.coverType || 'SOFT_COVER',
                pageCount: formatNumberWithDots(ed.pageCount || ''),
                publicationYear: ed.publicationYear?.toString() || '',
                weightGram: ed.weightGram?.toString() || '',
                widthCm: ed.widthCm?.toString() || '',
                heightCm: ed.heightCm?.toString() || '',
                lengthCm: ed.lengthCm?.toString() || '',
                language: ed.language || 'Tiếng Việt',
                publisherId: ed.publisherId || '',
                badgeIds: badgeIds,
                imageUrls: ed.imageUrls || []
              };
            }
          })
          .catch(error => {
            console.error('Error loading edition details:', error);
            toast.error('Lỗi tải dữ liệu', 'Không thể tải thông tin chi tiết phiên bản.');
          })
          .finally(() => {
            setLoadingEdition(false);
          });
      } else {
        // Defaults for new edition
        setPublicationYear(new Date().getFullYear().toString());
        setLoadingEdition(false);
      }
    };

    loadStaticAndDetail();
  }, [bookId, editionId, isEdit]);

  // Effect để search NXB khi typing
  useEffect(() => {
    const handler = setTimeout(() => {
      setPublisherPageNumber(1);
      fetchPublishers(1, publisherSearchTerm, false);
    }, 400);

    return () => clearTimeout(handler);
  }, [publisherSearchTerm]);

  const handleOpenStockModal = (type: 'IMPORT' | 'EXPORT') => {
    setStockActionType(type);
    setStockQtyInput(type === 'IMPORT' ? 10 : 5);
    setStockNoteInput('');
    setStockModalOpen(true);
  };

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editionId || !stockActionType) return;
    try {
      setIsStockSubmitting(true);
      const currentStockVal = Number(stockQuantity.replace(/\./g, '')) || 0;

      if (stockActionType === 'IMPORT') {
        if (stockQtyInput <= 0) {
          toast.error('Lỗi nhập dữ liệu', 'Số lượng nhập kho phải lớn hơn 0.');
          setIsStockSubmitting(false);
          return;
        }
        await importStockApi({
          editionId,
          quantity: stockQtyInput,
          note: stockNoteInput.trim() || 'Nhập kho thủ công tại trang sửa phiên bản'
        });
        toast.success('Nhập kho thành công', `Đã nhập thêm +${stockQtyInput} cuốn vào kho.`);
      } else {
        if (stockQtyInput <= 0) {
          toast.error('Lỗi nhập dữ liệu', 'Số lượng xuất kho phải lớn hơn 0.');
          setIsStockSubmitting(false);
          return;
        }
        if (stockQtyInput > currentStockVal) {
          toast.error('Lỗi xuất kho', `Không thể xuất ${stockQtyInput} cuốn vì trong kho chỉ còn ${currentStockVal} cuốn.`);
          setIsStockSubmitting(false);
          return;
        }
        const newQty = currentStockVal - stockQtyInput;
        await adjustStockApi({
          editionId,
          newQuantity: newQty,
          note: stockNoteInput.trim() || 'Xuất kho thủ công tại trang sửa phiên bản'
        });
        toast.success('Xuất kho thành công', `Đã xuất -${stockQtyInput} cuốn khỏi kho. Tồn kho còn lại: ${newQty} cuốn.`);
      }

      await fetchCurrentStock();
      setStockModalOpen(false);
    } catch (error: any) {
      console.error(error);
      toast.error(
        stockActionType === 'IMPORT' ? 'Nhập kho thất bại' : 'Xuất kho thất bại',
        error.response?.data?.message || 'Có lỗi xảy ra trong quá trình xử lý.'
      );
    } finally {
      setIsStockSubmitting(false);
    }
  };

  const fetchCurrentStock = async () => {
    if (!editionId) return;
    try {
      const res = await getInternalBookEditionDetailApi(editionId);
      if (res.data && res.data.success) {
        const ed = res.data.data;
        const formattedStock = formatNumberWithDots(ed.stockQuantity || '0');
        setStockQuantity(formattedStock);
        if (initialValuesRef.current) {
          initialValuesRef.current.stockQuantity = formattedStock;
        }
      }
    } catch (err) {
      console.error('Lỗi cập nhật tồn kho:', err);
    }
  };

  const handlePublisherScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 10) {
      if (!publisherLoadingMore && publisherHasMore) {
        const nextPage = publisherPageNumber + 1;
        setPublisherPageNumber(nextPage);
        fetchPublishers(nextPage, publisherSearchTerm, true);
      }
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setCoverFile(file);
      setCoverPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const maxSize = 90 * 1024 * 1024; // 90MB
      if (file.size > maxSize) {
        toast.error('Tệp quá lớn', 'Kích thước tệp PDF vượt quá giới hạn 90MB.');
        setPdfError('Tệp PDF tối đa 90MB');
        setPdfFile(null);
        setPdfFileName(null);
        e.target.value = ''; // Reset input
        return;
      }
      setPdfError(null);
      setPdfFile(file);
      setPdfFileName(file.name);
    }
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      let totalSize = 0;
      for (let i = 0; i < files.length; i++) {
        totalSize += files[i].size;
      }
      const maxSize = 90 * 1024 * 1024; // 90MB
      if (totalSize > maxSize) {
        toast.error('Tệp quá lớn', 'Tổng kích thước bộ sưu tập ảnh vượt quá giới hạn 90MB.');
        setGalleryError('Tổng ảnh bộ sưu tập tối đa 90MB (khuyến nghị mỗi ảnh < 5MB)');
        setAdditionalImages(null);
        setGalleryPreviewUrls([]);
        e.target.value = ''; // Reset input
        return;
      }

      setGalleryError(null);
      setAdditionalImages(files);
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        urls.push(URL.createObjectURL(files[i]));
      }
      setGalleryPreviewUrls(urls);
      setActiveGalleryIndex(0);
    } else {
      setGalleryError('Tổng ảnh bộ sưu tập tối đa 90MB (khuyến nghị mỗi ảnh < 5MB)');
      setAdditionalImages(null);
      setGalleryPreviewUrls([]);
      setActiveGalleryIndex(0);
    }
  };

  const isFormChanged = () => {
    if (!isEdit) return true;
    if (!initialValuesRef.current) return false;

    const init = initialValuesRef.current;

    // Check files
    if (coverFile !== null) return true;
    if (pdfFile !== null) return true;
    if (additionalImages !== null && additionalImages.length > 0) return true;

    // Compare simple states
    if (isbn.trim() !== init.isbn) return true;
    if (price.trim() !== init.price) return true;
    if (oldPrice.trim() !== init.oldPrice) return true;
    if (stockQuantity.trim() !== init.stockQuantity) return true;
    if (editionNumber.trim() !== init.editionNumber) return true;
    if (coverType !== init.coverType) return true;
    if (pageCount.trim() !== init.pageCount) return true;
    if (publicationYear.trim() !== init.publicationYear) return true;
    if (weightGram.trim() !== init.weightGram) return true;
    if (widthCm.trim() !== init.widthCm) return true;
    if (heightCm.trim() !== init.heightCm) return true;
    if (lengthCm.trim() !== init.lengthCm) return true;
    if (language.trim() !== init.language) return true;
    if (publisherId !== init.publisherId) return true;

    // Compare badges
    const currentBadgeIds = Array.from(new Set(selectedBadgeIds)).filter(id => id && id.trim() !== '').sort();
    const initBadgeIds = [...init.badgeIds].sort();
    if (JSON.stringify(currentBadgeIds) !== JSON.stringify(initBadgeIds)) return true;

    // Compare gallery existing image URLs
    const currentExistingImages = [...existingImages];
    const initExistingImages = [...init.imageUrls];
    if (JSON.stringify(currentExistingImages) !== JSON.stringify(initExistingImages)) return true;

    return false;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookId) return;

    if (isEdit && !isFormChanged()) {
      toast.info('Không có thay đổi', 'Bạn chưa thay đổi thông tin nào của phiên bản.');
      navigate(`/products/edit/${bookId}`);
      return;
    }

    if (!isbn.trim()) {
      toast.error('Thiếu thông tin', 'Vui lòng nhập mã ISBN.');
      return;
    }
    const rawPrice = price.replace(/\./g, '');
    const rawOldPrice = oldPrice.replace(/\./g, '');
    const rawStock = stockQuantity.replace(/\./g, '');

    if (!rawPrice || Number(rawPrice) <= 0) {
      toast.error('Dữ liệu không hợp lệ', 'Giá bán phải lớn hơn 0.');
      return;
    }
    if (Number(rawStock) < 0) {
      toast.error('Dữ liệu không hợp lệ', 'Số lượng trong kho không được âm.');
      return;
    }
    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('bookId', bookId);
      formData.append('isbn', isbn.trim());
      formData.append('price', rawPrice);
      if (rawOldPrice) formData.append('oldPrice', rawOldPrice);
      if (!isEdit) {
        formData.append('stockQuantity', rawStock);
      }
      formData.append('editionNumber', editionNumber);
      formData.append('coverType', coverType);
      const rawPageCount = pageCount.replace(/\./g, '');
      if (rawPageCount) formData.append('pageCount', rawPageCount);
      if (publicationYear) formData.append('publicationYear', publicationYear);
      if (weightGram) formData.append('weightGram', weightGram);
      if (widthCm) formData.append('widthCm', widthCm);
      if (heightCm) formData.append('heightCm', heightCm);
      if (lengthCm) formData.append('lengthCm', lengthCm);
      if (language) formData.append('language', language.trim());
      if (publisherId) formData.append('publisherId', publisherId);

      // Badges (Deduplicate and filter out empty values)
      const uniqueBadgeIds = Array.from(new Set(selectedBadgeIds)).filter(id => id && id.trim() !== '');
      uniqueBadgeIds.forEach(id => {
        formData.append('badgeIds', id);
      });

      if (coverFile) {
        formData.append('coverFile', coverFile);
      }
      if (pdfFile) {
        formData.append('pdfFile', pdfFile);
      }
      if (additionalImages && additionalImages.length > 0) {
        for (let i = 0; i < additionalImages.length; i++) {
          formData.append('additionalImages', additionalImages[i]);
        }
      }

      if (isEdit) {
        existingImages.forEach(imgUrl => {
          formData.append('retainImageUrls', imgUrl);
        });
      }

      if (isEdit && editionId) {
        await updateBookEditionApi(editionId, formData);
        toast.success('Cập nhật thành công', 'Phiên bản sách đã được cập nhật.');
      } else {
        await createBookEditionApi(formData);
        toast.success('Thêm thành công', 'Đã thêm phiên bản sách mới.');
      }

      navigate(`/products/edit/${bookId}`);
    } catch (error: any) {
      console.error(error);
      toast.error('Lỗi xử lý', error.response?.data?.message || 'Không thể lưu phiên bản sách.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEdition = async () => {
    if (!editionId) return;
    try {
      setSubmitting(true);
      await deleteBookEditionApi(editionId);
      toast.success('Xóa thành công', 'Phiên bản sách đã được xóa khỏi hệ thống.');
      navigate(`/products/edit/${bookId}`);
    } catch (error: any) {
      console.error(error);
      toast.error('Lỗi khi xóa', error.response?.data?.message || 'Không thể xóa phiên bản sách.');
    } finally {
      setSubmitting(false);
      setIsDeletingModalOpen(false);
    }
  };

  const allAvailablePublishers = (() => {
    const combined = selectedPublisher ? [selectedPublisher, ...publishers] : publishers;
    const uniqueMap = new Map(combined.map(item => [item.id, item]));
    return Array.from(uniqueMap.values());
  })();

  const filteredPublishers = allAvailablePublishers.filter(p =>
    p.name.toLowerCase().includes(publisherSearchTerm.toLowerCase())
  );

  const allGalleryItems = [
    ...existingImages.map((url, idx) => ({ url, type: 'existing', originalIndex: idx })),
    ...galleryPreviewUrls.map((url, idx) => ({ url, type: 'new', originalIndex: idx }))
  ];

  // Removed full page loading blocker to render layout immediately

  return (
    <div style={{ position: 'relative' }}>
      {/* CSS internal styles matching ProductForm */}
      <style>{`
        .form-card-custom {
          margin-top: 20px;
          position: relative;
        }
        .form-card-loading-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(13, 13, 15, 0.75);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          z-index: 50;
          color: var(--text-main);
          font-weight: 600;
          font-size: 14.5px;
          border-radius: 8px;
        }
        .form-grid-custom {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin-bottom: 20px;
        }
        @media (max-width: 768px) {
          .form-grid-custom {
            grid-template-columns: 1fr;
          }
        }
        .form-field-custom {
          display: flex;
          flex-direction: column;
          gap: 8px;
          text-align: left;
        }
        .form-field-custom > label {
          font-size: 13.5px;
          font-weight: 600;
          color: #F687B3; /* Nhãn màu hồng đồng bộ */
        }
        .form-field-custom input,
        .form-field-custom select {
          background-color: #0d0d0f; /* Nền tối sâu thẳm */
          border: 1px solid #2d2d30; /* Viền zinc tinh tế */
          color: var(--text-main);
          height: 44px;
          padding: 0 16px;
          font-size: 14px;
          width: 100%;
          outline: none;
          transition: var(--transition);
          border-radius: 8px; /* Bo góc theo yêu cầu */
        }
        .form-field-custom input:focus,
        .form-field-custom select:focus {
          border-color: #4a4a4f !important;
          box-shadow: none !important;
        }
        .btn-upload-custom {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background-color: #1f1f23;
          color: var(--text-muted) !important;
          border: 1px solid #3f3f46;
          border-radius: 8px;
          padding: 10px 18px;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition);
          width: fit-content;
        }
        .btn-upload-custom:hover {
          background-color: #27272c;
          border-color: #3f3f46;
        }
        .cover-preview-container-new {
          margin-top: 12px;
          display: flex;
          gap: 16px;
          align-items: center;
        }
        .preview-wrap-new {
          position: relative;
          width: 400px;
          height: 400px;
          border-radius: 0px;
          overflow: hidden;
          border: 1px solid #2d2d30;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        }
        .cover-preview-img-new {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .btn-remove-cover-new {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background-color: rgba(0, 0, 0, 0.7);
          color: #fff;
          border: none;
          font-size: 14px;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: var(--transition);
        }
        .btn-remove-cover-new:hover {
          background-color: rgba(239, 68, 68, 0.9);
        }
        .required-star {
          color: #f56565;
          margin-left: 4px;
        }
        
        /* Custom add button - beautiful and elegant matching list book */
        .btn-add-custom {
          background-color: var(--primary);
          color: #fff;
          border-radius: 8px !important;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 0 24px !important;
          font-weight: 600;
          display: inline-flex !important;
          cursor: pointer;
          font-size: 13.5px !important;
          transition: var(--transition);
          height: 42px !important;
          border: none;
          outline: none;
          min-width: 160px;
        }
        .btn-add-custom:hover {
          background-color: var(--primary-hover);
        }
        .btn-stock-action {
          background-color: #1f1f23;
          color: #e2e4e9;
          border: 1px solid #3f3f46;
          border-radius: 8px;
          padding: 0 16px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition);
          height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .btn-stock-action:hover {
          background-color: #27272c;
          border-color: #52525b;
          color: #ffffff;
        }
        .btn-back-custom {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--text-light);
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: var(--transition);
          margin-bottom: 8px;
        }
        .btn-back-custom:hover {
          color: #F687B3 !important;
        }
        .btn-secondary:hover {
          color: #F687B3 !important;
          border-color: #F687B3 !important;
        }
        .btn-delete-custom {
          display: inline-flex !important;
          align-items: center;
          justify-content: center;
          height: 42px !important;
          padding: 0 24px !important;
          border: 1px solid #2d2d30;
          background-color: transparent;
          color: var(--text-light);
          font-weight: 600;
          font-size: 13.5px !important;
          border-radius: 8px !important;
          cursor: pointer;
          transition: all 0.2s ease;
          user-select: none;
          gap: 6px;
          min-width: 160px;
        }

        .btn-delete-custom:hover {
          color: #ef4444 !important;
          border-color: #ef4444 !important;
          background-color: rgba(239, 68, 68, 0.05) !important;
        }
        .btn-cancel-custom {
          background-color: #27272a;
          color: #ffffff;
          border: 1px solid #3f3f46;
          border-radius: 0px;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition);
        }
        .btn-cancel-custom:hover {
          background-color: #3f3f46;
        }
        .btn-delete-confirm-custom {
          background-color: #ef4444;
          color: #ffffff;
          border: none;
          border-radius: 0px;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition);
        }
        .btn-delete-confirm-custom:hover {
          background-color: #dc2626;
        }

        /* Custom Dropdown Container */
        .custom-dropdown-container {
          position: relative;
          width: 100%;
          user-select: none;
        }
        .custom-dropdown-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background-color: #0d0d0f;
          border: 1px solid #2d2d30;
          border-radius: 8px;
          padding: 0 16px;
          color: var(--text-main);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          height: 44px;
          transition: var(--transition);
        }
        .custom-dropdown-header:hover {
          border-color: #4a4a4f;
        }
        .custom-dropdown-header.active {
          border-color: #4a4a4f;
        }
        .custom-dropdown-header .arrow-icon {
          color: #da447d;
          font-size: 18px;
          transition: transform 0.2s ease;
        }
        .custom-dropdown-header .arrow-icon.open {
          transform: rotate(180deg);
        }
        .custom-dropdown-menu {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          right: 0;
          background-color: #161616;
          border: 1px solid var(--border);
          border-radius: 8px;
          box-shadow: var(--shadow-lg);
          z-index: 100;
          max-height: 250px;
          overflow-y: auto;
          padding: 6px 0;
        }
        .custom-dropdown-item {
          padding: 10px 16px;
          font-size: 13.5px;
          color: var(--text-main);
          font-weight: 500;
          cursor: pointer;
          transition: var(--transition);
          text-align: left;
        }
        .custom-dropdown-item:hover {
          background-color: var(--primary-light);
          color: #F687B3;
        }
        .custom-dropdown-item.selected {
          color: #F687B3;
          font-weight: 700;
          background-color: rgba(218, 68, 125, 0.08);
        }

        /* Gallery Preview Container */
        .gallery-preview-container {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 12px;
        }
        .gallery-preview-item {
          position: relative;
          width: 80px;
          height: 80px;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid var(--border);
          background-color: #1a1a1e;
        }
        .gallery-preview-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .btn-remove-gallery-img {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 18px;
          height: 18px;
          background-color: rgba(239, 68, 68, 0.9);
          color: white;
          border: none;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          cursor: pointer;
          transition: var(--transition);
          z-index: 10;
        }
        .btn-remove-gallery-img:hover {
          background-color: rgb(220, 38, 38);
        }
        .animate-spin-custom {
          animation: btn-spin-key 0.8s linear infinite;
          display: inline-block;
        }
        @keyframes btn-spin-key {
          to { transform: rotate(360deg); }
        }
        .file-size-note {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 6px;
          font-size: 12px;
          color: #f56565;
        }
        .file-size-note svg {
          flex-shrink: 0;
        }
        .carousel-arrow-btn-nav {
          background: none;
          border: none;
          color: var(--text-muted);
          font-size: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          padding: 8px;
          user-select: none;
          z-index: 5;
        }
        .carousel-arrow-btn-nav:hover {
          color: #F687B3;
          transform: translateY(-50%) scale(1.15) !important;
        }
        .carousel-overlay-info {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(to top, rgba(13, 13, 15, 0.9) 0%, rgba(13, 13, 15, 0.6) 80%, rgba(13, 13, 15, 0) 100%);
          backdrop-filter: blur(2px);
          -webkit-backdrop-filter: blur(2px);
          padding: 16px;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          z-index: 4;
        }
        .carousel-badge-type {
          font-size: 10px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 6px;
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }
        .carousel-badge-type.existing {
          background-color: rgba(79, 209, 197, 0.15);
          color: #4fd1c5;
          border: 1px solid rgba(79, 209, 197, 0.3);
        }
        .carousel-badge-type.new {
          background-color: rgba(246, 135, 179, 0.15);
          color: #F687B3;
          border: 1px solid rgba(246, 135, 179, 0.3);
        }
        .carousel-dots {
          display: flex;
          justify-content: center;
          gap: 6px;
          margin-top: 10px;
          flex-wrap: wrap;
          max-width: 400px;
        }
        .carousel-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #2d2d30;
          cursor: pointer;
          transition: all 0.25s ease;
        }
        .carousel-dot.active {
          background-color: #F687B3;
          box-shadow: 0 0 8px rgba(246, 135, 179, 0.6);
          width: 18px;
          border-radius: 4px;
        }
        .btn-remove-gallery-carousel {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(239, 68, 68, 0.2);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          border: 1px solid rgba(239, 68, 68, 0.4);
          color: #f56565;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          z-index: 10;
          font-size: 16px;
          font-weight: bold;
        }
        .btn-remove-gallery-carousel:hover {
          background: rgba(239, 68, 68, 0.9);
          color: #ffffff;
          border-color: #ef4444;
          box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
        }

        /* Custom styles for Edition Detail Modal / Stock Modal */
        .modal-overlay-custom {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.7);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .modal-card-custom {
          background-color: var(--bg-card);
          border: 1px solid var(--border);
          width: 100%;
          max-width: 680px;
          border-radius: 0px !important; /* Không bo góc theo yêu cầu */
          box-shadow: var(--shadow-lg);
          animation: fadeInCustom 0.25s ease;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .modal-header-custom {
          padding: 16px 24px;
          border-bottom: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .modal-header-custom h2 {
          font-size: 16px;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
        }
        .modal-close-btn-custom {
          background: none;
          border: none;
          color: var(--text-muted);
          font-size: 28px;
          line-height: 1;
          cursor: pointer;
          outline: none;
        }
        .modal-close-btn-custom:hover {
          color: #ffffff;
        }

        @keyframes fadeInCustom {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* Header bar */}
      <div>
        <Link to={`/products/edit/${bookId}`} className="btn-back-custom">
          <TbArrowLeft /> Quay lại thông tin sách
        </Link>
        <h1 className="view-title" style={{ fontSize: '28px', marginTop: '4px' }}>
          {isEdit ? 'Chỉnh sửa phiên bản sách' : 'Thêm phiên bản mới'}
        </h1>
        <p className="view-subtitle" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          Thuộc cuốn sách:
          {loadingBook ? (
            <span style={{ color: '#a0aec0', fontStyle: 'italic', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <TbLoader2 className="animate-spin-custom" style={{ fontSize: '14px' }} /> Đang tải...
            </span>
          ) : (
            <span style={{ color: '#4fd1c5', fontWeight: 600 }}>{bookTitle}</span>
          )}
        </p>
      </div>

      {/* Full form */}
      <form onSubmit={handleFormSubmit} className="form-card-custom">
        {isEdit && loadingEdition && (
          <div className="form-card-loading-overlay">
            <div className="pink-spinner"></div>
            <span>Đang tải thông tin chi tiết phiên bản...</span>
          </div>
        )}
        <div className="form-grid-custom">
          <div className="form-field-custom">
            <label>
              Mã ISBN
              <span className="required-star">*</span>
            </label>
            <input
              type="text"
              placeholder="Nhập mã ISBN (Ví dụ: 9786041185012)"
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
              required
            />
          </div>

          <div className="form-field-custom">
            <label>Nhà xuất bản</label>
            <div className="custom-dropdown-container">
              <div
                className={`custom-dropdown-header ${isPublisherSelectOpen ? 'active' : ''} ${loadingPublishers ? 'disabled' : ''}`}
                onClick={() => !loadingPublishers && setIsPublisherSelectOpen(!isPublisherSelectOpen)}
                style={loadingPublishers ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {loadingPublishers && <TbLoader2 className="animate-spin-custom" style={{ color: '#da447d' }} />}
                  {loadingPublishers ? 'Đang tải danh sách NXB...' : (publisherId ? (selectedPublisher?.name || publishers.find(p => p.id === publisherId)?.name || 'Nhà xuất bản') : '-- Chọn Nhà xuất bản --')}
                </span>
                <TbChevronDown className={`arrow-icon ${isPublisherSelectOpen ? 'open' : ''}`} />
              </div>
              {isPublisherSelectOpen && (
                <div className="custom-dropdown-menu" onScroll={handlePublisherScroll} style={{ padding: '8px' }}>
                  <input
                    type="text"
                    placeholder="Tìm kiếm NXB..."
                    value={publisherSearchTerm}
                    onChange={(e) => setPublisherSearchTerm(e.target.value)}
                    onClick={(e) => e.stopPropagation()} // Tránh đóng dropdown khi click vào input
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      marginBottom: '8px',
                      backgroundColor: '#0d0d0f',
                      border: '1px solid #2d2d30',
                      borderRadius: '6px',
                      color: '#ffffff',
                      outline: 'none',
                      fontSize: '13px'
                    }}
                  />
                  <div
                    className={`custom-dropdown-item ${!publisherId ? 'selected' : ''}`}
                    onClick={() => {
                      setPublisherId('');
                      setSelectedPublisher(null);
                      setIsPublisherSelectOpen(false);
                    }}
                  >
                    -- Chọn Nhà xuất bản --
                  </div>
                  {filteredPublishers.map(pub => (
                    <div
                      key={pub.id}
                      className={`custom-dropdown-item ${publisherId === pub.id ? 'selected' : ''}`}
                      onClick={() => {
                        setPublisherId(pub.id);
                        setSelectedPublisher(pub);
                        setIsPublisherSelectOpen(false);
                      }}
                    >
                      {pub.name}
                    </div>
                  ))}
                  {publisherLoadingMore && (
                    <div style={{ textAlign: 'center', padding: '8px' }}>
                      <div className="pink-spinner" style={{ width: '18px', height: '18px', margin: '0 auto' }} />
                    </div>
                  )}
                  {filteredPublishers.length === 0 && !publisherLoadingMore && (
                    <div style={{ padding: '8px', color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>
                      Không tìm thấy nhà xuất bản.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="form-grid-custom">
          <div className="form-field-custom">
            <label>
              Giá bán (VND)
              <span className="required-star">*</span>
            </label>
            <input
              type="text"
              placeholder="Ví dụ: 95.000"
              value={price}
              onChange={(e) => setPrice(formatNumberWithDots(e.target.value))}
              required
              style={{ color: '#48bb78', fontWeight: 'bold' }}
            />
          </div>

          <div className="form-field-custom">
            <label>Giá gốc (VND)</label>
            <input
              type="text"
              placeholder="Ví dụ: 120.000 (Để trống nếu không có)"
              value={oldPrice}
              onChange={(e) => setOldPrice(formatNumberWithDots(e.target.value))}
              style={{ color: '#f56565', fontWeight: 'bold' }}
            />
          </div>
        </div>

        <div className="form-grid-custom">
          <div className="form-field-custom">
            <label>Số lượng trong kho</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(formatNumberWithDots(e.target.value))}
                style={{ color: 'var(--accent-blue)', fontWeight: 'bold', flex: 1, backgroundColor: isEdit ? '#1f1f23' : undefined, cursor: isEdit ? 'not-allowed' : undefined }}
                disabled={isEdit}
              />
              {isEdit && (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    className="btn-stock-action"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleOpenStockModal('IMPORT');
                    }}
                  >
                    Nhập kho
                  </button>
                  <button
                    type="button"
                    className="btn-stock-action"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleOpenStockModal('EXPORT');
                    }}
                  >
                    Xuất kho
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="form-field-custom">
            <label>Thứ tự phiên bản</label>
            <input
              type="number"
              value={editionNumber}
              onChange={(e) => setEditionNumber(e.target.value)}
              min="1"
            />
          </div>
        </div>

        <div className="form-grid-custom">
          <div className="form-field-custom">
            <label>Loại bìa</label>
            <div className="custom-dropdown-container">
              <div
                className={`custom-dropdown-header ${isCoverTypeSelectOpen ? 'active' : ''}`}
                onClick={() => setIsCoverTypeSelectOpen(!isCoverTypeSelectOpen)}
              >
                <span>
                  {coverType === 'HARD_COVER' ? 'Bìa cứng' : 'Bìa mềm'}
                </span>
                <TbChevronDown className={`arrow-icon ${isCoverTypeSelectOpen ? 'open' : ''}`} />
              </div>
              {isCoverTypeSelectOpen && (
                <div className="custom-dropdown-menu">
                  <div
                    className={`custom-dropdown-item ${coverType === 'SOFT_COVER' ? 'selected' : ''}`}
                    onClick={() => {
                      setCoverType('SOFT_COVER');
                      setIsCoverTypeSelectOpen(false);
                    }}
                  >
                    Bìa mềm
                  </div>
                  <div
                    className={`custom-dropdown-item ${coverType === 'HARD_COVER' ? 'selected' : ''}`}
                    onClick={() => {
                      setCoverType('HARD_COVER');
                      setIsCoverTypeSelectOpen(false);
                    }}
                  >
                    Bìa cứng
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="form-field-custom">
            <label>Ngôn ngữ</label>
            <input
              type="text"
              placeholder="Ví dụ: Tiếng Việt, Tiếng Anh"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            />
          </div>
        </div>

        <div className="form-field-custom" style={{ gridColumn: 'span 2', marginBottom: '20px' }}>
          <label>Nhãn dán (Badges) phiên bản</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '8px' }}>
            {loadingBadges ? (
              <span style={{ fontSize: '13.5px', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <TbLoader2 className="animate-spin-custom" /> Đang tải nhãn dán...
              </span>
            ) : (
              <>
                {allBadges.map((badge) => {
                  const isSelected = selectedBadgeIds.includes(badge.id);
                  return (
                    <button
                      key={badge.id}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setSelectedBadgeIds(selectedBadgeIds.filter(id => id !== badge.id));
                        } else {
                          setSelectedBadgeIds([...selectedBadgeIds, badge.id]);
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        border: '1px solid #2d2d30',
                        backgroundColor: isSelected ? badge.bgColor : '#161616',
                        color: isSelected ? badge.textColor : 'var(--text-light)',
                        fontSize: '13px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: 'none'
                      }}
                    >
                      {isSelected ? (
                        <TbCheck style={{ fontSize: '14px', strokeWidth: 3 }} />
                      ) : (
                        <span style={{
                          display: 'inline-block',
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: badge.bgColor,
                          border: '1px solid rgba(255,255,255,0.2)'
                        }} />
                      )}
                      {badge.text}
                    </button>
                  );
                })}
                {allBadges.length === 0 && (
                  <span style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>
                    Không có nhãn dán nào khả dụng trong hệ thống.
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        <div className="form-grid-custom">
          <div className="form-field-custom">
            <label>Số trang</label>
            <input
              type="text"
              placeholder="Ví dụ: 320"
              value={pageCount}
              onChange={(e) => setPageCount(formatNumberWithDots(e.target.value))}
            />
          </div>

          <div className="form-field-custom">
            <label>Năm xuất bản</label>
            <input
              type="number"
              placeholder="Ví dụ: 2026"
              value={publicationYear}
              onChange={(e) => setPublicationYear(e.target.value)}
            />
          </div>
        </div>

        <div className="form-grid-custom">
          <div className="form-field-custom">
            <label>Thông số giao hàng (Cân nặng / Rộng × Dài × Cao)</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              <div>
                <input
                  type="number"
                  placeholder="Nặng (g)"
                  value={weightGram}
                  onChange={(e) => setWeightGram(e.target.value)}
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Rộng (cm)"
                  value={widthCm}
                  onChange={(e) => setWidthCm(e.target.value)}
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Dài (cm)"
                  value={lengthCm}
                  onChange={(e) => setLengthCm(e.target.value)}
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Cao (cm)"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="form-field-custom">
            <label>
              Tệp PDF
            </label>
            <div style={{ marginTop: '4px' }}>
              <input
                id="pdf-file-input"
                type="file"
                accept="application/pdf"
                onChange={handlePdfChange}
                style={{ display: 'none' }}
              />
              <label htmlFor="pdf-file-input" className="btn-upload-custom">
                <TbBookUpload style={{ fontSize: '18px' }} /> Chọn File
              </label>
              {pdfFileName && (
                <span style={{ marginLeft: '12px', fontSize: '14px', color: '#4fd1c5', fontWeight: '500' }}>
                  {pdfFileName}
                </span>
              )}
              {pdfError && <p className="file-size-note">{pdfError}</p>}
            </div>
          </div>
        </div>

        <div className="form-grid-custom" style={{ marginTop: '10px' }}>
          <div className="form-field-custom">
            <label>
              Ảnh bìa phiên bản
              {!isEdit && <span className="required-star">*</span>}
            </label>
            <div style={{ marginTop: '4px' }}>
              <input
                id="cover-file-input"
                type="file"
                accept="image/*"
                onChange={handleCoverChange}
                required={!isEdit}
                style={{ display: 'none' }}
              />
              <label htmlFor="cover-file-input" className="btn-upload-custom">
                <TbBookUpload style={{ fontSize: '18px' }} /> Chọn Ảnh
              </label>

              <div className="cover-preview-container-new">
                <div className="preview-wrap-new">
                  <img
                    src={coverPreviewUrl || 'https://placehold.co/400x400'}
                    alt="Bìa phiên bản"
                    className="cover-preview-img-new"
                  />
                  {coverPreviewUrl && coverFile && (
                    <button
                      type="button"
                      className="btn-remove-cover-new"
                      onClick={() => {
                        setCoverFile(null);
                        setCoverPreviewUrl(null);
                      }}
                    >
                      &times;
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="form-field-custom">
            <label>
              Ảnh bộ sưu tập
            </label>
            <div style={{ marginTop: '4px' }}>
              <input
                id="gallery-file-input"
                type="file"
                accept="image/*"
                multiple
                onChange={handleGalleryChange}
                style={{ display: 'none' }}
              />
              <label htmlFor="gallery-file-input" className="btn-upload-custom">
                <TbBookUpload style={{ fontSize: '18px' }} /> Chọn nhiều ảnh
              </label>
              {galleryError && <p className="file-size-note">{galleryError}</p>}

              {/* Carousel preview (400x400) */}
              {allGalleryItems.length > 0 && activeGalleryIndex < allGalleryItems.length && (
                <div className="cover-preview-container-new" style={{ position: 'relative', width: '400px', display: 'block' }}>
                  <div className="preview-wrap-new" style={{ borderRadius: '0px' }}>
                    <img
                      src={allGalleryItems[activeGalleryIndex].url}
                      alt={`Gallery ${activeGalleryIndex}`}
                      className="cover-preview-img-new"
                    />

                    {/* Glassmorphic overlay info banner */}
                    <div className="carousel-overlay-info">
                      <span style={{ fontSize: '12.5px', color: '#ffffff', fontWeight: '600' }}>
                        Ảnh {activeGalleryIndex + 1} / {allGalleryItems.length}
                      </span>
                      <span className={`carousel-badge-type ${allGalleryItems[activeGalleryIndex].type}`}>
                        {allGalleryItems[activeGalleryIndex].type === 'existing' ? 'Ảnh hiện tại' : 'Ảnh mới chọn'}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="btn-remove-gallery-carousel"
                      onClick={() => {
                        const itemToRemove = allGalleryItems[activeGalleryIndex];
                        if (itemToRemove.type === 'existing') {
                          setExistingImages(prev => prev.filter((_, idx) => idx !== itemToRemove.originalIndex));
                        } else {
                          const newUrls = galleryPreviewUrls.filter((_, idx) => idx !== itemToRemove.originalIndex);
                          setGalleryPreviewUrls(newUrls);
                          if (additionalImages) {
                            const dt = new DataTransfer();
                            for (let i = 0; i < additionalImages.length; i++) {
                              if (i !== itemToRemove.originalIndex) {
                                dt.items.add(additionalImages[i]);
                              }
                            }
                            setAdditionalImages(dt.files.length > 0 ? dt.files : null);
                          }
                        }
                        // Adjust active index
                        const nextLength = allGalleryItems.length - 1;
                        if (activeGalleryIndex >= nextLength && nextLength > 0) {
                          setActiveGalleryIndex(nextLength - 1);
                        }
                      }}
                    >
                      &times;
                    </button>
                  </div>

                  {allGalleryItems.length > 1 && (
                    <>
                      <button
                        type="button"
                        className="carousel-arrow-btn-nav"
                        style={{ position: 'absolute', left: '-44px', top: '50%', transform: 'translateY(-50%)' }}
                        onClick={() => setActiveGalleryIndex(prev => (prev === 0 ? allGalleryItems.length - 1 : prev - 1))}
                      >
                        <TbChevronLeft />
                      </button>
                      <button
                        type="button"
                        className="carousel-arrow-btn-nav"
                        style={{ position: 'absolute', right: '-44px', top: '50%', transform: 'translateY(-50%)' }}
                        onClick={() => setActiveGalleryIndex(prev => (prev === allGalleryItems.length - 1 ? 0 : prev + 1))}
                      >
                        <TbChevronRight />
                      </button>
                    </>
                  )}

                  {/* Dot Indicators */}
                  {allGalleryItems.length > 1 && (
                    <div className="carousel-dots" style={{ marginTop: '10px' }}>
                      {allGalleryItems.map((_, idx) => (
                        <div
                          key={idx}
                          className={`carousel-dot ${idx === activeGalleryIndex ? 'active' : ''}`}
                          onClick={() => setActiveGalleryIndex(idx)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Buttons Action Row */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '30px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
          {isEdit && (
            <button
              type="button"
              className="btn-delete-custom"
              onClick={() => setIsDeletingModalOpen(true)}
            >
              <TbTrash style={{ fontSize: '16px' }} /> Xóa phiên bản này
            </button>
          )}
          <button type="submit" className="btn-add-custom" disabled={submitting}>
            {submitting ? (
              <TbLoader2 className="animate-spin-custom" style={{ fontSize: '16px' }} />
            ) : (
              <TbDeviceFloppy />
            )}
            {submitting ? 'Đang lưu' : 'Lưu thông tin'}
          </button>
        </div>
      </form>

      {/* Delete Confirmation Modal (Flat, Square, Dark Theme) */}
      {isDeletingModalOpen && (
        <div className="modal-overlay-custom">
          <div className="modal-card-custom" style={{ maxWidth: '440px', borderRadius: '0px !important' }}>
            <div className="modal-header-custom" style={{ borderBottom: 'none', paddingBottom: '0px' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}>
                <TbTrash /> Xác nhận xóa phiên bản
              </h2>
              <button className="modal-close-btn-custom" onClick={() => setIsDeletingModalOpen(false)}>&times;</button>
            </div>
            <div style={{ padding: '16px 24px', color: 'var(--text-main)', fontSize: '14px', textAlign: 'left' }}>
              Hành động này sẽ xóa mềm phiên bản sách khỏi cơ sở dữ liệu và xóa vật lý tài liệu trên Elasticsearch. Bạn có chắc chắn muốn thực hiện không?
            </div>
            <div style={{ display: 'flex', gap: '10px', padding: '16px 24px', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', marginTop: '8px' }}>
              <button
                className="btn-cancel-custom"
                onClick={() => setIsDeletingModalOpen(false)}
              >
                Hủy bỏ
              </button>
              <button
                className="btn-delete-confirm-custom"
                onClick={handleDeleteEdition}
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Management Modal */}
      {stockModalOpen && createPortal(
        <div className="modal-overlay-custom" style={{ zIndex: 10000 }}>
          <div className="modal-card-custom" style={{ maxWidth: '480px', borderRadius: '0px !important' }}>
            <div className="modal-header-custom" style={{ borderBottom: 'none', paddingBottom: '0px' }}>
              <h2 style={{ color: 'var(--primary)', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
                {stockActionType === 'IMPORT' ? 'Nhập thêm kho' : 'Xuất kho thực tế'}
              </h2>
              <button type="button" className="modal-close-btn-custom" onClick={() => setStockModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleStockSubmit}>
              <div style={{ padding: '20px 24px', color: 'var(--text-main)', fontSize: '14px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '600', color: 'var(--text-light)', marginBottom: '6px' }}>
                    {stockActionType === 'IMPORT' ? 'Số lượng sách nhập thêm' : 'Số lượng sách xuất đi'}
                  </label>
                  <input
                    type="number"
                    value={stockQtyInput}
                    onChange={(e) => setStockQtyInput(Math.max(1, parseInt(e.target.value) || 0))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: '#0d0d0f',
                      border: '1px solid #2d2d30',
                      borderRadius: '4px',
                      color: '#ffffff',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                    min={1}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '600', color: 'var(--text-light)', marginBottom: '6px' }}>
                    Ghi chú / Lý do thay đổi
                  </label>
                  <textarea
                    value={stockNoteInput}
                    onChange={(e) => setStockNoteInput(e.target.value)}
                    placeholder={stockActionType === 'IMPORT' ? 'Ví dụ: Nhập thêm hàng mới từ nhà in...' : 'Ví dụ: Xuất trả hàng nhà cung cấp, xuất hủy sách rách hỏng...'}
                    style={{
                      width: '100%',
                      height: '80px',
                      padding: '10px 12px',
                      backgroundColor: '#0d0d0f',
                      border: '1px solid #2d2d30',
                      borderRadius: '4px',
                      color: '#ffffff',
                      fontSize: '14px',
                      outline: 'none',
                      resize: 'none'
                    }}
                    required
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', padding: '16px 24px', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', marginTop: '8px' }}>
                <button
                  type="submit"
                  className="btn-add-custom"
                  style={{
                    backgroundColor: 'var(--primary)',
                    borderColor: 'var(--primary)',
                    color: 'white',
                    height: '34px',
                    padding: '0 16px',
                    fontSize: '13px',
                    margin: 0,
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                  disabled={isStockSubmitting}
                >
                  {isStockSubmitting ? (
                    <>
                      <TbLoader2 className="animate-spin-custom" style={{ fontSize: '14px' }} />
                      Đang lưu...
                    </>
                  ) : (
                    'Xác nhận'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
