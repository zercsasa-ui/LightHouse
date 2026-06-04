import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from '../pages/Home.module.css';

const HomeLightbox = ({
  isOpen,
  onClose,
  currentImage,
  setCurrentImage,
  previewImages,
  galleryImages
}) => {
  const allImages = [...previewImages, ...galleryImages];

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        setCurrentImage(prev => prev === 0 ? allImages.length - 1 : prev - 1);
      } else if (e.key === 'ArrowRight') {
        setCurrentImage(prev => prev === allImages.length - 1 ? 0 : prev + 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, setCurrentImage, allImages.length]);

  if (!isOpen) return null;

  return createPortal(
    <div className={styles.lightbox} onClick={onClose}>
      <button
        className={`${styles.lightboxBtn} ${styles.lightboxPrev}`}
        onClick={(e) => {
          e.stopPropagation();
          setCurrentImage(prev => prev === 0 ? allImages.length - 1 : prev - 1);
        }}
      >
        ←
      </button>

      <div className={styles.lightboxImage} onClick={(e) => e.stopPropagation()}>
        <img
          src={allImages[currentImage]}
          alt={`Ассортимент ${currentImage + 1}`}
        />
        <div className={styles.lightboxCounter}>
          {currentImage + 1} / {allImages.length}
        </div>
      </div>

      <button
        className={`${styles.lightboxBtn} ${styles.lightboxNext}`}
        onClick={(e) => {
          e.stopPropagation();
          setCurrentImage(prev => prev === allImages.length - 1 ? 0 : prev + 1);
        }}
      >
        →
      </button>

      <button className={styles.lightboxClose} onClick={onClose}>
        ✕
      </button>
    </div>,
    document.body
  );
};

export default HomeLightbox;