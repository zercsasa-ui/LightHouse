import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import styles from './PageTransition.module.css';

const PageTransition = ({ children }) => {
  const location = useLocation();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [stage, setStage] = useState('enter');
  const prevPath = useRef(location.pathname);

  useEffect(() => {
    if (location.pathname === prevPath.current) return;

    // Начинаем fade-out текущего содержимого
    setStage('exit');

    const exitTimer = setTimeout(() => {
      // Меняем содержимое (уже незаметно для пользователя)
      setDisplayChildren(children);
      prevPath.current = location.pathname;
      // Начинаем fade-in нового содержимого
      setStage('enter');
    }, 250); // длительность fade-out

    return () => clearTimeout(exitTimer);
  }, [location.pathname, children]);

  // Если это первый рендер (нет prevPath), сразу показываем
  useEffect(() => {
    if (!prevPath.current && displayChildren !== children) {
      setDisplayChildren(children);
      prevPath.current = location.pathname;
    }
  }, [children, displayChildren, location.pathname]);

  return (
    <div className={`${styles.transition} ${styles[stage]}`}>
      {displayChildren}
    </div>
  );
};

export default PageTransition;