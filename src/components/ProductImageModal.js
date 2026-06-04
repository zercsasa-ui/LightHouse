import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from '../pages/Product.module.css';

const ProductImageModal = ({ show, onClose, imageUrl, productName }) => {
  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [show]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!show) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [show, onClose]);

  if (!show) return null;

  return createPortal(
    <div className={styles.imageModal} onClick={onClose}>
      <button
        className={`${styles.imageModalBtn} ${styles.imageModalPrev}`}
        onClick={(e) => {
          e.stopPropagation();
          // Тут можно будет добавить переключение между фото товара
        }}
      >
        ←
      </button>

      <div className={styles.imageModalImage} onClick={(e) => e.stopPropagation()}>
        <img
          src={imageUrl || 'https://via.placeholder.com/600x400'}
          alt={productName}
        />
      </div>

      <button
        className={`${styles.imageModalBtn} ${styles.imageModalNext}`}
        onClick={(e) => {
          e.stopPropagation();
          // Тут можно будет добавить переключение между фото товара
        }}
      >
        →
      </button>

      <button className={styles.imageModalClose} onClick={onClose}>✕</button>
    </div>,
    document.body
  );
};

export default ProductImageModal;