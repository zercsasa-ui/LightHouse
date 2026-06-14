import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import styles from './Admin.module.css';
import ConfirmModal from '../components/ConfirmModal';

// Импортируем созданные компоненты
import RequestsSection from '../components/admin/RequestsSection';
import ProductsSection from '../components/admin/ProductsSection';
import CategoriesSection from '../components/admin/CategoriesSection';
import UsersSection from '../components/admin/UsersSection';
import QuestionsSection from '../components/admin/QuestionsSection';
import ImageCropper from '../components/admin/ImageCropper';

// Шаблоны обрезки (вне компонента для стабильной ссылки)
const CROP_TEMPLATES = {
  '3-4':  { ratio: 3 / 4, width: 600, height: 800 },
  '1-1':  { ratio: 1,     width: 600, height: 600 },
  '4-3':  { ratio: 4 / 3, width: 800, height: 600 },
  '16-9': { ratio: 16 / 9, width: 960, height: 540 },
};

const Admin = () => {
  const [expandedMessages, setExpandedMessages] = useState({});
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const [activeTab, setActiveTab] = useState('requests');
  const [requests, setRequests] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRequest, setEditingRequest] = useState(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [requestStatus, setRequestStatus] = useState('');
  const [showProductForm, setShowProductForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({ name: '', email: '', role: '' });

  // Состояния для вопросов о товарах
  const [questions, setQuestions] = useState([]);
  const [questionSearch, setQuestionSearch] = useState('');
  const [questionStatusFilter, setQuestionStatusFilter] = useState('');
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const [hoveredProduct, setHoveredProduct] = useState(null);

  // Состояния для обрезки изображений
  const [showCropper, setShowCropper] = useState(false);
  const [originalImage, setOriginalImage] = useState(null);
  const [cropSelection, setCropSelection] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [cropTemplate, setCropTemplate] = useState('3-4');

  // При смене шаблона сразу пересчитываем рамку выделения
  useEffect(() => {
    if (!imageDimensions.width || !imageDimensions.height) return;
    const tpl = CROP_TEMPLATES[cropTemplate] || CROP_TEMPLATES['3-4'];
    const width = imageDimensions.width;
    const height = imageDimensions.height;
    let selectionWidth, selectionHeight;

    if (width / height > tpl.ratio) {
      selectionHeight = height * 0.8;
      selectionWidth = selectionHeight * tpl.ratio;
    } else {
      selectionWidth = width * 0.8;
      selectionHeight = selectionWidth / tpl.ratio;
    }

    setCropSelection({
      x: (width - selectionWidth) / 2,
      y: (height - selectionHeight) / 2,
      width: selectionWidth,
      height: selectionHeight
    });
  }, [cropTemplate, imageDimensions.width, imageDimensions.height]);

  const [globalViewMode, setGlobalViewMode] = useState('list');
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
    category_id: '',
    stock: '',
    is_active: true
  });
  const { user, userProfile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortStatus, setSortStatus] = useState('');
  const [sortDate, setSortDate] = useState('desc');
  const [requestDateFrom, setRequestDateFrom] = useState('');
  const [requestDateTo, setRequestDateTo] = useState('');

  // Фильтры для товаров
  const [productSearch, setProductSearch] = useState('');
  const [productCategory, setProductCategory] = useState('');
  const [productActive, setProductActive] = useState('');
  const [productDateFrom, setProductDateFrom] = useState('');

  // Состояния для категорий
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [categorySearch, setCategorySearch] = useState('');

  // Состояния для параметров категорий
  const [showParameterForm, setShowParameterForm] = useState({});
  const [editingParameter, setEditingParameter] = useState(null);
  const [parameterForm, setParameterForm] = useState({ category_id: null, name: '', unit: '' });
  const [expandedParams, setExpandedParams] = useState({});

  // Состояние для параметров товара (при редактировании/создании)
  const [productParameters, setProductParameters] = useState({});

  // Получить параметры для выбранной категории
  const getCategoryParamsForForm = (categoryId) => {
    if (!categoryId) return [];
    const cat = categories.find(c => c.id === parseInt(categoryId));
    return cat?.category_parameters || [];
  };

  // Обработка категорий
  let processedCategories = categories.filter(cat => {
    if (!categorySearch.trim()) return true;
    const query = categorySearch.toLowerCase();
    return (
      cat.name?.toLowerCase().includes(query) ||
      cat.description?.toLowerCase().includes(query)
    );
  });

  // Состояния для поиска пользователей
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');

  // Обработка пользователей
  let processedUsers = users.filter(user => {
    if (!userSearch.trim()) return true;
    const query = userSearch.toLowerCase();
    return (
      user.name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query)
    );
  });

  // Фильтр по роли
  if (userRoleFilter) {
    processedUsers = processedUsers.filter(user => user.role === userRoleFilter);
  }

  // Сортировка товаров
  const [productSortDate, setProductSortDate] = useState('desc');

  // Обработка товаров
  let processedProducts = products.filter(prod => {
    if (productSearch.trim()) {
      const query = productSearch.toLowerCase();
      if (
        !prod.name?.toLowerCase().includes(query) &&
        !prod.description?.toLowerCase().includes(query)
      ) return false;
    }

    if (productCategory && prod.category_id !== parseInt(productCategory)) {
      return false;
    }

    if (productActive === 'active' && !prod.is_active) return false;
    if (productActive === 'inactive' && prod.is_active) return false;

    // Фильтр по дате создания товаров
    if (productDateFrom) {
      const fromDate = new Date(productDateFrom);
      fromDate.setHours(0, 0, 0, 0);
      if (new Date(prod.created_at) < fromDate) return false;
    }

    return true;
  });

  // Сортировка товаров по дате
  processedProducts = [...processedProducts].sort((a, b) => {
    const dateA = new Date(a.created_at);
    const dateB = new Date(b.created_at);
    return productSortDate === 'desc' ? dateB - dateA : dateA - dateB;
  });

  // Восстановление состояния из localStorage при загрузке
  useEffect(() => {
    if (userProfile?.role === 'admin' || userProfile?.role === 'manager') {
      const savedTab = localStorage.getItem('admin_last_tab');
      const savedViewMode = localStorage.getItem('admin_view_mode');

      if (savedTab) setActiveTab(savedTab);
      if (savedViewMode) setGlobalViewMode(savedViewMode);

      fetchData();
    }
  }, [userProfile]);

  // Сохранение активной вкладки в localStorage
  useEffect(() => {
    if (userProfile?.role === 'admin' || userProfile?.role === 'manager') {
      localStorage.setItem('admin_last_tab', activeTab);
    }
  }, [activeTab, userProfile]);

  // Сохранение режима отображения в localStorage
  useEffect(() => {
    if (userProfile?.role === 'admin' || userProfile?.role === 'manager') {
      localStorage.setItem('admin_view_mode', globalViewMode);
    }
  }, [globalViewMode, userProfile]);

  let processedRequests = requests.filter(req => {
    // Фильтр по поиску
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      if (
        !req.profiles?.name?.toLowerCase().includes(query) &&
        !req.profiles?.email?.toLowerCase().includes(query) &&
        !req.phone?.toLowerCase().includes(query) &&
        !req.message?.toLowerCase().includes(query)
      ) return false;
    }

    // Фильтр по статусу
    if (sortStatus && req.status !== sortStatus) {
      return false;
    }

    // Фильтр по дате создания заявок
    if (requestDateFrom) {
      const fromDate = new Date(requestDateFrom);
      fromDate.setHours(0, 0, 0, 0);
      if (new Date(req.created_at) < fromDate) return false;
    }
    if (requestDateTo) {
      const toDate = new Date(requestDateTo);
      toDate.setHours(23, 59, 59, 999);
      if (new Date(req.created_at) > toDate) return false;
    }

    return true;
  });

  // Сортировка по дате
  processedRequests = [...processedRequests].sort((a, b) => {
    const dateA = new Date(a.created_at);
    const dateB = new Date(b.created_at);
    return sortDate === 'desc' ? dateB - dateA : dateA - dateB;
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: reqData } = await supabase
        .from('requests')
        .select('*, profiles(name, email)')
        .order('created_at', { ascending: false });

      const { data: prodData } = await supabase
        .from('products')
        .select('*, categories(name)');

      const { data: catData } = await supabase
        .from('categories')
        .select('*, category_parameters (*)');

      const { data: usersData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: questionsData } = await supabase
        .from('product_questions')
        .select(`
          *,
          products(name, id),
          product_answers(*)
        `)
        .order('created_at', { ascending: false });

      setRequests(reqData || []);
      setProducts(prodData || []);
      setCategories(catData || []);
      setUsers(usersData || []);
      setQuestions(questionsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const [originalUser, setOriginalUser] = useState(null);

  const handleEditUser = (user) => {
    setEditingUser(user.id);
    const originalData = { name: user.name || '', email: user.email || '', role: user.role || 'user' };
    setOriginalUser(originalData);
    setUserForm(originalData);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch('https://mutebkvjowivxupnexzp.supabase.co/functions/v1/bright-processor', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: editingUser,
          data: userForm
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка сервера');
      }

      showSuccess('Пользователь успешно обновлен!');
      setEditingUser(null);
      setUserForm({ name: '', email: '', role: '' });
      fetchData();
    } catch (error) {
      console.error('Error updating user:', error);
      alert(`Ошибка при обновлении пользователя: ${error.message}`);
    }
  };

  const handleCancelUserEdit = () => {
    setEditingUser(null);
    setUserForm({ name: '', email: '', role: '' });
  };

  const [confirmModal, setConfirmModal] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const getStatusClass = (status) => {
    const classMap = {
      pending: styles.statusPending,
      in_progress: styles.statusInProgress,
      completed: styles.statusCompleted,
      rejected: styles.statusRejected
    };
    return classMap[status] || '';
  };

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Универсальный обработчик открытия модального подтверждения
  const openConfirmModal = (action, item) => {
    setConfirmModal({ action, item });
  };

  // Обработчик подтверждения действия
  const handleConfirmAction = async () => {
    if (!confirmModal) return;

    const { action, item } = confirmModal;

    try {
      switch (action) {
        case 'delete_product':
          await supabase.from('products').delete().eq('id', item.id);
          break;
        case 'delete_request':
          const sessionReq = await supabase.auth.getSession();

          await fetch('https://mutebkvjowivxupnexzp.supabase.co/functions/v1/delete-request', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${sessionReq.data.session.access_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ requestId: item.id })
          });
          break;
        case 'delete_user':
          const sessionUser = await supabase.auth.getSession();

          await fetch('https://mutebkvjowivxupnexzp.supabase.co/functions/v1/delete-user', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${sessionUser.data.session.access_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId: item.id })
          });
          break;

        case 'delete_question':
          const sessionQuestion = await supabase.auth.getSession();

          const questionResp = await fetch('https://mutebkvjowivxupnexzp.supabase.co/functions/v1/delete-question', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${sessionQuestion.data.session.access_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ questionId: item.id })
          });

          if (!questionResp.ok) {
            const err = await questionResp.json();
            throw new Error(err.error || 'Ошибка удаления вопроса');
          }
          break;
        case 'delete_answer':
          if (item.product_answers && item.product_answers.length > 0) {
            const answerId = item.product_answers[0].id;
            const { error } = await supabase
              .from('product_answers')
              .delete()
              .eq('id', answerId);
            
            if (error) throw error;
            
            // Сбрасываем статус вопроса на "не отвечен" и "не опубликован"
            const { error: updateError } = await supabase
              .from('product_questions')
              .update({ is_answered: false, is_published: false })
              .eq('id', item.id);
            
            if (updateError) throw updateError;
          }
          break;
        case 'delete_category':
          await supabase.from('categories').delete().eq('id', item.id);
          break;
        case 'reset_password':
          const sessionReset = await supabase.auth.getSession();

          const resetResp = await fetch('https://mutebkvjowivxupnexzp.supabase.co/functions/v1/reset-password', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${sessionReset.data.session.access_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId: item.id })
          });

          const resetResult = await resetResp.json();

          if (!resetResp.ok) {
            throw new Error(resetResult.error || 'Ошибка сброса пароля');
          }

          alert(resetResult.message);
          break;
        case 'cancel_edit_product':
          handleCancelEdit();
          break;
        case 'cancel_edit_user':
          handleCancelUserEdit();
          break;
        default:
          break;
      }

      fetchData();
    } catch (error) {
      console.error('Ошибка при выполнении действия:', error);
      alert('Ошибка при выполнении операции');
    } finally {
      setConfirmModal(null);
    }
  };

  const handleUpdateRequest = async (requestId) => {
    try {
      let finalStatus = requestStatus
      if (adminResponse.trim() && finalStatus === 'pending') {
        finalStatus = 'completed'
      }

      const { error } = await supabase
        .from('requests')
        .update({
          admin_response: adminResponse,
          status: finalStatus
        })
        .eq('id', requestId);

      if (error) throw error;

      setEditingRequest(null);
      setAdminResponse('');
      setRequestStatus('');
      fetchData();
      showSuccess('Статус заявки успешно обновлен!');
    } catch (error) {
      console.error('Error updating request:', error);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Выберите изображение');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Файл слишком большой (макс 5MB)');
      return;
    }

    // Создаем URL для превью и открываем кроппер
    const reader = new FileReader();
    reader.onload = (event) => {
      setOriginalImage(event.target.result);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Обработчик загрузки изображения в кроппере
  const handleCropperImageLoad = (e) => {
    const img = e.target;
    const width = img.offsetWidth;
    const height = img.offsetHeight;

    setImageDimensions({ width, height });

    // Рассчитываем размер рамки выбора по центру с правильным соотношением
    const tpl = CROP_TEMPLATES[cropTemplate] || CROP_TEMPLATES['3-4'];
    let selectionWidth, selectionHeight;

    if (width / height > tpl.ratio) {
      selectionHeight = height * 0.8;
      selectionWidth = selectionHeight * tpl.ratio;
    } else {
      selectionWidth = width * 0.8;
      selectionHeight = selectionWidth / tpl.ratio;
    }

    setCropSelection({
      x: (width - selectionWidth) / 2,
      y: (height - selectionHeight) / 2,
      width: selectionWidth,
      height: selectionHeight
    });
  };

  // Обработчики для перетаскивания рамки выбора
  const handleCropMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const target = e.target;

    if (target.classList.contains(styles.cropResizeHandle)) {
      setIsResizing(true);
      setResizeHandle(target.dataset.corner);
      const tpl = CROP_TEMPLATES[cropTemplate] || CROP_TEMPLATES['3-4'];
      setDragStart({
        x: e.clientX,
        y: e.clientY,
        selectionX: cropSelection.x,
        selectionY: cropSelection.y,
        selectionWidth: cropSelection.width,
        selectionHeight: cropSelection.height,
        ratio: tpl.ratio
      });
    } else {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - cropSelection.x,
        y: e.clientY - cropSelection.y
      });
    }
  };

  const handleCropMouseMove = (e) => {
    if (isDragging) {
      let newX = e.clientX - dragStart.x;
      let newY = e.clientY - dragStart.y;

      newX = Math.max(0, Math.min(newX, imageDimensions.width - cropSelection.width));
      newY = Math.max(0, Math.min(newY, imageDimensions.height - cropSelection.height));

      setCropSelection(prev => ({
        ...prev,
        x: newX,
        y: newY
      }));
    }

    if (isResizing) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      const RATIO = dragStart.ratio || (3 / 4);

      let newWidth = dragStart.selectionWidth;
      let newHeight = dragStart.selectionHeight;
      let newX = dragStart.selectionX;
      let newY = dragStart.selectionY;

      if (resizeHandle === 'br') {
        const scale = Math.min(deltaX / dragStart.selectionWidth, deltaY / dragStart.selectionHeight);
        newWidth = Math.max(100, dragStart.selectionWidth * (1 + scale));
        newHeight = newWidth / RATIO;
      } else if (resizeHandle === 'tl') {
        const scale = Math.min(-deltaX / dragStart.selectionWidth, -deltaY / dragStart.selectionHeight);
        newWidth = Math.max(100, dragStart.selectionWidth * (1 + scale));
        newHeight = newWidth / RATIO;
        newX = dragStart.selectionX + (dragStart.selectionWidth - newWidth);
        newY = dragStart.selectionY + (dragStart.selectionHeight - newHeight);
      } else if (resizeHandle === 'tr') {
        const scale = Math.min(deltaX / dragStart.selectionWidth, -deltaY / dragStart.selectionHeight);
        newWidth = Math.max(100, dragStart.selectionWidth * (1 + scale));
        newHeight = newWidth / RATIO;
        newY = dragStart.selectionY + (dragStart.selectionHeight - newHeight);
      } else if (resizeHandle === 'bl') {
        const scale = Math.min(-deltaX / dragStart.selectionWidth, deltaY / dragStart.selectionHeight);
        newWidth = Math.max(100, dragStart.selectionWidth * (1 + scale));
        newHeight = newWidth / RATIO;
        newX = dragStart.selectionX + (dragStart.selectionWidth - newWidth);
      }

      if (newX < 0) {
        newWidth += newX;
        newX = 0;
      }
      if (newY < 0) {
        newHeight += newY;
        newY = 0;
      }
      if (newX + newWidth > imageDimensions.width) {
        newWidth = imageDimensions.width - newX;
      }
      if (newY + newHeight > imageDimensions.height) {
        newHeight = imageDimensions.height - newY;
      }

      const finalRatio = newWidth / newHeight;
      if (finalRatio > RATIO) {
        newWidth = newHeight * RATIO;
      } else {
        newHeight = newWidth / RATIO;
      }

      if (newX + newWidth > imageDimensions.width) {
        newX = imageDimensions.width - newWidth;
      }
      if (newY + newHeight > imageDimensions.height) {
        newY = imageDimensions.height - newHeight;
      }

      newWidth = Math.max(100, newWidth);
      newHeight = Math.max(100 / RATIO, newHeight);

      setCropSelection({
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight
      });
    }
  };

  const handleCropMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  };

  // Функция обрезки изображения
  const handleCropConfirm = async () => {
    setUploading(true);

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.src = originalImage;

      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const scaleX = img.naturalWidth / imageDimensions.width;
      const scaleY = img.naturalHeight / imageDimensions.height;
      const tpl = CROP_TEMPLATES[cropTemplate] || CROP_TEMPLATES['3-4'];

      canvas.width = tpl.width;
      canvas.height = tpl.height;

      ctx.drawImage(
        img,
        cropSelection.x * scaleX,
        cropSelection.y * scaleY,
        cropSelection.width * scaleX,
        cropSelection.height * scaleY,
        0,
        0,
        tpl.width,
        tpl.height
      );

      const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/webp', 0.9);
      });

      const fileName = `${Date.now()}.webp`;
      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(fileName, blob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(fileName);

      setProductForm(prev => ({ ...prev, image_url: publicUrl }));
      setShowCropper(false);
      setOriginalImage(null);

    } catch (error) {
      console.error('Error cropping image:', error);
      alert('Ошибка при обработке изображения');
    } finally {
      setUploading(false);
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setOriginalImage(null);
    setIsDragging(false);
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      const paramsObj = { ...productParameters };
      Object.keys(paramsObj).forEach(key => {
        if (!paramsObj[key]?.trim()) delete paramsObj[key];
      });

      const hasParams = Object.keys(paramsObj).length > 0;

      let payload = {
        name: productForm.name,
        description: productForm.description,
        price: parseFloat(productForm.price),
        image_url: productForm.image_url,
        category_id: productForm.category_id ? parseInt(productForm.category_id) : null,
        stock: parseInt(productForm.stock) || 0,
        is_active: productForm.is_active
      };

      if (hasParams) {
        payload.parameters = JSON.stringify(paramsObj);
      }

      let { error } = await supabase
        .from('products')
        .insert(payload);

      if (error && error.code === 'PGRST204' && hasParams) {
        delete payload.parameters;
        error = null;
        const retryResult = await supabase.from('products').insert(payload);
        error = retryResult.error;
      }

      if (error) throw error;

      setProductForm({ name: '', description: '', price: '', image_url: '', category_id: '', stock: '', is_active: true });
      setProductParameters({});
      setShowProductForm(false);
      fetchData();
    } catch (error) {
      console.error('Error creating product:', error);
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product.id);
    setProductForm({
      name: product.name || '',
      description: product.description || '',
      price: product.price?.toString() || '',
      image_url: product.image_url || '',
      category_id: product.category_id?.toString() || '',
      stock: product.stock?.toString() || '',
      is_active: product.is_active ?? true
    });
    if (product.parameters) {
      try {
        setProductParameters(JSON.parse(product.parameters));
      } catch (e) {
        setProductParameters({});
      }
    } else {
      setProductParameters({});
    }
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      const paramsObj = { ...productParameters };
      Object.keys(paramsObj).forEach(key => {
        if (!paramsObj[key]?.trim()) delete paramsObj[key];
      });

      const hasParams = Object.keys(paramsObj).length > 0;

      const updatePayload = {
        name: productForm.name,
        description: productForm.description,
        price: parseFloat(productForm.price),
        image_url: productForm.image_url,
        category_id: productForm.category_id ? parseInt(productForm.category_id) : null,
        stock: parseInt(productForm.stock) || 0,
        is_active: productForm.is_active
      };

      if (hasParams) {
        updatePayload.parameters = JSON.stringify(paramsObj);
      }

      let { error } = await supabase
        .from('products')
        .update(updatePayload)
        .eq('id', editingProduct);

      if (error && error.code === 'PGRST204') {
        delete updatePayload.parameters;
        error = null;
        const retryResult = await supabase
          .from('products')
          .update(updatePayload)
          .eq('id', editingProduct);
        error = retryResult.error;
      }

      if (error) throw error;

      setEditingProduct(null);
      setProductForm({ name: '', description: '', price: '', image_url: '', category_id: '', stock: '', is_active: true });
      setProductParameters({});
      fetchData();
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setProductForm({ name: '', description: '', price: '', image_url: '', category_id: '', stock: '', is_active: true });
    setProductParameters({});
  };

  // Обработчики категорий
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('categories')
        .insert({
          name: categoryForm.name,
          description: categoryForm.description
        });

      if (error) throw error;

      setCategoryForm({ name: '', description: '' });
      setShowCategoryForm(false);
      fetchData();
    } catch (error) {
      console.error('Error creating category:', error);
    }
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    if (!editingCategory) return;

    try {
      const { error } = await supabase
        .from('categories')
        .update({
          name: categoryForm.name,
          description: categoryForm.description
        })
        .eq('id', editingCategory);

      if (error) throw error;

      setEditingCategory(null);
      setCategoryForm({ name: '', description: '' });
      setShowCategoryForm(false);
      fetchData();
    } catch (error) {
      console.error('Error updating category:', error);
    }
  };

  // Обработчики параметров категорий
  const handleCreateParameter = async (e, categoryId) => {
    e.preventDefault();
    if (!parameterForm.name.trim()) {
      alert('Название параметра обязательно');
      return;
    }

    try {
      const { error } = await supabase
        .from('category_parameters')
        .insert({
          category_id: categoryId,
          name: parameterForm.name.trim(),
          unit: parameterForm.unit.trim()
        });

      if (error) throw error;

      setParameterForm({ category_id: null, name: '', unit: '' });
      setShowParameterForm(prev => ({ ...prev, [categoryId]: false }));
      fetchData();
      showSuccess('Параметр успешно создан');
    } catch (error) {
      console.error('Error creating parameter:', error);
      alert('Ошибка при создании параметра');
    }
  };

  const handleUpdateParameter = async (e) => {
    e.preventDefault();
    if (!editingParameter) return;

    try {
      const { error } = await supabase
        .from('category_parameters')
        .update({
          name: parameterForm.name.trim(),
          unit: parameterForm.unit.trim()
        })
        .eq('id', editingParameter);

      if (error) throw error;

      setEditingParameter(null);
      setParameterForm({ category_id: null, name: '', unit: '' });
      fetchData();
      showSuccess('Параметр успешно обновлен');
    } catch (error) {
      console.error('Error updating parameter:', error);
      alert('Ошибка при обновлении параметра');
    }
  };

  const handleDeleteParameter = async (parameterId) => {
    if (!window.confirm('Вы действительно хотите удалить этот параметр?')) return;

    try {
      const { error } = await supabase
        .from('category_parameters')
        .delete()
        .eq('id', parameterId);

      if (error) throw error;

      fetchData();
      showSuccess('Параметр успешно удален');
    } catch (error) {
      console.error('Error deleting parameter:', error);
      alert('Ошибка при удалении параметра');
    }
  };

  const handleEditParameter = (categoryId, param) => {
    setEditingParameter(param.id);
    setParameterForm({
      category_id: categoryId,
      name: param.name,
      unit: param.unit || ''
    });
  };

  const getStatusText = (status) => {
    const statusMap = {
      pending: 'Ожидает',
      in_progress: 'В работе',
      completed: 'Выполнена',
      rejected: 'Отклонена'
    };
    return statusMap[status] || status;
  };

  if (userProfile?.role !== 'admin' && userProfile?.role !== 'manager') {
    return <div className={styles.accessDenied}>Доступ только для администраторов и менеджеров</div>;
  }

  if (loading) {
    return <div className={styles.loading}>Загрузка...</div>;
  }

  return (
    <div className={styles.adminContainer}>
      <h1 className={styles.title}>Панель администратора</h1>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'requests' ? styles.active : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          Заявки ({requests.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'products' ? styles.active : ''}`}
          onClick={() => setActiveTab('products')}
        >
          Товары ({products.length})
        </button>
         <button
           className={`${styles.tab} ${activeTab === 'categories' ? styles.active : ''}`}
           onClick={() => setActiveTab('categories')}
         >
           Категории ({categories.length})
         </button>
        {userProfile?.role === 'admin' && (
          <button
            className={`${styles.tab} ${activeTab === 'users' ? styles.active : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Пользователи ({users.length})
          </button>
        )}
        <button
          className={`${styles.tab} ${activeTab === 'questions' ? styles.active : ''}`}
          onClick={() => setActiveTab('questions')}
        >
          Вопросы ({questions.length})
        </button>
      </div>

      {activeTab === 'requests' && (
        <div className={styles.requestsSection}>
          <div className={styles.filtersBar}>
            <div className={styles.searchWrapper}>
              <img src="/images/ico/icoLupa.png" alt="Поиск" className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Поиск по заявкам (имя, почта, телефон, сообщение)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            <select
              value={sortStatus}
              onChange={(e) => setSortStatus(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">Все статусы</option>
              <option value="pending">Ожидает</option>
              <option value="in_progress">В работе</option>
              <option value="completed">Выполнена</option>
              <option value="rejected">Отклонена</option>
            </select>

            <select
              value={sortDate}
              onChange={(e) => setSortDate(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="desc">Сначала новые</option>
              <option value="asc">Сначала старые</option>
            </select>

            <input
              type="date"
              value={requestDateFrom}
              onChange={(e) => setRequestDateFrom(e.target.value)}
              className={styles.dateInput}
              placeholder="От даты"
            />
            <input
              type="date"
              value={requestDateTo}
              onChange={(e) => setRequestDateTo(e.target.value)}
              className={styles.dateInput}
              placeholder="До даты"
            />

            <span className={styles.searchCount}>Всего: {processedRequests.length}</span>

            <button
              onClick={() => setGlobalViewMode(globalViewMode === 'list' ? 'grid' : 'list')}
              className={styles.viewToggleBtn}
            >
              <img src="/images/ico/icoMain.png" alt="Вид" className={styles.viewIcon} />
            </button>
          </div>

          <RequestsSection
            processedRequests={processedRequests}
            globalViewMode={globalViewMode}
            expandedMessages={expandedMessages}
            setExpandedMessages={setExpandedMessages}
            editingRequest={editingRequest}
            setEditingRequest={setEditingRequest}
            adminResponse={adminResponse}
            setAdminResponse={setAdminResponse}
            requestStatus={requestStatus}
            setRequestStatus={setRequestStatus}
            handleUpdateRequest={handleUpdateRequest}
            openConfirmModal={openConfirmModal}
            getStatusClass={getStatusClass}
            getStatusText={getStatusText}
            showSuccess={showSuccess}
          />
        </div>
      )}

      {activeTab === 'products' && (
        <div className={styles.productsSection}>
          <ProductsSection
            processedProducts={processedProducts}
            globalViewMode={globalViewMode}
            setGlobalViewMode={setGlobalViewMode}
            categories={categories}
            expandedDescriptions={expandedDescriptions}
            setExpandedDescriptions={setExpandedDescriptions}
            handleEditProduct={handleEditProduct}
            openConfirmModal={openConfirmModal}
            showProductForm={showProductForm}
            editingProduct={editingProduct}
            productFormState={productForm}
            setProductFormState={setProductForm}
            productParameters={productParameters}
            setProductParameters={setProductParameters}
            handleCreateProduct={handleCreateProduct}
            handleUpdateProduct={handleUpdateProduct}
            handleCancelEdit={handleCancelEdit}
            handleImageUpload={handleImageUpload}
            uploading={uploading}
            getCategoryParamsForForm={getCategoryParamsForForm}
            setShowProductForm={setShowProductForm}
            setEditingProduct={setEditingProduct}
            // Фильтры товаров
            productSearch={productSearch}
            setProductSearch={setProductSearch}
            productCategory={productCategory}
            setProductCategory={setProductCategory}
            productActive={productActive}
            setProductActive={setProductActive}
            productSortDate={productSortDate}
            setProductSortDate={setProductSortDate}
            productDateFrom={productDateFrom}
            setProductDateFrom={setProductDateFrom}
          />
        </div>
      )}

      {activeTab === 'categories' && (
        <div className={styles.categoriesSection}>
          <CategoriesSection
            processedCategories={processedCategories}
            products={products}
            expandedDescriptions={expandedDescriptions}
            setExpandedDescriptions={setExpandedDescriptions}
            editingCategory={editingCategory}
            setEditingCategory={setEditingCategory}
            categoryForm={categoryForm}
            setCategoryForm={setCategoryForm}
            showCategoryForm={showCategoryForm}
            setShowCategoryForm={setShowCategoryForm}
            handleCreateCategory={handleCreateCategory}
            handleUpdateCategory={handleUpdateCategory}
            openConfirmModal={openConfirmModal}
            // Фильтры категорий
            categorySearch={categorySearch}
            setCategorySearch={setCategorySearch}
            // Параметры категорий
            expandedParams={expandedParams}
            setExpandedParams={setExpandedParams}
            showParameterForm={showParameterForm}
            setShowParameterForm={setShowParameterForm}
            editingParameter={editingParameter}
            setEditingParameter={setEditingParameter}
            parameterForm={parameterForm}
            setParameterForm={setParameterForm}
            handleCreateParameter={handleCreateParameter}
            handleUpdateParameter={handleUpdateParameter}
            handleEditParameter={handleEditParameter}
            handleDeleteParameter={handleDeleteParameter}
            // Режим отображения
            globalViewMode={globalViewMode}
            setGlobalViewMode={setGlobalViewMode}
          />
        </div>
      )}

      {activeTab === 'users' && userProfile?.role === 'admin' && (
        <div className={styles.usersSection}>
          <UsersSection
            processedUsers={processedUsers}
            globalViewMode={globalViewMode}
            setGlobalViewMode={setGlobalViewMode}
            editingUser={editingUser}
            setEditingUser={setEditingUser}
            userForm={userForm}
            setUserForm={setUserForm}
            originalUser={originalUser}
            setOriginalUser={setOriginalUser}
            handleEditUser={handleEditUser}
            handleUpdateUser={handleUpdateUser}
            handleCancelUserEdit={handleCancelUserEdit}
            openConfirmModal={openConfirmModal}
            // Фильтры пользователей
            userSearch={userSearch}
            setUserSearch={setUserSearch}
            userRoleFilter={userRoleFilter}
            setUserRoleFilter={setUserRoleFilter}
          />
        </div>
      )}

      {activeTab === 'questions' && (
        <div className={styles.questionsSection}>
          <div className={styles.filtersBar}>
            <div className={styles.searchWrapper}>
              <img src="/images/ico/icoLupa.png" alt="Поиск" className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Поиск по вопросам..."
                value={questionSearch}
                onChange={(e) => setQuestionSearch(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            <select
              value={questionStatusFilter}
              onChange={(e) => setQuestionStatusFilter(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">Все вопросы</option>
              <option value="new">Новые / На модерации</option>
              <option value="published">Опубликованные</option>
              <option value="answered">С ответом</option>
            </select>

            <span className={styles.searchCount}>
              {
                questions.filter(q => {
                  if (!questionSearch.trim()) return true;
                  const query = questionSearch.toLowerCase();
                  return (
                    q.user_name?.toLowerCase().includes(query) ||
                    q.question?.toLowerCase().includes(query) ||
                    q.products?.name?.toLowerCase().includes(query)
                  );
                }).filter(q => {
                  if (!questionStatusFilter) return true;
                  if (questionStatusFilter === 'new') return !q.is_published;
                  if (questionStatusFilter === 'published') return q.is_published;
                  if (questionStatusFilter === 'answered') return q.is_answered;
                  return true;
                }).length
              }
            </span>

            <button
              onClick={() => setGlobalViewMode(globalViewMode === 'list' ? 'grid' : 'list')}
              className={styles.viewToggleBtn}
            >
              <img src="/images/ico/icoMain.png" alt="Вид" className={styles.viewIcon} />
            </button>
          </div>

          <QuestionsSection
            questions={questions}
            products={products}
            questionSearch={questionSearch}
            setQuestionSearch={setQuestionSearch}
            questionStatusFilter={questionStatusFilter}
            setQuestionStatusFilter={setQuestionStatusFilter}
            editingQuestion={editingQuestion}
            setEditingQuestion={setEditingQuestion}
            answerText={answerText}
            setAnswerText={setAnswerText}
            hoveredProduct={hoveredProduct}
            setHoveredProduct={setHoveredProduct}
            openConfirmModal={openConfirmModal}
            fetchData={fetchData}
            showSuccess={showSuccess}
            user={user}
            userProfile={userProfile}
            globalViewMode={globalViewMode}
            setGlobalViewMode={setGlobalViewMode}
          />
        </div>
      )}

      {/* Уведомление об успехе */}
      {successMessage && (
        <div className={styles.successNotification}>
          {successMessage}
        </div>
      )}

      {/* Модальное окно подтверждения действий */}
      {confirmModal && (
        <ConfirmModal
          isOpen={!!confirmModal}
          onClose={() => setConfirmModal(null)}
          onConfirm={handleConfirmAction}
          title="Подтверждение действия"
          message={
            confirmModal.action === 'delete_product' ? `Вы действительно хотите удалить товар "${confirmModal.item.name}"? Это действие нельзя отменить.` :
            confirmModal.action === 'delete_request' ? `Вы действительно хотите удалить заявку от ${confirmModal.item.profiles?.name}?` :
            confirmModal.action === 'delete_user' ? `Вы действительно хотите удалить пользователя "${confirmModal.item.name}"?` :
            confirmModal.action === 'reset_password' ? `Отправить ссылку для сброса пароля на email ${confirmModal.item.email}?` :
            confirmModal.action === 'cancel_edit_product' ? 'Отменить редактирование товара? Все несохраненные изменения будут потеряны.' :
            confirmModal.action === 'cancel_edit_user' ? 'Отменить редактирование пользователя? Все несохраненные изменения будут потеряны.' :
            confirmModal.action === 'delete_category' ? `Вы действительно хотите удалить категорию "${confirmModal.item.name}"? Товары в этой категории останутся без категории.` :
            confirmModal.action === 'delete_answer' ? 'Вы действительно хотите удалить ответ у этого вопроса?' :
            ''
          }
          confirmText="Подтвердить"
        />
      )}

      {/* Модальное окно для обрезки изображения */}
      <ImageCropper
        showCropper={showCropper}
        originalImage={originalImage}
        cropSelection={cropSelection}
        imageDimensions={imageDimensions}
        uploading={uploading}
        handleCropCancel={handleCropCancel}
        handleCropConfirm={handleCropConfirm}
        handleCropMouseDown={handleCropMouseDown}
        handleCropMouseMove={handleCropMouseMove}
        handleCropMouseUp={handleCropMouseUp}
        handleCropperImageLoad={handleCropperImageLoad}
        cropTemplate={cropTemplate}
        setCropTemplate={setCropTemplate}
      />
    </div>
  );
};

export default Admin;