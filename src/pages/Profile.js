import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import styles from './Profile.module.css';

const Profile = () => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [userQuestions, setUserQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [userRequests, setUserRequests] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Доступные аватарки
  const avatars = ['😎', '👽', '🦊', '🐱'];
  
  const [currentAvatar, setCurrentAvatar] = useState('U');
  const [showAvatarHint, setShowAvatarHint] = useState(() => {
    return localStorage.getItem('avatar_hidden') !== 'true';
  });

  // Обновляем аватар когда пользователь загрузится
  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`avatar_${user.id}`);
      setCurrentAvatar(saved || user.email?.charAt(0).toUpperCase() || 'U');
    }
  }, [user]);

  // Загрузка вопросов которые задал пользователь
  useEffect(() => {
    const loadUserQuestions = async () => {
      if (!user) return;
      setQuestionsLoading(true);

      try {
        const { data } = await supabase
          .from('product_questions')
          .select(`
            *,
            products(name, id),
            product_answers(*)
          `)
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

  // Загрузка заявок пользователя и уведомлений
  useEffect(() => {
    const loadUserRequests = async () => {
      if (!user) return;

      try {
      const { data } = await supabase
        .from('requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

        // Получаем прочитанные из localStorage
        const readIds = JSON.parse(localStorage.getItem('read_notifications') || '[]');
        
        // Подмешиваем статус прочитанности локально
        const withReadStatus = (data || []).map(req => ({
          ...req,
          notification_viewed: readIds.includes(req.id)
        }));

        setUserRequests(withReadStatus);
        
        // Считаем непрочитанные ответы
        const unread = withReadStatus.filter(req => req.admin_response && !req.notification_viewed).length || 0;
        setUnreadCount(unread);
      } catch (e) {
        console.error('Ошибка загрузки заявок:', e);
      }
    };

    loadUserRequests();
  }, [user]);

  // Отметить уведомление как прочитанное
  const markAsViewed = async (requestId) => {
    try {
      // Сохраняем прочитанные уведомления в localStorage
      const readIds = JSON.parse(localStorage.getItem('read_notifications') || '[]');
      if (!readIds.includes(requestId)) {
        readIds.push(requestId);
        localStorage.setItem('read_notifications', JSON.stringify(readIds));
      }
      
      setUserRequests(prev => prev.map(req => 
        req.id === requestId ? { ...req, notification_viewed: true } : req
      ));
      
      // Обновляем счётчик
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Переход на страницу заявок
      navigate('/admin');
    } catch (e) {
      console.error('Ошибка отметки прочитанного:', e);
    }
  };

  useEffect(() => {
    const loadFavorites = async () => {
      setLoading(true);
      
      if (!user) {
        // Для гостей подтягиваем из localStorage
        const savedFavorites = localStorage.getItem('light-favorites');
        if (savedFavorites) {
          setFavorites(JSON.parse(savedFavorites));
        }
        setLoading(false);
        return;
      }

      // Для авторизованных подтягиваем из БД
      try {
        const { data } = await supabase
          .from('favorites')
          .select(`
            *,
            products (*)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (data) {
          // Форматируем данные в привычный формат
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
      // Для гостей
      const newFavorites = favorites.filter(item => item.id !== id);
      setFavorites(newFavorites);
      localStorage.setItem('light-favorites', JSON.stringify(newFavorites));
      return;
    }

    // Для авторизованных
    try {
      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', id);

      // Обновляем локальное состояние
      setFavorites(favorites.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error remove favorite:', error);
    }
  };

  return (
    <div className={styles.profileContainer}>
      <h1 className={styles.title}>Профиль</h1>

      {user ? (
        <div className={styles.userInfo}>
        <div className={styles.avatar} onClick={() => setShowAvatarPicker(!showAvatarPicker)}>
          {currentAvatar}
          {unreadCount > 0 && <span className={styles.notificationBadge}>{unreadCount}</span>}
        </div>
         <div className={styles.userDetails}>
           <h2 className={styles.userName}>{userProfile?.name || 'Пользователь'}</h2>
           <p className={styles.userEmail}>{user.email}</p>
           <p className={styles.date}>Зарегистрирован: {new Date(user.created_at).toLocaleDateString('ru-RU')}</p>
            
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
                        localStorage.setItem(`avatar_${user.id}`, emoji);
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
        </div>
      ) : (
        <div className={styles.guestMessage}>
          <p>Вы вошли как гость</p>
          <p className={styles.note}>Избранные товары сохраняются только на этом устройстве</p>
        </div>
      )}

      <div className={styles.section}>
        <h2>Избранные товары ({favorites.length})</h2>

        {loading ? (
          <div className={styles.emptyState}>
            <p>Загрузка избранных товаров...</p>
          </div>
        ) : favorites.length === 0 ? (
          <div className={styles.emptyState}>
            <p>У вас пока нет сохранённых товаров</p>
            <p className={styles.note}>Нажмите ❤️ на товаре чтобы добавить сюда</p>
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
                  <p className={styles.price}>{product.price} ₽</p>
                </div>
                <button 
                  className={styles.removeBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromFavorites(product.id);
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
       </div>

       {/* Секция мои вопросы */}
       <div className={styles.section}>
         <h2>Мои вопросы о товарах ({userQuestions.length})</h2>

         {questionsLoading ? (
           <div className={styles.emptyState}>
             <p>Загрузка вопросов...</p>
           </div>
         ) : userQuestions.length === 0 ? (
           <div className={styles.emptyState}>
             <p>Вы еще не задавали вопросы о товарах</p>
             <p className={styles.note}>Все ваши вопросы будут отображаться здесь</p>
           </div>
         ) : (
           <div className={styles.questionsList}>
             {userQuestions.map(q => (
                <div 
                  key={q.id} 
                  className={styles.questionItem}
                  onClick={() => navigate(`/product/${q.products.id}#question-${q.id}`)}
                  style={{cursor: 'pointer'}}
                >
                 <div className={styles.questionHeader}>
                   <span 
                     className={styles.questionProduct}
                     onClick={() => navigate(`/product/${q.products.id}`)}
                   >
                     📦 {q.products.name}
                   </span>
                   <span className={styles.questionDate}>
                     {new Date(q.created_at).toLocaleDateString('ru-RU')}
                   </span>
                   {q.is_answered && <span className={styles.answeredBadge}>✅ Отвечено</span>}
                   {!q.is_published && <span className={styles.moderationBadge}>⏳ На модерации</span>}
                 </div>
                 
                 <p className={styles.questionText}>{q.question}</p>

                 {/* Ответ на вопрос */}
                 {q.product_answers?.map(answer => (
                   <div key={answer.id} className={styles.answerBlock}>
                     <span className={styles.answerAuthor}>👤 {answer.responder_name}</span>
                     <p className={styles.answerText}>{answer.answer_text}</p>
                   </div>
                 ))}
               </div>
             ))}
           </div>
         )}
       </div>

       {/* Секция уведомлений / ответы на заявки */}
       <div className={styles.section}>
         <h2>Уведомления {unreadCount > 0 && <span className={styles.unreadBadge}>Новых: {unreadCount}</span>}</h2>

         {userRequests.filter(r => r.admin_response).length === 0 ? (
           <div className={styles.emptyState}>
             <p>У вас пока нет уведомлений</p>
             <p className={styles.note}>Когда администратор ответит на вашу заявку - уведомление появится здесь</p>
           </div>
         ) : (
           <div className={styles.notificationsList}>
             {userRequests.filter(r => r.admin_response).map(req => (
               <div 
                 key={req.id} 
                 className={`${styles.notificationItem} ${!req.notification_viewed ? styles.unread : ''}`}
                 onClick={() => !req.notification_viewed && markAsViewed(req.id)}
               >
                 <div className={styles.notificationHeader}>
                   <span className={styles.notificationIcon}><img src="/images/ico/icoDone.png" alt="" /></span>
                   <span className={styles.notificationDate}>
                     {new Date(req.created_at).toLocaleDateString('ru-RU')}
                   </span>
                   {!req.notification_viewed && <span className={styles.newBadge}>НОВОЕ</span>}
                 </div>
                 
                 <p className={styles.notificationText}>
                   ✅ Получен ответ на вашу заявку от {new Date(req.created_at).toLocaleDateString('ru-RU')}
                 </p>
                 
                 <div className={styles.notificationAnswer}>
                   <p>{req.admin_response}</p>
                 </div>
               </div>
             ))}
           </div>
         )}
       </div>

      </div>
    );
  };

export default Profile;