import { memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useComparison } from '../context/ComparisonContext';
import styles from '../pages/Catalog.module.css';

//   Мемоизированная карточка товара - не перерисовывается при фильтрации
const ProductCard = memo(({ product }) => {
  const navigate = useNavigate();
  const { comparisonItems, addToComparison, removeFromComparison } = useComparison();

  //   Предзагрузка товара в кеш при наведении курсора
  const preloadProduct = useCallback(async () => {
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

  const isInComparison = comparisonItems.some(item => item.id === product.id);

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
      onMouseEnter={preloadProduct}
      onFocus={preloadProduct}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') handleCardClick(); }}
    >
      <div className={styles.imageContainer}>
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