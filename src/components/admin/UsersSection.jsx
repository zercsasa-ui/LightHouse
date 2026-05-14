import styles from '../../pages/Admin.module.css';

const UsersSection = ({
  processedUsers,
  globalViewMode,
  setGlobalViewMode,
  editingUser,
  setEditingUser,
  userForm,
  setUserForm,
  originalUser,
  setOriginalUser,
  handleEditUser,
  handleUpdateUser,
  handleCancelUserEdit,
  openConfirmModal,
  // Фильтры пользователей
  userSearch,
  setUserSearch,
  userRoleFilter,
  setUserRoleFilter
}) => {
  return (
    <div className={styles.usersSection}>
      <div className={styles.filtersBar}>
        <div className={styles.searchWrapper}>
          <img src="/images/ico/icoLupa.png" alt="Поиск" className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Поиск по имени и email..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <select
          value={userRoleFilter}
          onChange={(e) => setUserRoleFilter(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">Все роли</option>
          <option value="user">Пользователи</option>
          <option value="manager">Менеджеры</option>
          <option value="admin">Администраторы</option>
        </select>

        <span className={styles.searchCount}>Всего: {processedUsers.length}</span>

        <button
          onClick={() => setGlobalViewMode(globalViewMode === 'list' ? 'grid' : 'list')}
          className={styles.viewToggleBtn}
        >
          <img src="/images/ico/icoMain.png" alt="Вид" className={styles.viewIcon} />
        </button>
      </div>

      <h2>Пользователи</h2>

      {processedUsers.length === 0 ? (
        <p className={styles.empty}>Пользователей пока нет</p>
      ) : (
        <div className={`${styles.usersList} ${globalViewMode === 'grid' ? styles.usersGrid : ''}`}>
          {processedUsers.map(user => (
            <div key={user.id} className={styles.userCard}>
              <div className={styles.userInfo}>
                <div className={styles.userMainInfo}>
                  <h3>{user.name}</h3>
                  <span className={styles.userEmail}>{user.email}</span>
                </div>
                <span className={`${styles.roleBadge} ${styles['role_' + user.role]}`}>
                  {user.role === 'admin' ? 'Админ' : user.role === 'manager' ? 'Менеджер' : 'Пользователь'}
                </span>
              </div>
              <p className={styles.userDate}>
                Регистрация: {new Date(user.created_at).toLocaleDateString('ru-RU')}
              </p>

              {editingUser === user.id ? (
                <form className={styles.userEditForm} onSubmit={handleUpdateUser}>
                  <div className={styles.formRow}>
                    <div
                      className={userForm.name !== originalUser.name ? styles.inputModified : ''}
                      onClick={(e) => {
                        if (e.target.tagName === 'INPUT') return;
                        setUserForm(prev => ({ ...prev, name: originalUser.name }));
                      }}
                    >
                      <input
                        type="text"
                        placeholder="Никнейм"
                        value={userForm.name || ''}
                        onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div
                      className={userForm.email !== originalUser.email ? styles.inputModified : ''}
                      onClick={(e) => {
                        if (e.target.tagName === 'INPUT') return;
                        setUserForm(prev => ({ ...prev, email: originalUser.email }));
                      }}
                    >
                      <input
                        type="email"
                        placeholder="Email"
                        value={userForm.email || ''}
                        onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                    <div
                      className={userForm.role !== originalUser.role ? styles.inputModified : ''}
                      onClick={(e) => {
                        if (e.target.tagName === 'SELECT') return;
                        setUserForm(prev => ({ ...prev, role: originalUser.role }));
                      }}
                    >
                      <select
                        value={userForm.role || ''}
                        onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value }))}
                      >
                        <option value="user">Пользователь</option>
                        <option value="manager">Менеджер</option>
                        <option value="admin">Админ</option>
                      </select>
                    </div>
                  </div>
                  <div className={styles.userActions}>
                    <button type="submit" className={styles.saveUserBtn}>Сохранить</button>
                    <button type="button" className={styles.cancelBtn} onClick={handleCancelUserEdit}>
                      Отмена
                    </button>
                  </div>
                </form>
              ) : (
                <div className={styles.userActions}>
                  <button
                    className={styles.editUserBtn}
                    onClick={() => handleEditUser(user)}
                  >
                    Редактировать
                  </button>
                  <button
                    className={styles.resetPasswordBtn}
                    onClick={() => openConfirmModal('reset_password', user)}
                  >
                    Сбросить пароль
                  </button>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => openConfirmModal('delete_user', user)}
                  >
                    Удалить
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UsersSection;