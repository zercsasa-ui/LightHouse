import styles from '../../pages/Admin.module.css';

const CategoriesSection = ({
  processedCategories,
  products,
  expandedDescriptions,
  setExpandedDescriptions,
  editingCategory,
  setEditingCategory,
  categoryForm,
  setCategoryForm,
  showCategoryForm,
  setShowCategoryForm,
  handleCreateCategory,
  handleUpdateCategory,
  openConfirmModal,
  // Фильтры категорий
  categorySearch,
  setCategorySearch,
  // Параметры категорий
  expandedParams,
  setExpandedParams,
  showParameterForm,
  setShowParameterForm,
  editingParameter,
  setEditingParameter,
  parameterForm,
  setParameterForm,
  handleCreateParameter,
  handleUpdateParameter,
  handleEditParameter,
  handleDeleteParameter,
  // Режим отображения
  globalViewMode,
  setGlobalViewMode
}) => {
  return (
    <div className={styles.categoriesSection}>
      <div className={styles.filtersBar}>
        <div className={styles.searchWrapper}>
          <img src="/images/ico/icoLupa.png" alt="Поиск" className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Поиск категорий..."
            value={categorySearch}
            onChange={(e) => setCategorySearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <span className={styles.searchCount}>Всего: {processedCategories.length}</span>

        <button
          onClick={() => setGlobalViewMode(globalViewMode === 'list' ? 'grid' : 'list')}
          className={styles.viewToggleBtn}
        >
          <img src="/images/ico/icoMain.png" alt="Вид" className={styles.viewIcon} />
        </button>

        <button
          className={styles.addBtn}
          onClick={() => {
            setEditingCategory(null);
            setCategoryForm(prev => ({ ...prev, name: '', description: '' }));
            setShowCategoryForm(true);
          }}
        >
          + Добавить категорию
        </button>
      </div>

      {showCategoryForm && (
        <form className={styles.categoryForm} onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory}>
          <h3>{editingCategory ? 'Редактирование категории' : 'Новая категория'}</h3>
          <input
            type="text"
            placeholder="Название категории"
            value={categoryForm.name || ''}
            onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
            required
          />
          <textarea
            placeholder="Описание (необязательно)"
            value={categoryForm.description || ''}
            onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
            rows={2}
          />
          <div className={styles.formActions}>
            <button type="submit" className={styles.submitProductBtn}>
              {editingCategory ? 'Сохранить' : 'Создать'}
            </button>
            <button type="button" className={styles.cancelBtn} onClick={() => setShowCategoryForm(false)}>
              Отмена
            </button>
          </div>
        </form>
      )}

      <div className={`${styles.categoriesList} ${globalViewMode === 'grid' ? styles.categoriesGrid : ''}`}>
        {processedCategories.map(cat => (
          <div key={cat.id} className={styles.categoryCard}>
            <div className={styles.categoryInfo}>
              <h3>{cat.name}</h3>
              {cat.description && (
                <>
                  <p className={!expandedDescriptions[`category_${cat.id}`] ? styles.truncatedText : ''}>
                    {expandedDescriptions[`category_${cat.id}`]
                      ? cat.description
                      : (cat.description.length > 100
                        ? cat.description.substring(0, 100) + '...'
                        : cat.description)}
                  </p>
                  {cat.description.length > 100 && (
                    <button
                      className={styles.expandBtn}
                      onClick={() => setExpandedDescriptions(prev => ({
                        ...prev,
                        [`category_${cat.id}`]: !prev[`category_${cat.id}`]
                      }))}
                    >
                      {expandedDescriptions[`category_${cat.id}`] ? 'Свернуть' : 'Читать далее...'}
                    </button>
                  )}
                </>
              )}
              <span className={styles.categoryProductsCount}>
                Товаров: {products.filter(p => p.category_id === cat.id).length}
              </span>
            </div>

            {/* Секция параметров категории */}
            <div className={styles.categoryParamsBlock}>
              <div className={styles.categoryParamsHeader}>
                <h4 className={styles.categoryParamsTitle}>
                  Параметры ({cat.category_parameters?.length || 0})
                </h4>
                <div className={styles.categoryParamsHeaderActions}>
                  {(cat.category_parameters?.length > 0) && (
                    <button
                      className={styles.categoryParamsCollapseBtn}
                      onClick={() => setExpandedParams(prev => ({ ...prev, [cat.id]: !prev[cat.id] }))}
                    >
                      {expandedParams[cat.id] ? '▲ Свернуть' : '▼ Развернуть'}
                    </button>
                  )}
                  <button
                    className={styles.categoryParamsToggle}
                    onClick={() => setShowParameterForm(prev => ({ ...prev, [cat.id]: !prev[cat.id] }))}
                  >
                    {showParameterForm[cat.id] ? '−' : '+ Добавить'}
                  </button>
                </div>
              </div>

              {/* Форма добавления параметра */}
              {(showParameterForm[cat.id] || editingParameter) && (
                <form
                  className={styles.categoryParamForm}
                  onSubmit={(e) => {
                    if (editingParameter) {
                      handleUpdateParameter(e);
                    } else {
                      handleCreateParameter(e, cat.id);
                    }
                  }}
                >
                  <input
                    type="text"
                    placeholder="Название параметра"
                    value={parameterForm.name || ''}
                    onChange={(e) => setParameterForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                    className={styles.categoryParamInput}
                  />
                  <input
                    type="text"
                    placeholder="Ед. изм. (Вт, А, мм...)"
                    value={parameterForm.unit || ''}
                    onChange={(e) => setParameterForm(prev => ({ ...prev, unit: e.target.value }))}
                    className={styles.categoryParamInput}
                  />
                  <button type="submit" className={styles.categoryParamSaveBtn}>
                    {editingParameter ? 'Обновить' : 'Сохранить'}
                  </button>
                  <button
                    type="button"
                    className={styles.categoryParamCancelBtn}
                    onClick={() => {
                      setEditingParameter(null);
                      setParameterForm(prev => ({ ...prev, category_id: null, name: '', unit: '' }));
                      setShowParameterForm(prev => ({ ...prev, [cat.id]: false }));
                    }}
                  >
                    Отмена
                  </button>
                </form>
              )}

              {/* Список параметров — сворачиваемый */}
              {cat.category_parameters && cat.category_parameters.length > 0 && expandedParams[cat.id] && (
                <ul className={styles.categoryParamsList}>
                  {cat.category_parameters.map(param => (
                    <li key={param.id} className={styles.categoryParamItem}>
                      <span className={styles.categoryParamName}>{param.name}</span>
                      {param.unit && <span className={styles.categoryParamUnit}>({param.unit})</span>}
                      <div className={styles.categoryParamActions}>
                        <button
                          className={styles.categoryParamEditBtn}
                          title="Редактировать"
                          onClick={() => handleEditParameter(cat.id, param)}
                        >
                          ✏️
                        </button>
                        <button
                          className={styles.categoryParamDeleteBtn}
                          title="Удалить"
                          onClick={() => handleDeleteParameter(param.id)}
                        >
                          🗑️
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {cat.category_parameters && cat.category_parameters.length === 0 && !showParameterForm[cat.id] && (
                <p className={styles.categoryParamsEmpty}>Нет параметров</p>
              )}
            </div>

            <div className={styles.categoryActions}>
              <button
                className={styles.editProductBtn}
                onClick={() => {
                  setEditingCategory(cat.id);
                  setCategoryForm(prev => ({ ...prev, name: cat.name, description: cat.description || '' }));
                  setShowCategoryForm(true);
                }}
              >
                Редактировать
              </button>
              <button
                className={styles.deleteBtn}
                onClick={() => openConfirmModal('delete_category', cat)}
              >
                Удалить
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoriesSection;