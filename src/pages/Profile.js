import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import styles from './Profile.module.css';

const Profile = () => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('favorites');
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [userQuestions, setUserQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [userRequests, setUserRequests] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Состояния для сворачивания/разворачивания
  const [collapsedQuestions, setCollapsedQuestions] = useState({});
  const [collapsedNotifications, setCollapsedNotifications] = useState({});
  
  // Состояния для поиска
  const [questionsSearch, setQuestionsSearch] = useState('');
  const [notificationsSearch, setNotificationsSearch] = useState('');
  
  // Состояния для сортировки ('newest' - новые сначала, 'oldest' - старые сначала)
  const [questionsSort, setQuestionsSort] = useState('newest');
  const [notificationsSort, setNotificationsSort] = useState('newest');

  const avatars = ['😎', '👽', '🦊', '🐱'];

  const [currentAvatar, setCurrentAvatar] = useState('U');
  const [showAvatarHint, setShowAvatarHint] = useState(() => {
    return localStorage.getItem('avatar_hidden') !== 'true';
  });

  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`avatar_${user.id}`);
      setCurrentAvatar(saved || user.email?.charAt(0).toUpperCase() || 'U');
    }
  }, [user]);

  useEffect(() => {
    const loadUserQuestions = async () => {
      if (!user) return;
      setQuestionsLoading(true);
      try {
        const { data } = await supabase
          .from('product_questions')
          .select(`*, products(name, id), product_answers(*)`)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        setUserQuestions(data || []);
      } catch (e) {
        console.error('Ошибка загрузки вопросов:', e);
      } finally {
        setQuestionsLoading(false);
      }
    };
    loadUserQuestions();
  }, [user]);

  useEffect(() => {
    const loadUserRequests = async () => {
      if (!user) return;
      try {
        const { data } = await supabase
          .from('requests')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        const readIds = JSON.parse(localStorage.getItem('read_notifications') || '[]');
        const withReadStatus = (data || []).map(req => ({
          ...req,
          notification_viewed: readIds.includes(req.id)
        }));
        setUserRequests(withReadStatus);
        const unread = withReadStatus.filter(req => req.admin_response && !req.notification_viewed).length || 0;
        setUnreadCount(unread);
      } catch (e) {
        console.error('Ошибка загрузки заявок:', e);
      }
    };
    loadUserRequests();
  }, [user]);

  useEffect(() => {
    const highlightTargetRequest = () => {
      if (window.location.hash.startsWith('#request-')) {
        const requestId = window.location.hash.replace('#request-', '');
        setTimeout(() => {
          const targetElement = document.querySelector(`[data-request-id="${requestId}"]`);
          if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            targetElement.classList.add('highlight-request');
            setTimeout(() => targetElement.classList.remove('highlight-request'), 3000);
          }
        }, 300);
      }
    };
    highlightTargetRequest();
    window.addEventListener('hashchange', highlightTargetRequest);
    return () => window.removeEventListener('hashchange', highlightTargetRequest);
  }, [userRequests]);

  const markAsViewed = async (requestId) => {
    try {
      const readIds = JSON.parse(localStorage.getItem('read_notifications') || '[]');
      if (!readIds.includes(requestId)) {
        readIds.push(requestId);
        localStorage.setItem('read_notifications', JSON.stringify(readIds));
        setUserRequests(prev => prev.map(req =>
          req.id === requestId ? { ...req, notification_viewed: true } : req
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      navigate(`/requests#request-${requestId}`);
    } catch (e) {
      console.error('Ошибка отметки прочитанного:', e);
    }
  };

  useEffect(() => {
    const loadFavorites = async () => {
      setLoading(true);
      if (!user) {
        const savedFavorites = localStorage.getItem('light-favorites');
        if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
        setLoading(false);
        return;
      }
      try {
        const { data } = await supabase
          .from('favorites')
          .select(`*, products (*)`)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (data) {
          const formatted = data.map(item => ({
            id: item.products.id,
            name: item.products.name,
            price: item.products.price,
            image: item.products.image_url
          }));
          setFavorites(formatted);
        }
      } catch (error) {
        console.error('Error load favorites:', error);
      } finally {
        setLoading(false);
      }
    };
    loadFavorites();
  }, [user]);

  const removeFromFavorites = async (id) => {
    if (!user) {
      const newFavorites = favorites.filter(item => item.id !== id);
      setFavorites(newFavorites);
      localStorage.setItem('light-favorites', JSON.stringify(newFavorites));
      return;
    }
    try {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('product_id', id);
      setFavorites(favorites.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error remove favorite:', error);
    }
  };

  // Фильтрация и сортировка вопросов
  const sortedQuestions = [...userQuestions].sort((a, b) => {
    const dateA = new Date(a.created_at);
    const dateB = new Date(b.created_at);
    return questionsSort === 'newest' ? dateB - dateA : dateA - dateB;
  });

  const filteredQuestions = sortedQuestions.filter(q => {
    if (!questionsSearch.trim()) return true;
    const searchLower = questionsSearch.toLowerCase();
    return (
      q.products?.name?.toLowerCase().includes(searchLower) ||
      q.question.toLowerCase().includes(searchLower)
    );
  });

  // Фильтрация и сортировка уведомлений
  const notificationsWithResponse = userRequests.filter(r => r.admin_response);
  const sortedNotifications = [...notificationsWithResponse].sort((a, b) => {
    const dateA = new Date(a.created_at);
    const dateB = new Date(b.created_at);
    return notificationsSort === 'newest' ? dateB - dateA : dateA - dateB;
  });

  const filteredNotifications = sortedNotifications.filter(r => {
    if (!notificationsSearch.trim()) return true;
    const searchLower = notificationsSearch.toLowerCase();
    return (
      r.admin_response.toLowerCase().includes(searchLower) ||
      r.description?.toLowerCase().includes(searchLower)
    );
  });

  // Переключение сворачивания вопроса
  const toggleQuestionCollapse = (questionId, e) => {
    e.stopPropagation();
    setCollapsedQuestions(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  // Переключение сворачивания уведомления
  const toggleNotificationCollapse = (requestId, e) => {
    e.stopPropagation();
    setCollapsedNotifications(prev => ({
      ...prev,
      [requestId]: !prev[requestId]
    }));
  };

  const stats = [
    { label: 'Избранное', value: favorites.length || 0 },
    { label: 'Вопросы', value: userQuestions.length || 0 },
    { label: 'Уведомления', value: unreadCount || 0 },
  ];

  // Навигационные табы
  const tabs = [
    { id: 'favorites', label: 'Избранные товары', count: favorites.length },
    { id: 'questions', label: 'Вопросы', count: userQuestions.length },
    { id: 'notifications', label: 'Уведомления', count: unreadCount, badge: unreadCount > 0 },
  ];

  return (
    <div className={styles.profileContainer}>
      {/* Шапка профиля */}
      <div className={styles.profileHeader}>
        <div className={styles.avatarSection}>
          <div className={styles.avatar} onClick={() => setShowAvatarPicker(!showAvatarPicker)}>
            {currentAvatar}
            {unreadCount > 0 && <span className={styles.notificationBadge}>{unreadCount}</span>}
          </div>

          {showAvatarHint && (
            <div className={styles.avatarHint}>
              <span>💡 Нажмите на аватар чтобы сменить его</span>
              <button onClick={() => {
                setShowAvatarHint(false);
                localStorage.setItem('avatar_hidden', 'true');
              }}>✕</button>
            </div>
          )}

          {showAvatarPicker && (
            <div className={styles.avatarPicker}>
              <p>Выберите аватар:</p>
              <div className={styles.avatarList}>
                {avatars.map((emoji, index) => (
                  <span
                    key={index}
                    className={currentAvatar === emoji ? styles.avatarSelected : ''}
                    onClick={() => {
                      setCurrentAvatar(emoji);
                      localStorage.setItem(`avatar_${user?.id}`, emoji);
                      setShowAvatarPicker(false);
                    }}
                  >
                    {emoji}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={styles.headerInfo}>
          {user ? (
            <>
              <h1 className={styles.headerName}>{userProfile?.name || 'Пользователь'}</h1>
              <p className={styles.headerEmail}>{user.email}</p>
              <p className={styles.headerDate}>Зарегистрирован: {new Date(user.created_at).toLocaleDateString('ru-RU')}</p>
            </>
          ) : (
            <>
              <h1 className={styles.headerName}>Гость</h1>
              <p className={styles.headerEmail}>Вы вошли как гость</p>
              <p className={styles.headerDate}>Избранные товары сохраняются только на этом устройстве</p>
            </>
          )}
        </div>

        <div className={styles.statsRow}>
          {stats.map((stat, i) => (
            <div key={i} className={styles.statCard}>
              <span className={styles.statValue}>{stat.value}</span>
              <span className={styles.statLabel}>{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Навигационное меню */}
      <nav className={styles.tabsNav}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`${styles.tabBtn} ${activeSection === tab.id ? styles.tabActive : ''}`}
            onClick={() => setActiveSection(tab.id)}
          >
            <span>{tab.label}</span>
            {tab.badge && <span className={styles.tabBadge}>{tab.count}</span>}
            {!tab.badge && tab.count > 0 && <span className={styles.tabCount}>{tab.count}</span>}
          </button>
        ))}
      </nav>

      {/* Контент — активная секция */}
      <div className={styles.sectionContent}>
        {/* ИЗБРАННЫЕ ТОВАРЫ */}
        {activeSection === 'favorites' && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Избранные товары</h2>

            {loading ? (
              <div className={styles.emptyState}>
                <p>Загрузка избранных товаров...</p>
              </div>
            ) : favorites.length === 0 ? (
              <div className={styles.emptyState}>
                <p>У вас пока нет сохранённых товаров</p>
                <p className={styles.note}>Нажмите на значок сердца на товаре чтобы добавить его сюда</p>
              </div>
            ) : (
              <div className={styles.favoritesGrid}>
                {favorites.map(product => (
                  <div key={product.id} className={styles.favoriteCard} onClick={() => navigate(`/product/${product.id}`)}>
                    <div className={styles.cardImage}>
                      <img src={product.image || 'https://via.placeholder.com/300x200'} alt={product.name} />
                    </div>
                    <div className={styles.cardBody}>
                      <h4>{product.name}</h4>
                      <p className={styles.price}>{product.price}</p>
                    </div>
                    <button
                      className={styles.removeBtn}
                      onClick={(e) => { e.stopPropagation(); removeFromFavorites(product.id); }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ВОПРОСЫ */}
        {activeSection === 'questions' && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Вопросы о товарах</h2>
              {userQuestions.length > 0 && (
                <div className={styles.controlsRow}>
                  <div className={styles.searchContainer}>
                    <input
                      type="text"
                      className={styles.searchInput}
                      placeholder="Поиск вопросов..."
                      value={questionsSearch}
                      onChange={(e) => setQuestionsSearch(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className={styles.searchIcon}></span>
                  </div>
                  <button
                    className={styles.sortBtn}
                    onClick={() => setQuestionsSort(prev => prev === 'newest' ? 'oldest' : 'newest')}
                    title={questionsSort === 'newest' ? 'Сначала старые' : 'Сначала новые'}
                  >
                    {questionsSort === 'newest' ? '↑ Новые' : '↓ Старые'}
                  </button>
                </div>
              )}
            </div>

            {questionsLoading ? (
              <div className={styles.emptyState}>
                <p>Загрузка вопросов...</p>
              </div>
            ) : userQuestions.length === 0 ? (
              <div className={styles.emptyState}>
                <p>Вы еще не задавали вопросы о товарах</p>
                <p className={styles.note}>Все ваши вопросы будут отображаться здесь</p>
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className={styles.emptyState}>
                <p>По вашему запросу ничего не найдено</p>
              </div>
            ) : (
              <div className={styles.questionsList}>
                {filteredQuestions.map(q => {
                  const isCollapsed = collapsedQuestions[q.id];
                  return (
                    <div
                      key={q.id}
                      className={styles.questionItem}
                    >
                      <div className={styles.questionHeader}>
                        <span 
                          className={styles.questionProduct} 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/product/${q.products.id}`);
                          }}
                        >
                          {q.products.name}
                        </span>
                        <span className={styles.questionDate}>
                          {new Date(q.created_at).toLocaleDateString('ru-RU')}
                        </span>
                        {q.is_answered && <span className={styles.answeredBadge}>Отвечено</span>}
                        {!q.is_published && <span className={styles.moderationBadge}>На модерации</span>}
                        <button
                          className={styles.collapseBtn}
                          onClick={(e) => toggleQuestionCollapse(q.id, e)}
                          title={isCollapsed ? 'Развернуть' : 'Свернуть'}
                        >
                          {isCollapsed ? '▼' : '▲'}
                        </button>
                      </div>
                      {!isCollapsed && (
                        <>
                          <p className={styles.questionText}>{q.question}</p>
                          <div className={styles.questionActions}>
                            <button
                              className={styles.viewProductBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/product/${q.products.id}#question-${q.id}`);
                              }}
                            >
                              Перейти к вопросу
                            </button>
                          </div>
                          {q.product_answers?.map(answer => (
                            <div key={answer.id} className={styles.answerBlock}>
                              <span className={styles.answerAuthor}>{answer.responder_name}</span>
                              <p className={styles.answerText}>{answer.answer_text}</p>
                            </div>
                          ))}
                        </>
                      )}
                      {isCollapsed && (
                        <div className={styles.collapsedPreview}>
                          <span>{q.question.length > 60 ? q.question.substring(0, 60) + '...' : q.question}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* УВЕДОМЛЕНИЯ */}
        {activeSection === 'notifications' && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Уведомления</h2>
              {userRequests.filter(r => r.admin_response).length > 0 && (
                <div className={styles.controlsRow}>
                  <div className={styles.searchContainer}>
                    <input
                      type="text"
                      className={styles.searchInput}
                      placeholder="Поиск уведомлений..."
                      value={notificationsSearch}
                      onChange={(e) => setNotificationsSearch(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className={styles.searchIcon}></span>
                  </div>
                  <button
                    className={styles.sortBtn}
                    onClick={() => setNotificationsSort(prev => prev === 'newest' ? 'oldest' : 'newest')}
                    title={notificationsSort === 'newest' ? 'Сначала старые' : 'Сначала новые'}
                  >
                    {notificationsSort === 'newest' ? '↑ Новые' : '↓ Старые'}
                  </button>
                </div>
              )}
            </div>

            {userRequests.filter(r => r.admin_response).length === 0 ? (
              <div className={styles.emptyState}>
                <p>У вас пока нет уведомлений</p>
                <p className={styles.note}>Когда администратор ответит на вашу заявку — уведомление появится здесь</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className={styles.emptyState}>
                <p>По вашему запросу ничего не найдено</p>
              </div>
            ) : (
              <div className={styles.notificationsList}>
                {filteredNotifications.map(req => {
                  const isCollapsed = collapsedNotifications[req.id];
                  return (
                    <div
                      key={req.id}
                      data-request-id={req.id}
                      className={`${styles.notificationItem} ${!req.notification_viewed ? styles.unread : ''}`}
                    >
                      <div className={styles.notificationHeader}>
                        <span className={styles.notificationDate}>
                          {new Date(req.created_at).toLocaleDateString('ru-RU')}
                        </span>
                        {!req.notification_viewed && <span className={styles.newBadge}>НОВОЕ</span>}
                        <button
                          className={styles.collapseBtn}
                          onClick={(e) => toggleNotificationCollapse(req.id, e)}
                          title={isCollapsed ? 'Развернуть' : 'Свернуть'}
                        >
                          {isCollapsed ? '▼' : '▲'}
                        </button>
                      </div>
                      {!isCollapsed && (
                        <>
                          <p className={styles.notificationText}>Получен ответ на вашу заявку</p>
                          <div className={styles.notificationAnswer}>
                            <p>{req.admin_response}</p>
                          </div>
                          <div className={styles.questionActions}>
                            <button
                              className={styles.viewProductBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsViewed(req.id);
                              }}
                            >
                              Перейти к заявке
                            </button>
                          </div>
                        </>
                      )}
                      {isCollapsed && (
                        <div className={styles.collapsedPreview}>
                          <span>{req.admin_response.length > 80 ? req.admin_response.substring(0, 80) + '...' : req.admin_response}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default Profile;