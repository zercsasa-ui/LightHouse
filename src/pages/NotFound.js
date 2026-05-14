import { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './NotFound.module.css';

const videoSrc = process.env.PUBLIC_URL + '/images/ico/Возьми телефон детка Toxis оригинал мема.mp4';

export default function NotFound() {
  const videoRef = useRef(null);
  const fallbackRef = useRef(false);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    vid.muted = false;
    vid.play().catch(() => {
      fallbackRef.current = true;
      vid.muted = true;
      vid.play().catch(() => {});
    });

    const enableSound = () => {
      if (!fallbackRef.current) return;
      vid.muted = false;
      vid.play().catch(() => {});
      document.removeEventListener('click', enableSound);
      document.removeEventListener('touchstart', enableSound);
    };

    document.addEventListener('click', enableSound, { once: true });
    document.addEventListener('touchstart', enableSound, { once: true });

    return () => {
      document.removeEventListener('click', enableSound);
      document.removeEventListener('touchstart', enableSound);
    };
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.code}>
        <span className={styles.codeFour}>4</span>
        <div className={styles.videoCircle}>
          <video
            ref={videoRef}
            src={videoSrc}
            autoPlay
            loop
            playsInline
            controls={false}
          />
        </div>
        <span className={styles.codeFour}>4</span>
      </div>
      <h1 className={styles.title}>Страница не найдена</h1>
      <p className={styles.description}>
        Запрашиваемая страница не существует или была перемещена.
        Проверьте URL или вернитесь на главную.
      </p>
      <Link to="/" className={styles.homeLink}>
        Вернуться на главную
        <span className={styles.arrow}>→</span>
      </Link>
    </div>
  );
}