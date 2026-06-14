import { memo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useComparison } from '../context/ComparisonContext';
import useLazyBackground from '../hooks/useLazyBackground';
import styles from '../pages/Catalog.module.css';

// Мемоизированная карточка товар товара - не перерисовывается при фильтрации
const ProductCard = memo(({ product }) => {
  const navigate = useNavigate();
  const { comparisonItems, addToComparison, removeFromComparison } = useComparison();

  // 是否已预加载
  const preloadedRef = useRef(false);
  const timerRef = useRef(null);

  const isInComparison = comparisonItems.some(item => item.id === product.id);
  const { ref: lazyBgRef, bgUrl } = useLazyBackground(product.image_url || 'https://via.placeholder.com/300x200');

  // 预加载
  const doPreload = useCallback(async () => {
    if (preloadedRef.current) return;
    preloadedRef.current = true;

    try {
      await supabase
        .from('products')
        .select('*')
        .eq('id', product.id)
        .single();

      console.log(`  Товар ${product.id} предзагружен`);
    } catch (e) {
      // Тихо игнорируем ошибки предзагрузки
    }
  }, [product.id]);

  const handleMouseEnter = useCallback(() => {
    // Отменяем предыдущий таймер, если мышь ушла
    if (timerRef.current) clearTimeout(timerRef.current);

    // Запускаем предзагрузку через 1 секунду
    timerRef.current = setTimeout(doPreload, 1000);
  }, [doPreload]);

  const handleMouseLeave = useCallback(() => {
    // Отменяем таймер, если мышь ушла раньше 1секунды
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleComparisonToggle = (e) => {
    e.stopPropagation();
    if (isInComparison) {
      removeFromComparison(product.id);
    } else {
      addToComparison(product);
    }
  };

  const handleCardClick = () => {
    navigate(`/product/${product.id}`);
  };

  return (
   
<div
      className={styles.productCard}
      onClick={handleCardClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={doPreload}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') handleCardClick(); }}
    >
      <div className={styles.imageContainer}>
        <div
          ref={lazyBgRef}
          className={styles.productImageBg}
          style={bgUrl ? { backgroundImage: `url(${bgUrl})` } : {}}
        />
        <div className={styles.productImageOverlay} />
        <img
          src={product.image_url || 'https://via.placeholder.com/300x200'}
          alt={product.name}
          className={styles.productImage}
          loading="lazy"
          width="300"
          height="200"
        />
      </div>
      <div className={styles.productInfo}>
        <h3 className={styles.productName}>{product.name}</h3>
        <p className={styles.productDescription}>{product.description}</p>
        <div className={styles.productFooter}>
          <span className={styles.productPrice}>{product.price} ₽</span>
          <div className={styles.rating}>
            {'★'.repeat(Math.round(product.rating))}{'☆'.repeat(5 - Math.round(product.rating))}
            <span className={styles.ratingCount}>({product.rating_count})</span>
          </div>
        </div>
        <div className={styles.categoryInfo}>
          <span className={styles.productCategory}>{product.categories?.name || 'Без категории'}</span>
        </div>
        <div className={styles.stockInfo}>
          {product.stock > 0 ? (
            <span className={styles.inStock}>В наличии: {product.stock} шт.</span>
          ) : (
            <span className={styles.outOfStock}>Нет в наличии</span>
          )}
        </div>
        <button
          className={`${styles.comparisonBtn} ${isInComparison ? styles.comparisonBtnActive : ''}`}
          onClick={handleComparisonToggle}
          title={isInComparison ? 'Удалить из сравнения' : 'Добавить к сравнению'}
        >
          {isInComparison ? '✓ В сравнении' : '⚖ Сравнить'}
        </button>
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;