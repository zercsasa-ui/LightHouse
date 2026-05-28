import { useEffect, useRef, useState } from 'react';

/**
 * Хук для анимации появления элементов при скролле
 * @param {Object} options
 * @param {number} options.threshold - Порог видимости (0-1)
 * @param {string} options.rootMargin - Отступы для срабатывания
 * @param {boolean} options.triggerOnce - Сработать только один раз (по умолчанию true)
 * @returns {{ ref: React.RefObject, isVisible: boolean }}
 */
export default function useScrollReveal(options = {}) {
  const {
    threshold = 0.15,
    rootMargin = '0px 0px -60px 0px',
    triggerOnce = true,
  } = options;

  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce]);

  return { ref, isVisible };
}