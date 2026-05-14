import styles from '../../pages/Admin.module.css';

const ProductsSection = ({
  processedProducts,
  globalViewMode,
  setGlobalViewMode,
  categories,
  expandedDescriptions,
  setExpandedDescriptions,
  handleEditProduct,
  openConfirmModal,
  showProductForm,
  editingProduct,
  productFormState,
  setProductFormState,
  productParameters,
  setProductParameters,
  handleCreateProduct,
  handleUpdateProduct,
  handleCancelEdit,
  handleImageUpload,
  uploading,
  getCategoryParamsForForm,
  setShowProductForm,
  setEditingProduct,
  // Фильтры товаров
  productSearch,
  setProductSearch,
  productCategory,
  setProductCategory,
  productActive,
  setProductActive,
  productSortDate,
  setProductSortDate,
  productDateFrom,
  setProductDateFrom,
  productDateTo,
  setProductDateTo
}) => {
  return (
    <>
      <div className={styles.filtersBar}>
        <div className={styles.searchWrapper}>
          <img src="/images/ico/icoLupa.png" alt="Поиск" className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Поиск по названию и описанию..."
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <select
          value={productCategory}
          onChange={(e) => setProductCategory(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">Все категории</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>

        <select
          value={productActive}
          onChange={(e) => setProductActive(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">Все товары</option>
          <option value="active">Активные</option>
          <option value="inactive">Неактивные</option>
        </select>

        <select
          value={productSortDate}
          onChange={(e) => setProductSortDate(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="desc">Сначала новые</option>
          <option value="asc">Сначала старые</option>
        </select>

        <input
          type="date"
          value={productDateFrom}
          onChange={(e) => setProductDateFrom(e.target.value)}
          className={styles.dateInput}
          placeholder="От даты"
        />
        <input
          type="date"
          value={productDateTo}
          onChange={(e) => setProductDateTo(e.target.value)}
          className={styles.dateInput}
          placeholder="До даты"
        />

        <span className={styles.searchCount}>Всего: {processedProducts.length}</span>

        <button
          onClick={() => setGlobalViewMode(globalViewMode === 'list' ? 'grid' : 'list')}
          className={styles.viewToggleBtn}
        >
          <img src="/images/ico/icoMain.png" alt="Вид" className={styles.viewIcon} />
        </button>

        <button
          className={styles.addBtn}
          onClick={() => {
            setShowProductForm(!showProductForm);
            setEditingProduct(null);
          }}
        >
          {showProductForm ? 'Отмена' : '+ Добавить товар'}
        </button>
      </div>

      {(showProductForm || editingProduct) && (
        <form className={styles.productForm} onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct}>
          <h3>{editingProduct ? 'Редактирование товара' : 'Новый товар'}</h3>
          <div className={styles.formRow}>
            <input
              type="text"
              placeholder="Название"
              value={productFormState.name || ''}
              onChange={(e) => setProductFormState(prev => ({ ...prev, name: e.target.value }))}
              required
            />
            <input
              type="number"
              placeholder="Цена"
              value={productFormState.price || ''}
              onChange={(e) => setProductFormState(prev => ({ ...prev, price: e.target.value }))}
              required
            />
          </div>
          <textarea
            placeholder="Описание"
            value={productFormState.description || ''}
            onChange={(e) => setProductFormState(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
          />

          <div className={styles.imageUpload}>
            <label htmlFor="imageInput">Изображение товара</label>
            <input
              type="file"
              id="imageInput"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
            />
            {uploading && <span className={styles.uploading}>Загрузка...</span>}
            {productFormState.image_url && (
              <div className={styles.imagePreview}>
                <img src={productFormState.image_url} alt="Preview" />
              </div>
            )}
          </div>

          <div className={styles.formRow}>
            <select
              value={productFormState.category_id || ''}
              onChange={(e) => setProductFormState(prev => ({ ...prev, category_id: e.target.value }))}
            >
              <option value="">Без категории</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Количество"
              value={productFormState.stock || ''}
              onChange={(e) => setProductFormState(prev => ({ ...prev, stock: e.target.value }))}
            />
          </div>

          <div className={styles.checkboxRow}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={productFormState.is_active ?? true}
                onChange={(e) => setProductFormState(prev => ({ ...prev, is_active: e.target.checked }))}
              />
              <span>Активен (отображается в каталоге)</span>
            </label>
          </div>

          {productFormState.category_id && getCategoryParamsForForm(productFormState.category_id).length > 0 && (
            <div className={styles.productParamsSection}>
              <h4 className={styles.productParamsSectionTitle}>Характеристики</h4>
              <div className={styles.productParamsGrid}>
                {getCategoryParamsForForm(productFormState.category_id).map(param => (
                  <div key={param.id} className={styles.productParamField}>
                    <label className={styles.productParamLabel}>
                      {param.name}{param.unit ? ` (${param.unit})` : ''}
                    </label>
                    <input
                      type="text"
                      className={styles.productParamInput}
                      placeholder={`Значение${param.unit ? ` в ${param.unit}` : ''}`}
                      value={productParameters[param.name] || ''}
                      onChange={(e) => setProductParameters(prev => ({
                        ...prev,
                        [param.name]: e.target.value
                      }))}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={styles.formActions}>
            <button type="submit" className={styles.submitProductBtn}>
              {editingProduct ? 'Сохранить изменения' : 'Создать товар'}
            </button>
            {editingProduct && (
              <button type="button" className={styles.cancelBtn} onClick={handleCancelEdit}>
                Отмена
              </button>
            )}
          </div>
        </form>
      )}

      <div className={`${styles.productsList} ${globalViewMode === 'grid' ? styles.productsGrid : ''}`}>
        {processedProducts.map(product => (
          <div key={product.id} className={styles.productCard}>
            <img
              src={product.image_url || 'https://via.placeholder.com/100'}
              alt={product.name}
              className={styles.productThumb}
            />
            <div className={styles.productDetails}>
              <h3>{product.name}</h3>
              <p className={!expandedDescriptions[`product_${product.id}`] ? styles.truncatedText : ''}>
                {expandedDescriptions[`product_${product.id}`]
                  ? product.description
                  : (product.description && product.description.length > 100
                    ? product.description.substring(0, 100) + '...'
                    : product.description)}
              </p>
              {product.description && product.description.length > 100 && (
                <button
                  className={styles.expandBtn}
                  onClick={() => setExpandedDescriptions(prev => ({
                    ...prev,
                    [`product_${product.id}`]: !prev[`product_${product.id}`]
                  }))}
                >
                  {expandedDescriptions[`product_${product.id}`] ? 'Свернуть' : 'Читать далее...'}
                </button>
              )}
              <div className={styles.productMeta}>
                <span className={styles.productPrice}>{product.price} ₽</span>
                <span className={styles.productStock}>Склад: {product.stock}</span>
                <span className={product.is_active ? styles.statusActive : styles.statusInactive}>
                  {product.is_active ? 'Активен' : 'Неактивен'}
                </span>
              </div>
            </div>
            <div className={styles.productActions}>
              <button
                className={styles.editProductBtn}
                onClick={() => handleEditProduct(product)}
              >
                Редактировать
              </button>
              <button
                className={styles.deleteBtn}
                onClick={() => openConfirmModal('delete_product', product)}
              >
                Удалить
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default ProductsSection;