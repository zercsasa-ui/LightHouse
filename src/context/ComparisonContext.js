import { createContext, useContext, useState, useEffect } from 'react';

const ComparisonContext = createContext();

export const ComparisonProvider = ({ children }) => {
  const [comparisonItems, setComparisonItems] = useState([]);
  const [showComparisonNotification, setShowComparisonNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  // Загружаем сохраненные товары для сравнения из localStorage при инициализации
  useEffect(() => {
    const savedItems = JSON.parse(localStorage.getItem('comparisonItems') || '[]');
    setComparisonItems(savedItems);
  }, []);

  // Сохраняем в localStorage при изменении
  useEffect(() => {
    localStorage.setItem('comparisonItems', JSON.stringify(comparisonItems));
  }, [comparisonItems]);

  const showNotification = (message) => {
    setNotificationMessage(message);
    setShowComparisonNotification(true);
    setTimeout(() => setShowComparisonNotification(false), 3000);
  };

  const addToComparison = (product) => {
    // Проверяем, не добавлен ли уже этот товар
    const isAlreadyAdded = comparisonItems.some(item => item.id === product.id);
    if (isAlreadyAdded) {
      showNotification('Этот товар уже добавлен к сравнению');
      return false;
    }

    // Проверяем, что товары из одной категории
    const currentCategory = product.categories?.name;
    const allSameCategory = comparisonItems.every(item => item.categories?.name === currentCategory);

    if (comparisonItems.length > 0 && !allSameCategory) {
      showNotification('Можно сравнивать только товары из одной категории');
      return false;
    }

    // Проверяем лимит (максимум 3 товара)
    if (comparisonItems.length >= 3) {
      showNotification('Можно сравнивать не более 3 товаров');
      return false;
    }

    const newItems = [...comparisonItems, product];
    setComparisonItems(newItems);
    showNotification(`Товар добавлен к сравнению (${newItems.length}/3)`);
    return true;
  };

  const removeFromComparison = (productId) => {
    const newItems = comparisonItems.filter(item => item.id !== productId);
    setComparisonItems(newItems);
    showNotification(`Товар удален из сравнения (${newItems.length}/3)`);
  };

  const clearComparison = () => {
    setComparisonItems([]);
    showNotification('Сравнение очищено');
  };

  return (
    <ComparisonContext.Provider value={{
      comparisonItems,
      addToComparison,
      removeFromComparison,
      clearComparison,
      showComparisonNotification,
      notificationMessage
    }}>
      {children}
    </ComparisonContext.Provider>
  );
};

export const useComparison = () => {
  return useContext(ComparisonContext);
};