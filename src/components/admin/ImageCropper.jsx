import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from '../../pages/Admin.module.css';

const CROP_TEMPLATES = [
  { id: '3-4', label: 'Вертикальный 3:4', ratio: 3 / 4, width: 600, height: 800 },
  { id: '1-1', label: 'Квадрат 1:1', ratio: 1, width: 600, height: 600 },
  { id: '4-3', label: 'Горизонтальный 4:3', ratio: 4 / 3, width: 800, height: 600 },
  { id: '16-9', label: 'Широкий 16:9', ratio: 16 / 9, width: 960, height: 540 },
];

const ImageCropper = ({
  showCropper,
  originalImage,
  cropSelection,
  imageDimensions,
  uploading,
  handleCropCancel,
  handleCropConfirm,
  handleCropMouseDown,
  handleCropMouseMove,
  handleCropMouseUp,
  handleCropperImageLoad,
  cropTemplate,
  setCropTemplate,
}) => {
  // Блокировка скролла body
  useEffect(() => {
    if (showCropper) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showCropper]);

  // Закрытие по Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!showCropper) return;
      if (e.key === 'Escape') {
        handleCropCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCropper, handleCropCancel]);

  if (!showCropper) return null;

  const currentTemplate = CROP_TEMPLATES.find(t => t.id === cropTemplate) || CROP_TEMPLATES[0];

  const modal = (
    <div
      className={styles.cropperOverlay}
      onClick={handleCropCancel}
      onMouseMove={handleCropMouseMove}
      onMouseUp={handleCropMouseUp}
      onMouseLeave={handleCropMouseUp}
    >
      <div
        className={styles.cropperModal}
        onClick={(e) => e.stopPropagation()}
      >
        <button className={styles.cropperCloseBtn} onClick={handleCropCancel} type="button">
          ✕
        </button>

        <h3 className={styles.cropperTitle}>Обрезка изображения</h3>

        {/* Выбор шаблона обрезки */}
        <div className={styles.cropTemplateSelector}>
          {CROP_TEMPLATES.map(tpl => (
            <button
              key={tpl.id}
              type="button"
              className={`${styles.cropTemplateBtn} ${cropTemplate === tpl.id ? styles.cropTemplateActive : ''}`}
              onClick={() => setCropTemplate(tpl.id)}
            >
              <span className={styles.cropTemplatePreview} style={{
                aspectRatio: `${tpl.ratio}`,
                width: tpl.ratio >= 1 ? '40px' : '30px'
              }} />
              <span className={styles.cropTemplateLabel}>{tpl.label}</span>
            </button>
          ))}
        </div>

        <p className={styles.cropperHint}>
          Итоговый размер: {currentTemplate.width}×{currentTemplate.height} px
        </p>

        <div className={styles.cropperImageWrapper}>
          <img
            src={originalImage}
            alt="Original"
            className={styles.cropperImage}
            onLoad={handleCropperImageLoad}
            draggable={false}
          />

          {/* Рамка выбора области */}
          <div
            className={styles.cropSelection}
            style={{
              left: cropSelection.x,
              top: cropSelection.y,
              width: cropSelection.width,
              height: cropSelection.height
            }}
            onMouseDown={handleCropMouseDown}
          >
            <div className={styles.cropGrid}>
              <div className={styles.cropGridLine} style={{ top: '33.33%' }} />
              <div className={styles.cropGridLine} style={{ top: '66.66%' }} />
              <div className={styles.cropGridLine} style={{ left: '33.33%', width: '1px', height: '100%', top: 0 }} />
              <div className={styles.cropGridLine} style={{ left: '66.66%', width: '1px', height: '100%', top: 0 }} />
            </div>
            <div className={`${styles.cropResizeHandle} ${styles.cropHandleTL}`} data-corner="tl" onMouseDown={handleCropMouseDown} />
            <div className={`${styles.cropResizeHandle} ${styles.cropHandleTR}`} data-corner="tr" onMouseDown={handleCropMouseDown} />
            <div className={`${styles.cropResizeHandle} ${styles.cropHandleBL}`} data-corner="bl" onMouseDown={handleCropMouseDown} />
            <div className={`${styles.cropResizeHandle} ${styles.cropHandleBR}`} data-corner="br" onMouseDown={handleCropMouseDown} />
          </div>

          {/* Затемнение вокруг выбранной области */}
          <div className={styles.cropOverlay} style={{
            clipPath: `
              0% 0%, 0% 100%,
              ${cropSelection.x}px 100%, ${cropSelection.x}px ${cropSelection.y}px,
              ${cropSelection.x + cropSelection.width}px ${cropSelection.y}px, ${cropSelection.x + cropSelection.width}px ${cropSelection.y + cropSelection.height}px,
              ${cropSelection.x}px ${cropSelection.y + cropSelection.height}px, ${cropSelection.x}px 100%,
              100% 100%, 100% 0%
            `
          }} />
        </div>

        <div className={styles.cropperActions}>
          <button className={styles.cropperCancelBtn} onClick={handleCropCancel} type="button">
            Отмена
          </button>
          <button className={styles.cropperConfirmBtn} onClick={handleCropConfirm} disabled={uploading} type="button">
            {uploading ? 'Обработка...' : `Сохранить ${currentTemplate.width}×${currentTemplate.height}`}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

export default ImageCropper;