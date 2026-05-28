import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import styles from './Auth.module.css';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [loginInput, setLoginInput] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const { login, register, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Функция экранирования XSS
  const sanitizeInput = (input) => {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML.replace(/[<>"'&/]/g, '').trim();
  };

  // Валидация email
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Валидация никнейма
  const validateName = (name) => {
    // Проверка длины
    if (name.length < 2 || name.length > 30) {
      return { valid: false, message: 'Никнейм должен быть от 2 до 30 символов' };
    }

    // Проверка на только пробелы
    if (/^\s*$/.test(name)) {
      return { valid: false, message: 'Никнейм не может состоять только из пробелов' };
    }

    // Запрет пробелов в начале и конце
    if (/^\s|\s$/.test(name)) {
      return { valid: false, message: 'Никнейм не может начинаться или заканчиваться пробелом' };
    }

    // Запрет нескольких пробелов подряд
    if (/\s{2,}/.test(name)) {
      return { valid: false, message: 'Никнейм не может содержать несколько пробелов подряд' };
    }

    // Разрешённые символы: кириллица, латиница, цифры, пробел, тире, нижнее подчёркивание
    const allowedCharsRegex = /^[а-яА-ЯёЁa-zA-Z0-9\s\-_]+$/;
    if (!allowedCharsRegex.test(name)) {
      return { valid: false, message: 'Никнейм может содержать только буквы, цифры, пробелы, тире и нижнее подчёркивание' };
    }

    // Запрет никнейма состоящего только из цифр
    if (/^\d+$/.test(name)) {
      return { valid: false, message: 'Никнейм не может состоять только из цифр' };
    }

    // Запрет более 4 одинаковых символов подряд
    if (/(.)\1{4,}/.test(name)) {
      return { valid: false, message: 'Слишком много одинаковых символов подряд' };
    }

    return { valid: true };
  };

  // Валидация пароля
  const validatePassword = (password) => {
    return password.length >= 6 && password.length <= 128;
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const sanitizedEmail = sanitizeInput(forgotEmail);

      if (!validateEmail(sanitizedEmail)) {
        throw new Error('Введите корректный email адрес');
      }

      // Вызываем Database Function (обходит RLS через SECURITY DEFINER)
      const { data: result, error: rpcError } = await supabase.rpc(
        'set_password_reset_flag',
        { target_email: sanitizedEmail }
      );

      if (rpcError) throw rpcError;

      if (result === false) {
        throw new Error('Пользователь с таким email не найден');
      }

      setSuccess('Запрос на сброс пароля отправлен администратору. Ожидайте уведомления.');
      setForgotEmail('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isLogin) {
        if (!loginInput.trim() || !password) {
          throw new Error('Заполните все поля');
        }

        const sanitizedLogin = sanitizeInput(loginInput);
        
        if (sanitizedLogin.length < 2) {
          throw new Error('Некорректный логин');
        }

        await login(sanitizedLogin, password);
        navigate('/');
      } else {
        if (!email.trim() || !password || !name.trim()) {
          throw new Error('Заполните все поля');
        }

        if (!agreed) {
          throw new Error('Необходимо согласие на обработку персональных данных');
        }

        const sanitizedName = sanitizeInput(name);
        const sanitizedEmail = sanitizeInput(email);

        const nameValidation = validateName(sanitizedName);
        if (!nameValidation.valid) {
          throw new Error(nameValidation.message);
        }

        if (!validateEmail(sanitizedEmail)) {
          throw new Error('Введите корректный email адрес');
        }

        if (!validatePassword(password)) {
          throw new Error('Пароль должен быть от 6 до 128 символов');
        }

        await register(sanitizedEmail, password, sanitizedName);
        setSuccess('Регистрация успешна! Теперь вы можете войти.');
        setTimeout(() => setIsLogin(true), 2000);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Возврат к форме входа
  const backToLogin = () => {
    setForgotPassword(false);
    setForgotEmail('');
    setError('');
    setSuccess('');
  };

  return (
    <div className={styles.authContainer}>
      <button className={styles.backToHomeBtn} onClick={() => navigate('/')}>
        ← На главную
      </button>
      <div className={styles.authCard}>
        <h2 className={styles.authTitle}>
          {forgotPassword ? 'Восстановление пароля' : (isLogin ? 'Вход' : 'Регистрация')}
        </h2>
        
        {error && <div className={styles.errorMessage}>{error}</div>}
        {success && <div className={styles.successMessage}>{success}</div>}
        
        {forgotPassword ? (
          <form className={styles.authForm} onSubmit={handleForgotPassword}>
            <div className={styles.formGroup}>
              <label htmlFor="forgotEmail">Ваш email</label>
              <input
                type="email"
                id="forgotEmail"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="Введите email, указанный при регистрации"
                required
              />
            </div>

            <button 
              type="submit" 
              className={styles.authButton}
              disabled={loading}
            >
              {loading ? 'Отправка...' : 'Отправить запрос'}
            </button>

            <button 
              type="button" 
              className={styles.backToLoginBtn}
              onClick={backToLogin}
            >
              ← Вернуться ко входу
            </button>
          </form>
        ) : (
          <form className={styles.authForm} onSubmit={handleSubmit}>
            {isLogin ? (
              <div className={styles.formGroup}>
                <label htmlFor="loginInput">Email или никнейм</label>
                <input
                  type="text"
                  id="loginInput"
                  value={loginInput}
                  onChange={(e) => setLoginInput(e.target.value)}
                  placeholder="Введите email или никнейм"
                  required
                />
              </div>
            ) : (
              <>
                <div className={styles.formGroup}>
                  <label htmlFor="name">Никнейм</label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Придумайте никнейм"
                    required
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Введите email"
                    required
                  />
                </div>
              </>
            )}
            
            <div className={styles.formGroup}>
              <label htmlFor="password">Пароль</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите пароль"
                required
                minLength={6}
              />
            </div>
            
            {isLogin && (
              <button
                type="button"
                className={styles.forgotPasswordBtn}
                onClick={() => {
                  setForgotPassword(true);
                  setError('');
                  setSuccess('');
                }}
              >
                Забыли пароль?
              </button>
            )}
            
            {!isLogin && (
              <div className={styles.agreementGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className={styles.checkboxInput}
                    required
                  />
                  <span className={styles.checkboxCustom} />
                  <span
                    className={styles.agreementText}
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                  >
                    Я согласен на{' '}
                    <a
                      href="https://www.consultant.ru/document/cons_doc_LAW_61801/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.agreementLink}
                    >
                      обработку персональных данных
                    </a>
                    {showTooltip && (
                      <span className={styles.tooltip}>
                        Нажимая «Зарегистрироваться», вы даёте согласие на сбор, хранение и обработку
                        ваших персональных данных (ФИО, email, никнейм) в соответствии с Федеральным
                        законом № 152-ФЗ «О персональных данных». Ваши данные используются только для
                        создания и поддержки учётной записи на сайте и не передаются третьим лицам.
                      </span>
                    )}
                  </span>
                </label>
              </div>
            )}

            <button 
              type="submit" 
              className={styles.authButton}
              disabled={loading || (!isLogin && !agreed)}
            >
              {loading ? 'Загрузка...' : (isLogin ? 'Войти' : 'Зарегистрироваться')}
            </button>
          </form>
        )}
        
        {!forgotPassword && (
          <div className={styles.authSwitch}>
            {isLogin ? (
              <p>
                Нет аккаунта?{' '}
                <button type="button" onClick={() => setIsLogin(false)}>
                  Зарегистрироваться
                </button>
              </p>
            ) : (
              <p>
                Уже есть аккаунт?{' '}
                <button type="button" onClick={() => setIsLogin(true)}>
                  Войти
                </button>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;