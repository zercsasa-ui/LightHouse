import styles from '../../pages/Admin.module.css';

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
  handleCropperImageLoad
}) => {
  if (!showCropper) return null;

  return (
    <div className={styles.cropperOverlay} onMouseMove={handleCropMouseMove} onMouseUp={handleCropMouseUp} onMouseLeave={handleCropMouseUp}>
      <div className={styles.cropperContainer}>
        <h3 className={styles.cropperTitle}>Выберите область для фотографии</h3>
        <p className={styles.cropperHint}>Фотографии всех товаров будут одинакового размера 600×800 px</p>

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
            <div className={`${styles.cropResizeHandle} ${styles.cropHandleTL}`} data-corner="tl" onMouseDown={handleCropMouseDown}></div>
            <div className={`${styles.cropResizeHandle} ${styles.cropHandleTR}`} data-corner="tr" onMouseDown={handleCropMouseDown}></div>
            <div className={`${styles.cropResizeHandle} ${styles.cropHandleBL}`} data-corner="bl" onMouseDown={handleCropMouseDown}></div>
            <div className={`${styles.cropResizeHandle} ${styles.cropHandleBR}`} data-corner="br" onMouseDown={handleCropMouseDown}></div>
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
          }}></div>
        </div>

        <div className={styles.cropperActions}>
          <button className={styles.cropperCancelBtn} onClick={handleCropCancel}>Отмена</button>
          <button className={styles.cropperConfirmBtn} onClick={handleCropConfirm} disabled={uploading}>
            {uploading ? 'Обработка...' : 'Использовать эту область'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;