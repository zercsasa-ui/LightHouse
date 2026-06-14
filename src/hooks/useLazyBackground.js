import { useEffect, useRef, useState } from 'react';

/**
 * Хук для ленивой загрузки фоновых изображений (background-image).
 * Устанавливает backgroundImage только когда элемент появляется во viewport.
 */
const useLazyBackground = (imageUrl) => {
  const ref = useRef(null);
  const [bgUrl, setBgUrl] = useState(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || !imageUrl) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setBgUrl(imageUrl);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' } // Начинаем загрузку за 200px до появления
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [imageUrl]);

  return { ref, bgUrl };
};

export default useLazyBackground;