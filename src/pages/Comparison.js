import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useComparison } from '../context/ComparisonContext';
import styles from './Comparison.module.css';

const Comparison = () => {
  const { comparisonItems, removeFromComparison, clearComparison } = useComparison();
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (comparisonItems.length === 0) {
      setLoading(false);
      return;
    }

    // Проверяем что все товары загружены с полными данными
    const allItemsLoaded = comparisonItems.every(item =>
      item.id && item.name && item.price && item.categories
    );

    if (allItemsLoaded) {
      setLoading(false);
    }
  }, [comparisonItems]);

  // Определяем лучший товар по сумме рейтинга и обратной цене
  const getBestItemIndex = () => {
    if (comparisonItems.length < 2) return -1;
    
    const scores = comparisonItems.map(item => {
      const priceScore = item.price ? 1 / item.price : 0;
      const ratingScore = (item.rating || 0) / 5;
      return priceScore * 0.4 + ratingScore * 0.6;
    });

    const maxScore = Math.max(...scores);
    return scores.indexOf(maxScore);
  };

  // Находим минимальную цену среди товаров
  const getMinPrice = () => {
    const prices = comparisonItems.map(item => item.price).filter(Boolean);
    return prices.length > 0 ? Math.min(...prices) : null;
  };

  const bestItemIndex = getBestItemIndex();
  const minPrice = getMinPrice();

  // Извлекаем все уникальные параметры для сравнения
  const getAllParameters = () => {
    const parameters = new Set();

    comparisonItems.forEach(item => {
      if (item.parameters) {
        try {
          const params = JSON.parse(item.parameters);
          Object.keys(params).forEach(key => parameters.add(key));
        } catch (e) {
          console.error('Error parsing parameters:', e);
        }
      }
    });

    return Array.from(parameters);
  };

  // Проверяет, является ли значение лучшим в строке для числовых параметров
  const isBestValue = (value, parameter, currentItem) => {
    if (!value || value === '—') return false;
    
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return false;

    const values = comparisonItems.map(item => {
      try {
        const params = JSON.parse(item.parameters || '{}');
        const v = params[parameter];
        return v ? parseFloat(v) : NaN;
      } catch {
        return NaN;
      }
    }).filter(v => !isNaN(v));

    if (values.length === 0) return false;
    
    // Для параметров где больше = лучше (мощность, световой поток и т.д.)
    const higherBetterParams = ['мощность', 'световой поток', 'срок службы', 'гарантия', 'светоотдача', 'люмен'];
    const isHigherBetter = higherBetterParams.some(p => parameter.toLowerCase().includes(p));
    
    return isHigherBetter
      ? numValue >= Math.max(...values)
      : numValue <= Math.min(...values);
  };

  if (loading) {
    return (
      <div className={styles.comparisonContainer}>
        <h1 className={styles.title}>Сравнение товаров</h1>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <div className={styles.skeletonGrid}>
            {[1, 2, 3].map(i => (
              <div key={i} className={styles.skeletonCard}>
                <div className={styles.skeletonImage}></div>
                <div className={styles.skeletonLine}></div>
                <div className={styles.skeletonLine}></div>
                <div className={styles.skeletonLine}></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (comparisonItems.length < 2) {
    return (
      <div className={styles.comparisonContainer}>
        <h1 className={styles.title}>Сравнение товаров</h1>
        <div className={styles.emptyState}>
          <h2>Недостаточно товаров для сравнения</h2>
          <p>Для сравнения нужно выбрать от 2 до 3 товаров из одной категории. Добавьте товары через кнопку сравнения в каталоге.</p>
          <button
            className={styles.backToCatalogBtn}
            onClick={() => navigate('/catalog')}
          >
            Перейти в каталог
          </button>
        </div>
      </div>
    );
  }

  const parameters = getAllParameters();

  return (
    <div className={styles.comparisonContainer}>
      <h1 className={styles.title}>Сравнение товаров</h1>
      <p className={styles.subtitle}>
        Сравните характеристики и выберите лучший вариант
      </p>

      <div className={styles.comparisonHeader}>
        <button
          className={styles.clearAllBtn}
          onClick={clearComparison}
        >
          Очистить сравнение
        </button>
      </div>

      <div className={styles.comparisonTable}>
        {/* Заголовок с карточками товаров */}
        <div className={styles.tableHeader}>
          <div className={styles.headerCell}></div>
          {comparisonItems.map((item, index) => (
            <div key={item.id} className={styles.headerCell}>
              <div className={styles.productCard}>
                {index === bestItemIndex && (
                  <span className={styles.bestBadge}>Лучший выбор</span>
                )}
                <div className={styles.productImageWrapper}>
                  <img
                    src={item.image_url || 'https://via.placeholder.com/150x100'}
                    alt={item.name}
                    className={styles.productImage}
                  />
                </div>
                <h3 className={styles.productName}>{item.name}</h3>
                <div className={styles.priceSection}>
                  <span className={`${styles.productPrice} ${minPrice !== null && item.price === minPrice ? styles.bestPrice : ''}`}>
                    {item.price} ₽
                  </span>
                  {minPrice !== null && item.price === minPrice && (
                    <span className={styles.priceLabel}>Лучшая цена</span>
                  )}
                </div>
                <button
                  className={styles.removeBtn}
                  onClick={() => removeFromComparison(item.id)}
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Сравнение основных характеристик */}
        <div className={styles.tableRow}>
          <div className={styles.rowLabel}>
            Категория
          </div>
          {comparisonItems.map((item) => (
            <div key={item.id} className={styles.rowCell}>
              {item.categories?.name || 'Не указана'}
            </div>
          ))}
        </div>

        <div className={styles.tableRow}>
          <div className={styles.rowLabel}>
            Рейтинг
          </div>
          {comparisonItems.map((item, index) => {
            const rating = Math.round(item.rating || 0);
            return (
              <div key={item.id} className={styles.rowCell}>
                <div className={styles.rating}>
                  {'★'.repeat(rating)}
                  {'☆'.repeat(5 - rating)}
                  <span className={styles.ratingCount}>({item.rating_count || 0})</span>
                </div>
                {index === bestItemIndex && <span className={styles.bestValueIndicator}></span>}
              </div>
            );
          })}
        </div>

        <div className={styles.tableRow}>
          <div className={styles.rowLabel}>
            Наличие
          </div>
          {comparisonItems.map((item) => (
            <div key={item.id} className={styles.rowCell}>
              {item.stock > 0 ? (
                <span className={styles.inStock}>В наличии: {item.stock} шт.</span>
              ) : (
                <span className={styles.outOfStock}>Нет в наличии</span>
              )}
            </div>
          ))}
        </div>

        {/* Сравнение технических параметров */}
        {parameters.length > 0 && (
          <>
            <div className={styles.sectionTitle}>Технические характеристики</div>
            {parameters.map((param) => (
              <div key={param} className={styles.tableRow}>
                <div className={styles.rowLabel}>{param}</div>
                {comparisonItems.map((item) => {
                  let value = '—';
                  try {
                    const params = JSON.parse(item.parameters || '{}');
                    value = params[param] || '—';
                  } catch (e) {
                    console.error('Error parsing parameters:', e);
                  }
                  
                  const isBest = isBestValue(value, param, item);
                  
                  return (
                    <div key={item.id} className={styles.rowCell}>
                      <span className={isBest ? styles.bestValue : ''}>
                        {value}
                      </span>
                      {isBest && <span className={styles.bestValueIndicator}></span>}
                    </div>
                  );
                })}
              </div>
            ))}
          </>
        )}

        {/* Кнопки действий */}
        <div className={styles.actionsRow}>
          <div className={styles.rowLabel}>
            Действия
          </div>
          {comparisonItems.map((item) => (
            <div key={item.id} className={styles.rowCell}>
              <button
                className={styles.viewProductBtn}
                onClick={() => navigate(`/product/${item.id}`)}
              >
                Посмотреть товар
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Comparison;