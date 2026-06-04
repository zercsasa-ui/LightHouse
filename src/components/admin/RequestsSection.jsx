import { useState } from 'react';
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
  const [infoModal, setInfoModal] = useState(null);

  if (processedRequests.length === 0) {
    return <p className={styles.empty}>Заявок пока нет</p>;
  }

  return (
    <>
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
              <button
                className={styles.requestInfoBtn}
                onClick={() => setInfoModal(req)}
                title="Подробная информация"
              >
                i
              </button>
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

      {/* Модальное окно с подробной информацией о заявке */}
      {infoModal && (
        <div className={styles.requestInfoOverlay} onClick={() => setInfoModal(null)}>
          <div className={styles.requestInfoModal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.requestInfoClose} onClick={() => setInfoModal(null)}>×</button>
            <h3>Подробная информация о заявке</h3>
            <div className={styles.requestInfoGrid}>
              <div className={styles.requestInfoField}>
                <span className={styles.requestInfoLabel}>ID заявки</span>
                <span className={styles.requestInfoValue}>{infoModal.id}</span>
              </div>
              <div className={styles.requestInfoField}>
                <span className={styles.requestInfoLabel}>Имя пользователя</span>
                <span className={styles.requestInfoValue}>{infoModal.profiles?.name || 'Не указано'}</span>
              </div>
              <div className={styles.requestInfoField}>
                <span className={styles.requestInfoLabel}>Email</span>
                <span className={styles.requestInfoValue}>{infoModal.profiles?.email || 'Не указан'}</span>
              </div>
              <div className={styles.requestInfoField}>
                <span className={styles.requestInfoLabel}>Телефон</span>
                <span className={styles.requestInfoValue}>{infoModal.phone}</span>
              </div>
              <div className={styles.requestInfoField}>
                <span className={styles.requestInfoLabel}>Дата создания</span>
                <span className={styles.requestInfoValue}>
                  {new Date(infoModal.created_at).toLocaleString('ru-RU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <div className={styles.requestInfoField}>
                <span className={styles.requestInfoLabel}>Дата обновления</span>
                <span className={styles.requestInfoValue}>
                  {infoModal.updated_at
                    ? new Date(infoModal.updated_at).toLocaleString('ru-RU', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'Не обновлялась'}
                </span>
              </div>
              <div className={styles.requestInfoField}>
                <span className={styles.requestInfoLabel}>Статус</span>
                <span className={`${styles.status} ${getStatusClass(infoModal.status)}`}>
                  {getStatusText(infoModal.status)}
                </span>
              </div>
            </div>

            <div className={styles.requestInfoMessageBlock}>
              <span className={styles.requestInfoLabel}>Сообщение</span>
              <div className={styles.requestInfoMessage}>{infoModal.message}</div>
            </div>

            {infoModal.admin_response && (
              <div className={styles.requestInfoMessageBlock}>
                <span className={styles.requestInfoLabel}>Ответ администратора</span>
                <div className={styles.requestInfoMessage}>{infoModal.admin_response}</div>
              </div>
            )}

            <button className={styles.requestInfoOkBtn} onClick={() => setInfoModal(null)}>
              Закрыть
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default RequestsSection;
