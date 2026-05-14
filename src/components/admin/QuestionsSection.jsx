import { supabase } from '../../supabase';
import styles from '../../pages/Admin.module.css';

const QuestionsSection = ({
  questions,
  products,
  questionSearch,
  setQuestionSearch,
  questionStatusFilter,
  setQuestionStatusFilter,
  editingQuestion,
  setEditingQuestion,
  answerText,
  setAnswerText,
  hoveredProduct,
  setHoveredProduct,
  openConfirmModal,
  fetchData,
  showSuccess,
  user,
  userProfile,
  globalViewMode,
  setGlobalViewMode
}) => {

  // Фильтрация вопросов
  const filteredQuestions = questions.filter(q => {
    if (!questionSearch.trim()) return true;
    const query = questionSearch.toLowerCase();
    return (
      q.user_name?.toLowerCase().includes(query) ||
      q.question?.toLowerCase().includes(query) ||
      q.products?.name?.toLowerCase().includes(query)
    );
  }).filter(q => {
    if (!questionStatusFilter) return true;
    if (questionStatusFilter === 'new') return !q.is_published;
    if (questionStatusFilter === 'published') return q.is_published;
    if (questionStatusFilter === 'answered') return q.is_answered;
    return true;
  });

  const handleMouseEnter = (e, questionId) => {
    setHoveredProduct(questionId);
    window.lastMouseX = e.clientX;
    window.lastMouseY = e.clientY;
  };

  const handleSendAnswer = async (question) => {
    // Если ответ пустой и уже существует ответ - удаляем его
    if (!answerText.trim() && question.product_answers && question.product_answers.length > 0) {
      // Удаляем напрямую без модального окна, так как это автоматическое действие при очистке ответа
      const answerId = question.product_answers[0].id;
      
      try {
        const { error } = await supabase
          .from('product_answers')
          .delete()
          .eq('id', answerId);
        
        if (error) throw error;
        
        // Сбрасываем статус вопроса
        await supabase
          .from('product_questions')
          .update({ is_answered: false, is_published: false })
          .eq('id', question.id);
        
        setEditingQuestion(null);
        setAnswerText('');
        fetchData();
        showSuccess('Ответ успешно удален!');
      } catch (error) {
        console.error('Ошибка при удалении ответа:', error);
        alert(`Ошибка: ${error.message}`);
      }
      return;
    }

    // Если ответ пустой и нет существующего ответа - ничего не делаем
    if (!answerText.trim()) {
      alert('Введите текст ответа');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch('https://mutebkvjowivxupnexzp.supabase.co/functions/v1/submit-answer', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          questionId: question.id,
          answerText: answerText,
          responderId: user.id,
          responderName: userProfile.name
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка сервера');
      }

      setEditingQuestion(null);
      setAnswerText('');
      fetchData();
      showSuccess(' Ответ сохранен и опубликован!');
    } catch (error) {
      console.error('Ошибка отправки ответа:', error);
      alert(`Ошибка: ${error.message}`);
    }
  };

  const handlePublishQuestion = async (questionId) => {
    await supabase
      .from('product_questions')
      .update({ is_published: true })
      .eq('id', questionId);
    fetchData();
    showSuccess('Вопрос опубликован!');
  };

  const handleUnpublishQuestion = async (question) => {
    try {
      // Сначала удаляем ответ, если он есть
      if (question.product_answers && question.product_answers.length > 0) {
        const answerId = question.product_answers[0].id;
        
        const { error: deleteError } = await supabase
          .from('product_answers')
          .delete()
          .eq('id', answerId);
        
        if (deleteError) throw deleteError;
      }
      
      // Меняем статус вопроса на "На модерации"
      const { error: updateError } = await supabase
        .from('product_questions')
        .update({ is_published: false, is_answered: false })
        .eq('id', question.id);
      
      if (updateError) throw updateError;
      
      fetchData();
      showSuccess('Вопрос снят с публикации и отправлен на модерацию!');
    } catch (error) {
      console.error('Ошибка при снятии вопроса с публикации:', error);
      alert(`Ошибка: ${error.message}`);
    }
  };


  if (filteredQuestions.length === 0) {
    return <p className={styles.empty}>Вопросов пока нет</p>;
  }

  return (
    <div className={`${styles.requestsList} ${globalViewMode === 'grid' ? styles.requestsGrid : ''}`}>
      {filteredQuestions.map(q => (
        <div key={q.id} className={styles.requestCard}>
          <div className={styles.requestLeft}>
            <div className={styles.requestHeader}>
              <div>
                Пользователь: <strong> {q.user_name}</strong>
                <div
                  style={{
                    fontSize: '13px',
                    color: '#0d9488',
                    marginTop: '4px',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                  onClick={() => window.open(`/product/${q.products.id}`, '_blank')}
                  onMouseEnter={(e) => handleMouseEnter(e, q.products.id)}
                  onMouseLeave={() => setHoveredProduct(null)}
                >
                  О товаре: <strong>{q.products?.name}</strong>

                  {/* Всплывающая карточка товара при наведении */}
                  {hoveredProduct === q.products.id && (
                    <div style={{
                      position: 'fixed',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '12px',
                      width: '220px',
                      zIndex: 999,
                      boxShadow: '0 8px 24px var(--shadow-color)',
                      left: `${document.body.scrollLeft + window.lastMouseX - 110}px`,
                      top: `${document.body.scrollTop + window.lastMouseY + 10}px`,
                      animation: 'fadeIn 0.15s ease'
                    }}>
                      <img
                        src={products.find(p => p.id === q.products.id)?.image_url || 'https://via.placeholder.com/200'}
                        alt={q.products.name}
                        style={{
                          width: '100%',
                          height: '100px',
                          objectFit: 'contain',
                          borderRadius: '4px',
                          marginBottom: '8px',
                          background: 'var(--bg-tertiary)'
                        }}
                      />
                      <p style={{ margin: '0 0 4px 0', fontWeight: 600, fontSize: '13px' }}>{q.products.name}</p>
                      <p style={{ margin: '0', fontSize: '12px', color: '#0d9488' }}>
                        Цена: {products.find(p => p.id === q.products.id)?.price || 0} ₽
                      </p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'var(--text-secondary)' }}>
                        На складе: {products.find(p => p.id === q.products.id)?.stock || 0} шт.
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <span className={styles.requestDate}>
                {new Date(q.created_at).toLocaleDateString('ru-RU')}
              </span>
            </div>
            <p className={styles.requestMessage}>Cпрашивает: {q.question}</p>
          </div>

            <div className={styles.requestRight}>
              <div className={styles.requestStatus}>
                {!q.is_published && <span className={`${styles.status} ${styles.statusPending}`}>На модерации</span>}
                {q.is_published && !q.is_answered && <span className={`${styles.status} ${styles.statusInProgress}`}>Опубликован</span>}
                {q.is_answered && <span className={`${styles.status} ${styles.statusCompleted}`}>Отвечен</span>}
              </div>
              
              {/* Отображаем ответ если он существует - вынесено из requestActions */}
              {q.product_answers && q.product_answers.length > 0 && (
                <div style={{
                  width: '100%',
                  marginTop: '12px',
                  padding: '12px',
                  background: 'rgba(13, 148, 136, 0.08)',
                  borderLeft: '3px solid #0d9488',
                  borderRadius: '0 8px 8px 0'
                }}>
                  <div style={{
                    fontWeight: 600,
                    color: '#0d9488',
                    fontSize: '13px',
                    marginBottom: '6px'
                  }}>
                    Ответ от {q.product_answers[0].responder_name}:
                  </div>
                  <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-primary)' }}>
                    {q.product_answers[0].answer_text}
                  </p>
                </div>
              )}
              
              <div className={styles.requestActions}>
                {editingQuestion !== q.id ? (
                  <>
                    <button
                    className={styles.editBtn}
                    onClick={() => {
                      setEditingQuestion(q.id);
                      // Если есть уже ответ - подставляем его в поле ввода
                      if (q.product_answers && q.product_answers.length > 0) {
                        setAnswerText(q.product_answers[0].answer_text);
                      } else {
                        setAnswerText('');
                      }
                    }}
                  >
                    {q.product_answers && q.product_answers.length > 0 ? 'Изменить ответ' : 'Ответить'}
                  </button>
                  
                  {q.product_answers && q.product_answers.length > 0 && (
                    <button
                      className={styles.deleteBtn}
                      onClick={() => openConfirmModal('delete_answer', q)}
                      title="Удалить ответ"
                    >
                      Удалить ответ
                    </button>
                  )}
                  {!q.is_published && (
                    <button
                      className={styles.editBtn}
                      onClick={() => handlePublishQuestion(q.id)}
                    >
                      Опубликовать
                    </button>
                  )}
                  {q.is_published && (
                    <button
                      className={styles.deleteBtn}
                      onClick={() => handleUnpublishQuestion(q)}
                    >
                      Убрать из публикации
                    </button>
                  )}
                  <button
                    className={styles.deleteBtn}
                    onClick={() => openConfirmModal('delete_question', q)}
                  >
                    Удалить
                  </button>
                </>
              ) : null}
            </div>
          </div>

          {editingQuestion === q.id && (
            <div className={styles.editForm}>
              <textarea
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value.slice(0, 500))}
                placeholder="Ответ на вопрос..."
                rows={3}
                maxLength={500}
              />
              <div className={styles.editActions}>
                <button onClick={() => handleSendAnswer(q)}>Отправить ответ</button>
                <button onClick={() => setEditingQuestion(null)}>Отмена</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default QuestionsSection;
