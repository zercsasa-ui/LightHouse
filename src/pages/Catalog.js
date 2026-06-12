import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import ProductCard from '../components/ProductCard';
import styles from './Catalog.module.css';

const STORAGE_KEY_FILTERS = 'catalog_filters';
const STORAGE_KEY_PRODUCTS = 'catalog_products';
const STORAGE_KEY_CATEGORIES = 'catalog_categories';
const CACHE_TTL = 60 * 1000; // 1 минута

// Чтение сохранённых фильтров
const loadFilters = () => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_FILTERS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
};

// Чтение кэша товаров
const loadCache = () => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_PRODUCTS);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > CACHE_TTL) {
      sessionStorage.removeItem(STORAGE_KEY_PRODUCTS);
      return null;
    }
    return data;
  } catch {
    return null;
  }
};

const loadCategoriesCache = () => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_CATEGORIES);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > CACHE_TTL) {
      sessionStorage.removeItem(STORAGE_KEY_CATEGORIES);
      return null;
    }
    return data;
  } catch {
    return null;
  }
};

const Catalog = () => {
  const savedFilters = loadFilters();

  const [products, setProducts] = useState(() => loadCache() || []);
  const [categories, setCategories] = useState(() => loadCategoriesCache() || []);
  const [selectedCategory, setSelectedCategory] = useState(savedFilters?.selectedCategory ?? null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(savedFilters?.searchQuery ?? '');
  const [minPrice, setMinPrice] = useState(savedFilters?.minPrice ?? '');
  const [maxPrice, setMaxPrice] = useState(savedFilters?.maxPrice ?? '');
  const [minRating, setMinRating] = useState(savedFilters?.minRating ?? 0);
  const [appliedSearchQuery, setAppliedSearchQuery] = useState(savedFilters?.appliedSearchQuery ?? '');
  const [inStockOnly, setInStockOnly] = useState(savedFilters?.inStockOnly ?? false);

  const handleSearch = () => {
    setAppliedSearchQuery(searchQuery);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Сохранение фильтров в sessionStorage при каждом изменении
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY_FILTERS, JSON.stringify({
      selectedCategory,
      searchQuery,
      minPrice,
      maxPrice,
      minRating,
      appliedSearchQuery,
      inStockOnly,
    }));
  }, [selectedCategory, searchQuery, minPrice, maxPrice, minRating, appliedSearchQuery, inStockOnly]);

  useEffect(() => {
    const abortController = new AbortController();

    const fetchData = async () => {
      // Если данные уже в кэше — не загружаем повторно
      const cachedProducts = loadCache();
      const cachedCategories = loadCategoriesCache();
      if (cachedProducts && cachedCategories) {
        setProducts(cachedProducts);
        setCategories(cachedCategories);
        setLoading(false);
        return;
      }

      const retryDelay = (attempt) => 1000 * Math.pow(2, attempt);

      for (let attempt = 0; attempt < 3; attempt++) {
        if (abortController.signal.aborted) return;

        try {
          const timeoutId = setTimeout(() => abortController.abort(), 10000);

          const [productsRes, categoriesRes] = await Promise.all([
            supabase.from('products').select('*, categories(name)').limit(200).order('created_at', { ascending: false }),
            supabase.from('categories').select('*').order('name')
          ]);

          clearTimeout(timeoutId);

          if (abortController.signal.aborted) return;

          if (productsRes.error) throw productsRes.error;
          if (categoriesRes.error) throw categoriesRes.error;

          const prods = productsRes.data || [];
          const cats = categoriesRes.data || [];

          setProducts(prods);
          setCategories(cats);

          // Кэшируем в sessionStorage
          sessionStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify({ data: prods, timestamp: Date.now() }));
          sessionStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify({ data: cats, timestamp: Date.now() }));

          break;
        } catch (error) {
          if (error.name === 'AbortError') return;

          console.error(`Ошибка загрузки, попытка ${attempt + 1}/3`, error);

          if (attempt === 2) {
            setProducts([]);
            setCategories([]);
            break;
          }

          await new Promise(resolve => setTimeout(resolve, retryDelay(attempt)));
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => abortController.abort();
  }, []);

  let filteredProducts = products;
  // Фильтр по категории
  if (selectedCategory) {
    filteredProducts = filteredProducts.filter(p => p.categories?.name === selectedCategory);
  }
  // Поиск по названию, описанию и артикулу (id товара)
  // Приоритет: точное совпадение артикула → начало артикула → частичное совпадение артикула → название/описание
  if (appliedSearchQuery.trim()) {
    const query = appliedSearchQuery.toLowerCase();

    // Группировка по точности артикулу
    const exactArticle = filteredProducts.filter(p =>
      String(p.id) === query
    );
    const startArticle = filteredProducts.filter(p =>
      String(p.id).startsWith(query) && String(p.id) !== query
    );
    const containArticle = filteredProducts.filter(p =>
      String(p.id).includes(query) && !String(p.id).startsWith(query)
    );
    const articleIds = new Set([
      ...exactArticle.map(p => p.id),
      ...startArticle.map(p => p.id),
      ...containArticle.map(p => p.id),
    ]);
    const byName = filteredProducts.filter(p =>
      !articleIds.has(p.id) && (
        p.name?.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
      )
    );
    filteredProducts = [...exactArticle, ...startArticle, ...containArticle, ...byName];
  }

  // Фильтр «Только в наличии»
  if (inStockOnly) {
    filteredProducts = filteredProducts.filter(p => p.stock > 0);
  }
  // Фильтр по минимальной цене
  if (minPrice) {
    filteredProducts = filteredProducts.filter(p => p.price >= parseFloat(minPrice));
  }
  // Фильтр по максимальной цене
  if (maxPrice) {
    filteredProducts = filteredProducts.filter(p => p.price <= parseFloat(maxPrice));
  }
  // Фильтр по минимальной оценке
  if (minRating > 0) {
    filteredProducts = filteredProducts.filter(p => (p.rating || 0) >= minRating);
  }
  if (loading) {
    return <div className={styles.loading}>Загрузка...</div>;
  }
  return (
    <div className={styles.catalogContainer}>
      <h1 className={styles.title}>Каталог товаров</h1>

      <div className={styles.searchAndFilters}>
        <div className={styles.searchWrapper}>
          <img src="/images/ico/icoLupa.png" alt="Поиск" className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Поиск по названию, артикулу..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className={styles.searchInput}
          />
          <button className={styles.searchButton} onClick={handleSearch}>
            Найти
          </button>
        </div>

        <div className={styles.filtersRow}>
          <div className={styles.priceFilter}>
            <input
              type="number"
              placeholder="Цена от"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className={styles.priceInput}
              min="0"
            />
            <span className={styles.priceDivider}>—</span>
            <input
              type="number"
              placeholder="Цена до"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className={styles.priceInput}
              min="0"
            />
          </div>

          <div className={styles.ratingFilter}>
            <span>Мин. оценка:</span>
            <div className={styles.ratingStars}>
              {[1, 2, 3, 4, 5].map(rating => (
                <span
                  key={rating}
                  className={minRating >= rating ? styles.starActive : styles.star}
                  onClick={() => setMinRating(minRating === rating ? 0 : rating)}
                >
                  ★
                </span>
              ))}
            </div>
          </div>

          <label className={styles.stockFilter}>
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className={styles.stockCheckbox}
            />
            <span>В наличии</span>
          </label>

          <span className={styles.productsCount}>Найдено: {filteredProducts.length}</span>
        </div>
      </div>

      <div className={styles.categories}>
        <button
          className={`${styles.categoryBtn} ${!selectedCategory ? styles.active : ''}`}
          onClick={() => setSelectedCategory(null)}
        >
          Все
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`${styles.categoryBtn} ${selectedCategory === cat.name ? styles.active : ''}`}
            onClick={() => setSelectedCategory(cat.name)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {filteredProducts.length === 0 ? (
        <p className={styles.empty}>Товары не найдены</p>
      ) : (
        <div className={styles.productsGrid}>
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Catalog;