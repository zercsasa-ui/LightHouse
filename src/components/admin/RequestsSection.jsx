import styles from '../../pages/Admin.module.css';

const RequestsSection = ({
  processedRequests,
  globalViewMode,
  expandedMessages,
  setExpandedMessages,
  editingRequest,
  setEditingRequest,
  adminResponse,
  setAdminResponse,
  requestStatus,
  setRequestStatus,
  handleUpdateRequest,
  openConfirmModal,
  getStatusClass,
  getStatusText,
  showSuccess
}) => {
  if (processedRequests.length === 0) {
    return <p className={styles.empty}>Заявок пока нет</p>;
  }

  return (
    <div className={`${styles.requestsList} ${globalViewMode === 'grid' ? styles.requestsGrid : ''}`}>
      {processedRequests.map(req => (
        <div key={req.id} className={styles.requestCard}>
          <div className={styles.requestLeft}>
            <div className={styles.requestHeader}>
              <div>
                <strong>{req.profiles?.name}</strong>
                <span className={styles.requestEmail}>{req.profiles?.email}</span>
              </div>
              <span className={styles.requestDate}>
                {new Date(req.created_at).toLocaleDateString('ru-RU')}
              </span>
            </div>
            <p className={styles.requestPhone}>Телефон: {req.phone}</p>
            <div className={styles.messageWrapper}>
              <p className={styles.requestMessage}>
                {expandedMessages[req.id]
                  ? req.message
                  : (req.message.length > 25
                    ? req.message.substring(0, 25) + '...'
                    : req.message)}
              </p>
              {req.message.length > 25 && (
                <button
                  className={styles.expandBtn}
                  onClick={() => setExpandedMessages(prev => ({
                    ...prev,
                    [req.id]: !prev[req.id]
                  }))}
                >
                  {expandedMessages[req.id] ? 'Свернуть' : 'Читать далее...'}
                </button>
              )}
            </div>
          </div>
          <div className={styles.requestRight}>
            <div className={styles.requestStatus}>
              <span className={`${styles.status} ${getStatusClass(req.status)}`}>{getStatusText(req.status)}</span>
            </div>
            <div className={styles.requestActions}>
              {editingRequest !== req.id ? (
                <>
                  <button
                    className={styles.editBtn}
                    onClick={() => {
                      setEditingRequest(req.id);
                      setAdminResponse(req.admin_response || '');
                      setRequestStatus(req.status);
                    }}
                  >
                    Ответить
                  </button>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => openConfirmModal('delete_request', req)}
                  >
                    Удалить
                  </button>
                </>
              ) : null}
            </div>
          </div>
          {editingRequest === req.id && (
            <div className={styles.editForm}>
              <textarea
                value={adminResponse}
                onChange={(e) => setAdminResponse(e.target.value)}
                placeholder="Ответ администратора..."
                rows={3}
                maxLength={500}
              />
              <select
                value={requestStatus}
                onChange={(e) => setRequestStatus(e.target.value)}
              >
                <option value="pending">Ожидает</option>
                <option value="in_progress">В работе</option>
                <option value="completed">Выполнена</option>
                <option value="rejected">Отклонена</option>
              </select>
              <div className={styles.editActions}>
                <button onClick={() => handleUpdateRequest(req.id)}>Сохранить</button>
                <button onClick={() => setEditingRequest(null)}>Отмена</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default RequestsSection;