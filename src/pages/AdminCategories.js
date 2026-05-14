import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import styles from './AdminCategories.module.css';

const AdminCategories = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Форма для категории
  const [categoryForm, setCategoryForm] = useState({
    id: null,
    name: '',
    description: ''
  });

  // Форма для параметра
  const [parameterForm, setParameterForm] = useState({
    category_id: null,
    id: null,
    name: '',
    unit: ''
  });

  // Загрузка категорий
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const fetchCategories = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('categories')
          .select(`
            *,
            category_parameters (*)
          `)
          .order('name', { ascending: true });

        if (error) throw error;
        setCategories(data || []);
      } catch (err) {
        setError('Ошибка загрузки категорий: ' + err.message);
        console.error('Error fetching categories:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [user, navigate]);

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      setError('Название категории обязательно');
      return;
    }

    try {
      if (categoryForm.id) {
        // Обновление категории
        const { error } = await supabase
          .from('categories')
          .update({
            name: categoryForm.name.trim(),
            description: categoryForm.description.trim()
          })
          .eq('id', categoryForm.id);

        if (error) throw error;
        setSuccessMessage('Категория успешно обновлена');
      } else {
        // Создание новой категории
        const { error } = await supabase
          .from('categories')
          .insert({
            name: categoryForm.name.trim(),
            description: categoryForm.description.trim()
          });

        if (error) throw error;
        setSuccessMessage('Категория успешно создана');
      }

      // Обновить список категорий
      const { data } = await supabase
        .from('categories')
        .select('*, category_parameters (*)')
        .order('name', { ascending: true });

      setCategories(data || []);
      setCategoryForm({ id: null, name: '', description: '' });
      setError(null);
    } catch (err) {
      setError('Ошибка сохранения категории: ' + err.message);
      console.error('Error saving category:', err);
    }
  };

  const handleParameterSubmit = async (e) => {
    e.preventDefault();
    if (!parameterForm.name.trim() || !parameterForm.category_id) {
      setError('Название параметра и категория обязательны');
      return;
    }

    try {
      if (parameterForm.id) {
        // Обновление параметра
        const { error } = await supabase
          .from('category_parameters')
          .update({
            name: parameterForm.name.trim(),
            unit: parameterForm.unit.trim()
          })
          .eq('id', parameterForm.id);

        if (error) throw error;
        setSuccessMessage('Параметр успешно обновлен');
      } else {
        // Создание нового параметра
        const { error } = await supabase
          .from('category_parameters')
          .insert({
            category_id: parameterForm.category_id,
            name: parameterForm.name.trim(),
            unit: parameterForm.unit.trim()
          });

        if (error) throw error;
        setSuccessMessage('Параметр успешно создан');
      }

      // Обновить список категорий с параметрами
      const { data } = await supabase
        .from('categories')
        .select('*, category_parameters (*)')
        .order('name', { ascending: true });

      setCategories(data || []);
      setParameterForm({ category_id: null, id: null, name: '', unit: '' });
      setError(null);
    } catch (err) {
      setError('Ошибка сохранения параметра: ' + err.message);
      console.error('Error saving parameter:', err);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Вы действительно хотите удалить эту категорию? Все параметры и связанные товары будут отвязаны.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      // Обновить список категорий
      const { data } = await supabase
        .from('categories')
        .select('*, category_parameters (*)')
        .order('name', { ascending: true });

      setCategories(data || []);
      setSuccessMessage('Категория успешно удалена');
    } catch (err) {
      setError('Ошибка удаления категории: ' + err.message);
      console.error('Error deleting category:', err);
    }
  };

  const handleDeleteParameter = async (parameterId) => {
    if (!window.confirm('Вы действительно хотите удалить этот параметр?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('category_parameters')
        .delete()
        .eq('id', parameterId);

      if (error) throw error;

      // Обновить список категорий с параметрами
      const { data } = await supabase
        .from('categories')
        .select('*, category_parameters (*)')
        .order('name', { ascending: true });

      setCategories(data || []);
      setSuccessMessage('Параметр успешно удален');
    } catch (err) {
      setError('Ошибка удаления параметра: ' + err.message);
      console.error('Error deleting parameter:', err);
    }
  };

  const handleEditCategory = (category) => {
    setCategoryForm({
      id: category.id,
      name: category.name,
      description: category.description || ''
    });
  };

  const handleEditParameter = (categoryId, parameter) => {
    setParameterForm({
      category_id: categoryId,
      id: parameter.id,
      name: parameter.name,
      unit: parameter.unit || ''
    });
  };

  if (loading) {
    return <div className={styles.loading}>Загрузка...</div>;
  }

  return (
    <div className={styles.adminContainer}>
      <h1 className={styles.title}>Управление категориями и параметрами</h1>

      {error && <div className={styles.errorMessage}>{error}</div>}
      {successMessage && <div className={styles.successMessage}>{successMessage}</div>}

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Добавить/редактировать категорию</h2>
        <form onSubmit={handleCategorySubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="categoryName">Название категории:</label>
            <input
              type="text"
              id="categoryName"
              value={categoryForm.name}
              onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
              required
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="categoryDescription">Описание:</label>
            <textarea
              id="categoryDescription"
              value={categoryForm.description}
              onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
              className={styles.textarea}
              rows="3"
            />
          </div>

          <button type="submit" className={styles.submitBtn}>
            {categoryForm.id ? 'Обновить категорию' : 'Создать категорию'}
          </button>
          {categoryForm.id && (
            <button
              type="button"
              onClick={() => setCategoryForm({ id: null, name: '', description: '' })}
              className={styles.cancelBtn}
            >
              Отмена
            </button>
          )}
        </form>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Добавить/редактировать параметр</h2>
        <form onSubmit={handleParameterSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="parameterCategory">Категория:</label>
            <select
              id="parameterCategory"
              value={parameterForm.category_id || ''}
              onChange={(e) => setParameterForm({...parameterForm, category_id: Number(e.target.value)})}
              required
              className={styles.select}
            >
              <option value="">Выберите категорию</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="parameterName">Название параметра:</label>
            <input
              type="text"
              id="parameterName"
              value={parameterForm.name}
              onChange={(e) => setParameterForm({...parameterForm, name: e.target.value})}
              required
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="parameterUnit">Единица измерения (опционально):</label>
            <input
              type="text"
              id="parameterUnit"
              value={parameterForm.unit}
              onChange={(e) => setParameterForm({...parameterForm, unit: e.target.value})}
              placeholder="например: Вт, А, мм и т.д."
              className={styles.input}
            />
          </div>

          <button type="submit" className={styles.submitBtn}>
            {parameterForm.id ? 'Обновить параметр' : 'Создать параметр'}
          </button>
          {parameterForm.id && (
            <button
              type="button"
              onClick={() => setParameterForm({ category_id: null, id: null, name: '', unit: '' })}
              className={styles.cancelBtn}
            >
              Отмена
            </button>
          )}
        </form>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Список категорий и параметров</h2>
        {categories.length === 0 ? (
          <p className={styles.empty}>Пока нет категорий. Создайте первую категорию.</p>
        ) : (
          <div className={styles.categoriesList}>
            {categories.map(category => (
              <div key={category.id} className={styles.categoryItem}>
                <div className={styles.categoryHeader}>
                  <h3 className={styles.categoryName}>{category.name}</h3>
                  <div className={styles.categoryActions}>
                    <button
                      onClick={() => handleEditCategory(category)}
                      className={styles.editBtn}
                      title="Редактировать категорию"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className={styles.deleteBtn}
                      title="Удалить категорию"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                {category.description && (
                  <p className={styles.categoryDescription}>{category.description}</p>
                )}

                <h4 className={styles.parametersTitle}>Параметры:</h4>
                {category.category_parameters && category.category_parameters.length > 0 ? (
                  <ul className={styles.parametersList}>
                    {category.category_parameters.map(param => (
                      <li key={param.id} className={styles.parameterItem}>
                        <span className={styles.parameterName}>{param.name}</span>
                        {param.unit && (
                          <span className={styles.parameterUnit}>({param.unit})</span>
                        )}
                        <div className={styles.parameterActions}>
                          <button
                            onClick={() => handleEditParameter(category.id, param)}
                            className={styles.editBtn}
                            title="Редактировать параметр"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteParameter(param.id)}
                            className={styles.deleteBtn}
                            title="Удалить параметр"
                          >
                            🗑️
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.emptyParams}>Нет параметров для этой категории</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCategories;