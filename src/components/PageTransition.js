import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import styles from './PageTransition.module.css';

const PageTransition = ({ children, collapseKey }) => {
  const location = useLocation();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [stage, setStage] = useState('enter');
  const prevPath = useRef(location.pathname);
  const prevCollapseKey = useRef(collapseKey);

  const triggerAnimation = (newChildren) => {
    // Начинаем fade-out текущего содержимого
    setStage('exit');

    const exitTimer = setTimeout(() => {
      // Меняем содержимое (уже незаметно для пользователя)
      setDisplayChildren(newChildren);
      // Начинаем fade-in нового содержимого
      setStage('enter');
    }, 250); // длительность fade-out

    return () => clearTimeout(exitTimer);
  };

  useEffect(() => {
    if (location.pathname !== prevPath.current) {
      prevPath.current = location.pathname;
      prevCollapseKey.current = collapseKey;
      return triggerAnimation(children);
    }
  }, [location.pathname, children, collapseKey]);

  useEffect(() => {
    if (collapseKey !== prevCollapseKey.current) {
      const pathChanged = location.pathname !== prevPath.current;
      prevCollapseKey.current = collapseKey;
      if (!pathChanged) {
        return triggerAnimation(children);
      }
    }
  }, [collapseKey, children, location.pathname]);

  // Если это первый рендер (нет prevPath), сразу показываем
  useEffect(() => {
    if (!prevPath.current && displayChildren !== children) {
      setDisplayChildren(children);
      prevPath.current = location.pathname;
      prevCollapseKey.current = collapseKey;
    }
  }, [children, displayChildren, location.pathname, collapseKey]);

  return (
    <div className={`${styles.transition} ${styles[stage]}`}>
      {displayChildren}
    </div>
  );
};

export default PageTransition;