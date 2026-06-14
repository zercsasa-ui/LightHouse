import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import styles from './RequestForm.module.css';

const RequestForm = ({ initialMessage = '', onSuccess }) => {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState(initialMessage);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Отдельные поля для товара
  const [productName, setProductName] = useState(initialMessage);
  const [productQuantity, setProductQuantity] = useState('');
  const [productExtra, setProductExtra] = useState('');

  // Отдельные поля для услуги
  const [serviceType, setServiceType] = useState('');
  const [workDescription, setWorkDescription] = useState('');
  const [workAddress, setWorkAddress] = useState('');
  const [visitTime, setVisitTime] = useState('');

  // Обновляем поле товара когда меняется initialMessage из пропсов
  useEffect(() => {
    if (initialMessage) {
      setSelectedTemplate('product');
      setProductName(initialMessage);
      setMessage(initialMessage);
    } else {
      setMessage(initialMessage);
    }
  }, [initialMessage]);

  const [loading, setLoading] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [phoneError, setPhoneError] = useState('');
  const maxMessageLength = 800;

  // Валидация номера телефона (проверяем длину после очистки)
  const validatePhone = (phoneNumber) => {
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    // Минимум 10 цифр для валидного номера
    return cleanNumber.length >= 10;
  };

  const handleTemplateClick = (template) => {
    if (selectedTemplate === template) {
      setSelectedTemplate(null);
      setProductName('');
      setProductQuantity('');
      setProductExtra('');
      setServiceType('');
      setWorkDescription('');
      setWorkAddress('');
      setVisitTime('');
      setMessage('');
    } else {
      setSelectedTemplate(template);
      if (template === 'product') {
        setProductName(initialMessage || '');
        setProductQuantity('');
        setProductExtra('');
        setMessage(initialMessage || '');
      } else {
        setServiceType('');
        setWorkDescription('');
        setWorkAddress('');
        setVisitTime('');
        setMessage('');
      }
    }
  };

  // Собираем сообщение из полей перед отправкой
  const buildMessage = () => {
    if (selectedTemplate === 'product') {
      let msg = '';
      if (productName) msg += `Интересует товар: ${productName}`;
      if (productQuantity) msg += `\nКоличество: ${productQuantity}`;
      if (productExtra) msg += `\n\nДополнительная информация: ${productExtra}`;
      return msg || 'Товар не указан';
    } else if (selectedTemplate === 'service') {
      let msg = '';
      if (serviceType) msg += `Требуется услуга: ${serviceType}`;
      if (workDescription) msg += `\nОписание работ: ${workDescription}`;
      if (workAddress) msg += `\nАдрес объекта: ${workAddress}`;
      if (visitTime) msg += `\nУдобное время для визита: ${visitTime}`;
      return msg || 'Услуга не указана';
    }
    return message || 'Заявка без описания';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      navigate('/auth');
      return;
    }

    if (!validatePhone(phone)) {
      setPhoneError('Введите корректный номер телефона');
      return;
    }

    const finalMessage = buildMessage();
    if (!phone || !finalMessage) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('requests')
        .insert({
          user_id: user.id,
          phone,
          message: finalMessage,
          status: 'pending'
        });

      if (error) throw error;

      setPhone('');
      setMessage('');
      setProductName('');
      setProductQuantity('');
      setProductExtra('');
      setServiceType('');
      setWorkDescription('');
      setWorkAddress('');
      setVisitTime('');
      setSelectedTemplate(null);
      setSuccessModal(true);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('Ошибка при отправке заявки');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!user ? (
        <div className={styles.loginPrompt}>
          <p>Для отправки заявки необходимо <button onClick={() => navigate('/auth')}>войти</button></p>
        </div>
      ) : (
        <form className={styles.requestForm} onSubmit={handleSubmit}>
          {/* Переключатель шаблонов */}
          {!initialMessage && (
            <div className={styles.templateSelector}>
              <button
                type="button"
                className={`${styles.templateBtn} ${selectedTemplate === 'product' ? styles.templateBtnActive : ''}`}
                onClick={() => handleTemplateClick('product')}
              >
                Для товара
              </button>
              <button
                type="button"
                className={`${styles.templateBtn} ${selectedTemplate === 'service' ? styles.templateBtnActive : ''}`}
                onClick={() => handleTemplateClick('service')}
              >
                Для услуги
              </button>
            </div>
          )}

          <div className={styles.formGroup}>
            <label>Телефон для связи *</label>
            <PhoneInput
              country={'ru'}
              value={phone}
              onChange={(phone) => {
                setPhone('+' + phone);
                setPhoneError('');
              }}
              inputClass={styles.phoneInput}
              containerClass={styles.phoneInputContainer}
              buttonClass={styles.phoneInputButton}
              placeholder="+7 (999) 123-45-67"
              enableSearch={true}
              searchPlaceholder="Поиск страны..."
              localization={{ ru: 'Россия' }}
              preferredCountries={['ru', 'kz', 'by', 'ua']}
            />
            {phoneError && <span className={styles.errorText}>{phoneError}</span>}
          </div>

          {selectedTemplate === 'product' && (
            <>
              <div className={styles.formGroup}>
                <label>Название товара</label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Введите название товара"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Количество</label>
                <input
                  type="text"
                  value={productQuantity}
                  onChange={(e) => setProductQuantity(e.target.value)}
                  placeholder="Например: 5 шт"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Дополнительная информация (необязательно)</label>
                <textarea
                  value={productExtra}
                  onChange={(e) => setProductExtra(e.target.value)}
                  placeholder="Цвет, мощность, бренд, когда сможете забрать..."
                  rows={2}
                />
              </div>
            </> 
          )}

          {selectedTemplate === 'service' && (
            <>
              <div className={styles.formGroup}>
                <label>Тип услуги</label>
                <input
                  type="text"
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  placeholder="Например: электромонтаж, замена проводки"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Описание работ</label>
                <textarea
                  value={workDescription}
                  onChange={(e) => setWorkDescription(e.target.value)}
                  placeholder="Кратко опишите, что нужно сделать"
                  rows={2}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Адрес объекта</label>
                <input
                  type="text"
                  value={workAddress}
                  onChange={(e) => setWorkAddress(e.target.value)}
                  placeholder="г. Москва, ул. Ленина, д. 10"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Удобное время для визита</label>
                <input
                  type="text"
                  value={visitTime}
                  onChange={(e) => setVisitTime(e.target.value)}
                  placeholder="Например: будни после 18:00"
                />
              </div>
            </>
          )}

          {!selectedTemplate && (
            <div className={styles.formGroup}>
              <div className={styles.textareaHeader}>
                <label htmlFor="message">Сообщение *</label>
                <span className={styles.charCount}>{message.length}/{maxMessageLength}</span>
              </div>
              <textarea
                id="message"
                value={message}
                onChange={(e) => {
                  if (e.target.value.length <= maxMessageLength) {
                    setMessage(e.target.value);
                  }
                }}
                placeholder="Опишите, что вам нужно..."
                rows={4}
                maxLength={maxMessageLength}
                required
              />
            </div>
          )}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading || !phone}
          >
            {loading ? 'Отправка...' : 'Отправить заявку'}
          </button>
        </form>
      )}

      {/* Модальное окно успешной отправки */}
      {successModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.successIcon}>✓</div>
            <h3 className={styles.modalTitle}>Заявка успешно отправлена!</h3>
            <p className={styles.modalMessage}>
              Мы получили вашу заявку. В ближайшее время с вами свяжется наш менеджер для уточнения деталей.
            </p>
            <button
              className={styles.modalCloseBtn}
              onClick={() => setSuccessModal(false)}
            >
              Хорошо
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default RequestForm;