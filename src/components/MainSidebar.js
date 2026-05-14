import { NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useComparison } from '../context/ComparisonContext';
import { preloadCatalog, supabase } from '../supabase';
import styles from './MainSidebar.module.css';
import ConfirmModal from './ConfirmModal';

const MainSidebar = ({ isCollapsed, setIsCollapsed }) => {
  const { userProfile, user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = userProfile?.role === 'admin';
  const isLoggedIn = !!user;
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { showComparisonNotification, notificationMessage, comparisonItems } = useComparison();

  // Загрузка количества непрочитанных уведомлений
  useEffect(() => {
    const loadUnreadCount = async () => {
      if (!user) return;

      try {
        const { data } = await supabase
          .from('requests')
          .select('*')
          .eq('user_id', user.id);

        const readIds = JSON.parse(localStorage.getItem('read_notifications') || '[]');
        const unread = (data || []).filter(req => req.admin_response && !readIds.includes(req.id)).length;
        setUnreadCount(unread);
      } catch (e) {
        console.error('Ошибка загрузки счётчика уведомлений:', e);
      }
    };

    loadUnreadCount();

    // Обновляем счётчик каждые 30 секунд
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const spans = document.querySelectorAll(`.${styles.sidebarLink} span, .${styles.logoutButton} span, .${styles.loginButton} span`);

    spans.forEach(el => {
      el.style.transition = 'none';
      el.style.opacity = '0';
      el.style.transform = 'translateX(-20px)';
      void el.offsetHeight; // force reflow
    });

    if (!isCollapsed) {
      setTimeout(() => {
        spans.forEach(el => {
          el.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
          el.style.opacity = '1';
          el.style.transform = 'translateX(0)';
        });
      }, 150);
    }
  }, [isCollapsed]);

  // Handle mouse wheel scrolling for bottom menu
  useEffect(() => {
    const sidebarNav = document.querySelector(`.${styles.sidebarNav}`);
    if (!sidebarNav) return;

    const handleWheel = (e) => {
      // Check if we're in mobile view (menu at bottom)
      const isMobileView = window.innerWidth <= 720;

      if (isMobileView) {
        // Only handle wheel events when mouse is over the sidebar navigation
        const rect = sidebarNav.getBoundingClientRect();
        const isOverSidebar = (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        );

        if (isOverSidebar && e.deltaY) {
          e.preventDefault();
          sidebarNav.scrollLeft += e.deltaY;
        }
      }
    };

    // Add event listener to the document
    document.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      document.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Принудительно разворачиваем сайдбар при перемещении меню вниз (<=720px)
  useEffect(() => {
    const checkMobileView = () => {
      if (window.innerWidth <= 720 && isCollapsed) {
        setIsCollapsed(false);
      }
    };

    // Проверяем сразу при монтировании
    checkMobileView();

    // Следим за изменением размера окна
    window.addEventListener('resize', checkMobileView);
    return () => window.removeEventListener('resize', checkMobileView);
  }, [isCollapsed, setIsCollapsed]);

  const handleLogout = async () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    try {
      await logout();
      setTimeout(() => {
        navigate('/auth', { replace: true });
      }, 100);
    } catch (error) {
      console.error('Ошибка при выходе:', error);
      navigate('/auth', { replace: true });
    }
  };

  return (
    <>
      <nav className={`${styles.sidebar} ${isCollapsed ? styles.sidebarCollapsed : ''} ${isMobileMenuOpen ? styles.sidebarMobileOpen : ''}`}>
        <button className={styles.toggleButton} onClick={() => {
          if (window.innerWidth <= 720) return; // Отключаем сворачивание на мобильных
          setIsCollapsed(!isCollapsed);
        }}>
          {isCollapsed ? '→' : '←'}
        </button>

        {/* Кнопка бургер для мобильных */}
        <button className={styles.burgerButton} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          <span className={`${styles.burgerLine} ${isMobileMenuOpen ? styles.burgerLineOpen : ''}`}></span>
        </button>

        <div className={styles.sidebarHeader}>
          {!isCollapsed && <h2>LightHouse</h2>}
          {isCollapsed && <img src="/images/ico/icoLogo.png" alt="Logo" className={styles.logoIcon} onClick={() => setIsCollapsed(false)} />}
          {userProfile ? (
            <div className={styles.userInfo}>
              <span className={styles.userName}>{userProfile.name}</span>
              <span className={styles.userRole}>
                {userProfile.role === 'admin' ? 'Админ' : userProfile.role === 'manager' ? 'Менеджер' : 'Пользователь'}
              </span>
            </div>
          ) : (
            <div className={styles.guestInfo}>
              <span className={styles.guestText}>Гость</span>
            </div>
          )}
        </div>
        <ul className={`${styles.sidebarNav} ${isMobileMenuOpen ? styles.sidebarNavMobileOpen : ''}`}>
          <li>
              <NavLink
                to="/"
                end
                title={isCollapsed ? 'Главная' : ''}
                className={({ isActive }) => isActive ? `${styles.sidebarLink} ${styles.sidebarLinkActive}` : styles.sidebarLink}
              >
                <img src="/images/ico/icoMain.png" alt="" className={styles.linkIcon} />
                {!isCollapsed && <span>Главная</span>}
              </NavLink>
          </li>
          <li>
              <NavLink
                to="/catalog"
                onMouseEnter={() => preloadCatalog()}
                onFocus={() => preloadCatalog()}
                title={isCollapsed ? 'Каталог' : ''}
                className={({ isActive }) => isActive ? `${styles.sidebarLink} ${styles.sidebarLinkActive}` : styles.sidebarLink}
              >
                <img src="/images/ico/icoCatalog.png" alt="" className={styles.linkIcon} />
                {!isCollapsed && <span>Каталог</span>}
              </NavLink>
          </li>
          <li>
              <NavLink
                to="/contacts"
                title={isCollapsed ? 'Контакты' : ''}
                className={({ isActive }) => isActive ? `${styles.sidebarLink} ${styles.sidebarLinkActive}` : styles.sidebarLink}
              >
                <img src="/images/ico/icoKontakt.png" alt="" className={styles.linkIcon} />
                {!isCollapsed && <span>Контакты</span>}
              </NavLink>
          </li>
          <li>
              <NavLink
                to="/calculator"
                title={isCollapsed ? 'Калькулятор' : ''}
                className={({ isActive }) => isActive ? `${styles.sidebarLink} ${styles.sidebarLinkActive}` : styles.sidebarLink}
              >
                <img src="/images/ico/calcumIco.png" alt="" className={styles.linkIcon} />
                {!isCollapsed && <span>Калькулятор</span>}
              </NavLink>
          </li>
          <li>
              <NavLink
                to="/comparison"
                title={isCollapsed ? 'Сравнение' : ''}
                className={({ isActive }) => isActive ? `${styles.sidebarLink} ${styles.sidebarLinkActive}` : styles.sidebarLink}
              >
                <div className={styles.iconWrapper}>
                  <img src="/images/ico/IcoVesi.png" alt="" className={styles.linkIcon} />
                  {comparisonItems.length > 0 && <span className={styles.notificationBadge}>{comparisonItems.length}</span>}
                </div>
                {!isCollapsed && <span>Сравнение</span>}
              </NavLink>
          </li>
          <li>
              <NavLink
                to="/profile"
                title={isCollapsed ? 'Профиль' : ''}
                className={({ isActive }) => isActive ? `${styles.sidebarLink} ${styles.sidebarLinkActive}` : styles.sidebarLink}
              >
                <div className={styles.iconWrapper}>
                  <img src="/images/ico/icoProfile.png" alt="" className={styles.linkIcon} />
                  {unreadCount > 0 && <span className={styles.notificationBadge}>{unreadCount}</span>}
                </div>
                {!isCollapsed && <span>Профиль</span>}
              </NavLink>
          </li>
          {isLoggedIn && (
            <>
              <li>
                <NavLink
                  to="/requests"
                  title={isCollapsed ? 'Заявки' : ''}
                  className={({ isActive }) => isActive ? `${styles.sidebarLink} ${styles.sidebarLinkActive}` : styles.sidebarLink}
                >
                  <img src="/images/ico/icoRequiest.png" alt="" className={styles.linkIcon} />
                  {!isCollapsed && <span>Заявки</span>}
                </NavLink>
              </li>
              {isAdmin && (
                <li>
                  <NavLink
                    to="/admin"
                    title={isCollapsed ? 'Админ-панель' : ''}
                    className={({ isActive }) => isActive ? `${styles.sidebarLink} ${styles.sidebarLinkActive}` : styles.sidebarLink}
                  >
                    <img src="/images/ico/icoAdmin.png" alt="" className={styles.linkIcon} />
                    {!isCollapsed && <span>Админ-панель</span>}
                  </NavLink>
                </li>
              )}
            </>
          )}
          <li className={styles.mobileOnlyBtn}>
            {isLoggedIn ? (
              <button className={styles.logoutButton} onClick={handleLogout} title={isCollapsed ? 'Выйти' : ''}>
                <img src="/images/ico/icologout.png" alt="" className={styles.buttonIcon} />
                <span>Выйти</span>
              </button>
            ) : (
              <button className={styles.loginButton} onClick={() => navigate('/auth')} title={isCollapsed ? 'Войти' : ''}>
                <img src="/images/ico/icoAvtorize.png" alt="" className={styles.buttonIcon} />
                <span>Войти</span>
              </button>
            )}
          </li>
        </ul>
        <div className={styles.sidebarFooter}>
          {isLoggedIn ? (
            <button className={styles.logoutButton} onClick={handleLogout} title={isCollapsed ? 'Выйти' : ''}>
              <img src="/images/ico/icologout.png" alt="" className={styles.buttonIcon} />
              {!isCollapsed && <span>Выйти</span>}
            </button>
          ) : (
            <button className={styles.loginButton} onClick={() => navigate('/auth')} title={isCollapsed ? 'Войти' : ''}>
              <img src="/images/ico/icoAvtorize.png" alt="" className={styles.buttonIcon} />
              {!isCollapsed && <span>Войти</span>}
            </button>
          )}
        </div>
      </nav>

      {/* Модальное окно подтверждения выхода */}
      {showLogoutModal && (
        <ConfirmModal
          isOpen={showLogoutModal}
          onClose={() => setShowLogoutModal(false)}
          onConfirm={confirmLogout}
          title="Выход из аккаунта"
          message="Вы действительно хотите выйти из аккаунта?"
          confirmText="Выйти"
        />
      )}
      {showComparisonNotification && (
        <div className={styles.comparisonNotification}>
          {notificationMessage}
        </div>
      )}
    </>
  );
};

export default MainSidebar;