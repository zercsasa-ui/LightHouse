import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './Guide.module.css';


const sections = [
  { id: 'intro', title: 'Введение', icon: '/images/ico/icoObsh.png' },
  { id: 'interface', title: 'Интерфейс', icon: '/images/ico/icoInterf.png' },
  { id: 'rooms', title: 'Создание комнат', icon: '/images/ico/icoRom.png' },
  { id: 'lamps', title: 'Добавление ламп', icon: '/images/ico/lampIcoRedact.png' },
  { id: 'wires', title: 'Проводка', icon: '/images/ico/icoProv.png' },
  { id: 'auto', title: 'Авто-расчёт', icon: '/images/ico/icoCalc.png' },
  { id: 'heatmap', title: 'Тепловая карта', icon: '/images/ico/icoTermo.png' },
  { id: 'settings', title: 'Настройки', icon: '/images/ico/icoSet.png' },
  { id: 'export', title: 'Экспорт/Импорт', icon: '/images/ico/icoExp.png' },
  { id: 'tips', title: 'Советы', icon: '/images/ico/LikeIco.png' },
];

const Guide = () => {
  const [activeSection, setActiveSection] = useState('intro');

  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;
      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []); // Зависимости пусты, так как sections больше не зависит от рендера

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Калькулятор освещения и проводки</h1>
        <p className={styles.subtitle}>Полное руководство по использованию</p>
      </div>
      <div className={styles.mainLayout} >
        <aside className={styles.sidebar}>
          <nav>
            <ul className={styles.navList}>
              {sections.map(section => (
                <li key={section.id} className={styles.navItem}>
                  <button
                    className={`${styles.navLink} ${activeSection === section.id ? styles.active : ''}`}
                    onClick={() => scrollToSection(section.id)}
                  >
                    {section.icon && (
                      <img src={section.icon} alt="" className={styles.navIcon} />
                    )}
                    {section.title}
                  </button>
                </li>
              ))}
            </ul>

            {/* 🆕 Плашка перехода в справочник оборудования */}
            <ul className={styles.navList} style={{ marginTop: '15px', }}>
              <li className={styles.navItem} style={{ paddingTop: '0px', borderRadius: '8px', }}>
                <Link to="/equipment-guide" className={styles.navLink} style={{ fontWeight: '600' }}>
                   Общий справочник
                </Link>
              </li></ul>
          </nav>
        </aside>


        <main className={styles.content} >
          {/* Введение */}
          <section id="intro" className={styles.section} >
            <h2 className={styles.sectionTitle} >Введение </h2 >
            <div className={styles.sectionContent} >
              <div className={styles.block} >
                <h3 className={styles.blockTitle} >Что такое калькулятор освещения? </h3 >
                <div className={styles.blockContent} >
                  <p >
                    Калькулятор освещения — это интерактивный инструмент для проектирования системы
                    освещения помещений. Он позволяет:
                  </p >
                  <ul >
                    <li >Создавать план комнат с точными размерами </li >
                    <li >Размещать светильники и рассчитывать их количество </li >
                    <li >Визуализировать зоны освещения разной интенсивности </li >
                    <li >Рассчитывать необходимую длину проводки </li >
                    <li >Оценивать стоимость материалов и энергопотребления </li >
                  </ul >
                </div >
              </div >

              <div className={`${styles.block} ${styles.success}`} >
                <h3 className={styles.blockTitle} >Для кого этот инструмент? </h3 >
                <div className={styles.blockContent} >
                  <p >
                    Калькулятор полезен электрикам, дизайнерам интерьера, архитекторам и всем,
                    кто планирует ремонт или строительство. Он помогает избежать ошибок при расчёте
                    освещения и оптимизировать затраты на материалы.
                  </p >
                </div >
              </div >
            </div >
          </section >

          {/* Интерфейс */}
          <section id="interface" className={styles.section} >
            <h2 className={styles.sectionTitle} >Интерфейс </h2 >
            <div className={styles.sectionContent} >
              <div className={styles.block} >
                <h3 className={styles.blockTitle} >Панель инструментов </h3 >
                <div className={styles.blockContent} >
                  <p >В верхней части экрана расположена панель с основными инструментами: </p >
                  <ul >
                    <li > <strong >Курсор </strong > — выбор и перемещение объектов на плане </li >
                    <li > <strong >Провод </strong > — рисование линий проводки </li >
                    <li > <strong >Лампа </strong > — добавление светильников </li >
                    <li > <strong >Комната </strong > — создание новых помещений </li >
                  </ul >
                </div >
              </div >

              <div className={styles.block} >
                <h3 className={styles.blockTitle} >Боковая панель </h3 >
                <div className={styles.blockContent} >
                  <p >
                    Справа находится панель с параметрами выбранного объекта и общими расчётами.
                    Она включает вкладки:
                  </p >
                  <ul >
                    <li >Параметры лампы/комнаты </li >
                    <li >Общие расчёты </li >
                    <li >Проводка </li >
                    <li >Автоматический расчёт </li >
                    <li >Расчёт стоимости </li >
                  </ul >
                </div >
              </div >

              <div className={styles.block} >
                <h3 className={styles.blockTitle} >Рабочая область </h3 >
                <div className={styles.blockContent} >
                  <p >
                    Центральная часть экрана — это холст с сеткой, где вы создаёте план.
                    Каждая ячейка сетки соответствует 1 метру. В правом нижнем углу
                    отображается текущий инструмент и подсказки по управлению.
                  </p >
                </div >
              </div >
            </div >
          </section >

          {/* Создание комнат */}
          <section id="rooms" className={styles.section} >
            <h2 className={styles.sectionTitle} >Создание комнат </h2 >
            <div className={styles.sectionContent} >
              <div className={styles.block} >
                <h3 className={styles.blockTitle} >Как добавить комнату </h3 >
                <div className={styles.blockContent} >
                  <p >
                    1. Выберите инструмент <strong >«Комната» </strong > на панели инструментов <br />
                    2. Кликните в любом месте рабочей области <br />
                    3. Комната будет создана с размерами по умолчанию (4×3 м) <br />
                    4. Перетащите комнату в нужное место, если необходимо
                  </p >
                </div >
              </div >

              <div className={styles.block} >
                <h3 className={styles.blockTitle} >Редактирование параметров комнаты </h3 >
                <div className={styles.blockContent} >
                  <p >После создания комнаты вы можете изменить её параметры в боковой панели: </p >
                  <ul >
                    <li > <strong >Название </strong > — например, "Гостиная", "Кухня" </li >
                    <li > <strong >Ширина и глубина </strong > — размеры в метрах </li >
                    <li > <strong >Высота потолков </strong > — важна для расчёта освещения </li >
                    <li > <strong >Тип помещения </strong > — определяет норму освещённости </li >
                  </ul >
                </div >
              </div >

              <div className={`${styles.block} ${styles.highlight}`} >
                <h3 className={styles.blockTitle} >Типы помещений и нормы освещённости </h3 >
                <div className={styles.blockContent} >
                  <table className={styles.table} >
                    <thead >
                      <tr >
                        <th >Помещение </th >
                        <th >Норма (Люкс) </th >
                      </tr >
                    </thead >
                    <tbody >
                      <tr > <td >Гостиная </td > <td >150 </td > </tr >
                      <tr > <td >Спальня </td > <td >100 </td > </tr >
                      <tr > <td >Кухня </td > <td >200 </td > </tr >
                      <tr > <td >Кухня (рабочая зона) </td > <td >350 </td > </tr >
                      <tr > <td >Ванная </td > <td >150 </td > </tr >
                      <tr > <td >Коридор </td > <td >75 </td > </tr >
                      <tr > <td >Рабочий кабинет </td > <td >300 </td > </tr >
                      <tr > <td >Детская </td > <td >200 </td > </tr >
                    </tbody >
                  </table >
                </div >
              </div >

              <div className={`${styles.block} ${styles.warning}`} >
                <h3 className={styles.blockTitle} >Важно! </h3 >
                <div className={styles.blockContent} >
                  <p >
                    Комнаты не должны пересекаться. При попытке разместить комнату в месте,
                    где уже есть другая, система не позволит это сделать. Однако комнаты
                    могут прилегать друг к другу (иметь общие стены).
                  </p >
                </div >
              </div >
            </div >
          </section >

          {/* Добавление ламп */}
          <section id="lamps" className={styles.section} >
            <h2 className={styles.sectionTitle} >Добавление ламп </h2 >
            <div className={styles.sectionContent} >
              <div className={styles.block} >
                <h3 className={styles.blockTitle} >Как добавить лампу </h3 >
                <div className={styles.blockContent} >
                  <p >
                    1. Выберите инструмент <strong >«Лампа» </strong > <br />
                    2. Кликните в нужном месте на плане (внутри комнаты) <br />
                    3. Лампа будет добавлена с параметрами по умолчанию
                  </p >
                </div >
              </div >

              <div className={styles.block} >
                <h3 className={styles.blockTitle} >Параметры лампы </h3 >
                <div className={styles.blockContent} >
                  <p >После добавления вы можете настроить каждую лампу: </p >
                  <ul >
                    <li > <strong >Тип лампы </strong > — LED, галогенная, люминесцентная и др. </li >
                    <li > <strong >Мощность (Вт) </strong > — потребляемая мощность </li >
                    <li > <strong >Световой поток (Лм) </strong > — количество света </li >
                    <li > <strong >Угол рассеивания (°) </strong > — ширина светового конуса </li >
                    <li > <strong >Высота установки (м) </strong > — расстояние от лампы до пола </li >
                  </ul >
                </div >
              </div >
            </div >
          </section >

          {/* Проводка */}
          <section id="wires" className={styles.section} >
            <h2 className={styles.sectionTitle} >Проводка </h2 >
            <div className={styles.sectionContent} >
              <div className={styles.block} >
                <h3 className={styles.blockTitle} >Как проложить провод </h3 >
                <div className={styles.blockContent} >
                  <p >
                    1. Выберите инструмент <strong >«Провод» </strong > <br />
                    2. Зажмите левую кнопку мыши и ведите курсор по плану <br />
                    3. Отпустите кнопку для завершения линии. Провод отобразится красным цветом
                  </p >
                </div >
              </div >
              <div className={`${styles.block} ${styles.warning}`} >
                <h3 className={styles.blockTitle} >Управление проводкой </h3 >
                <div className={styles.blockContent} >
                  <p >
                    Используйте кнопку <strong >«Отменить последнее действие»</strong > для удаления последнего отрезка.
                    Для полной очистки нажмите кнопку <strong >«Провода»</strong > и подтвердите удаление.
                  </p >
                </div >
              </div >
            </div >
          </section >

          {/* Авто-расчёт */}
          <section id="auto" className={styles.section} >
            <h2 className={styles.sectionTitle} >Авто-расчёт </h2 >
            <div className={styles.sectionContent} >
              <div className={styles.block} >
                <h3 className={styles.blockTitle} >Алгоритм расчёта </h3 >
                <div className={styles.blockContent} >
                  <p >На основе выбранной комнаты система вычисляет необходимый световой поток: <br />
                    <em >Требуемый поток = Норма (Люкс) × Площадь (м²) × Коэффициент запаса</em >
                  </p >
                </div >
              </div >
              <div className={styles.block} >
                <h3 className={styles.blockTitle} >Оценка достаточности </h3 >
                <div className={styles.blockContent} >
                  <p >Калькулятор сравнивает текущее количество ламп с рекомендуемым. Результат выводится с цветовой индикацией:</p >
                  <ul >
                    <li >🟢 <strong >Норма:</strong > текущих ламп достаточно </li >
                    <li >🔴 <strong >Недостаточно:</strong > показано точное количество ламп, которое необходимо добавить </li >
                  </ul >
                </div >
              </div >
            </div >
          </section >

          {/* Тепловая карта */}
          <section id="heatmap" className={styles.section} >
            <h2 className={styles.sectionTitle} >Тепловая карта </h2 >
            <div className={styles.sectionContent} >
              <div className={styles.block} >
                <h3 className={styles.blockTitle} >Визуализация освещённости </h3 >
                <div className={styles.blockContent} >
                  <p >Нажмите кнопку <strong >🌡️ Тепловая карта</strong > на панели инструментов. На холсте появится цветовая сетка, показывающая реальное распределение света с учётом расстояния, угла рассеивания и высоты установки.</p >
                </div >
              </div >
              <div className={`${styles.block} ${styles.highlight}`} >
                <h3 className={styles.blockTitle} >Чтение шкалы </h3 >
                <div className={styles.blockContent} >
                  <ul >
                    <li ><strong >Синий/Зелёный:</strong > Низкая освещённость (0–150 Люкс) </li >
                    <li ><strong >Жёлтый:</strong > Комфортная зона (150–300 Люкс) </li >
                    <li ><strong >Красный:</strong > Высокая/Яркая зона (300+ Люкс) </li >
                  </ul >
                </div >
              </div >
            </div >
          </section >

          {/* Настройки */}
          <section id="settings" className={styles.section} >
            <h2 className={styles.sectionTitle} >Настройки и стоимость </h2 >
            <div className={styles.sectionContent} >
              <div className={styles.block} >
                <h3 className={styles.blockTitle} >Ценовые параметры </h3 >
                <div className={styles.blockContent} >
                  <p >Введите актуальные цены для точного расчёта бюджета:</p >
                  <ul >
                    <li ><strong >Цена провода за метр:</strong > учитывает общую длину всех линий </li >
                    <li ><strong >Цена одной лампы:</strong > умножается на общее количество светильников </li >
                    <li ><strong >Цена электроэнергии:</strong > ваш тариф в ₽/кВт·ч </li >
                  </ul >
                </div >
              </div >
              <div className={`${styles.block} ${styles.success}`} >
                <h3 className={styles.blockTitle} >Итоговая смета </h3 >
                <div className={styles.blockContent} >
                  <p >Поле <strong >«Итого общая стоимость»</strong > суммирует затраты на материалы. Отдельно рассчитывается годовой расход электроэнергии исходя из 5 часов работы в сутки.</p >
                </div >
              </div >
            </div >
          </section >

          {/* Экспорт/Импорт */}
          <section id="export" className={styles.section} >
            <h2 className={styles.sectionTitle} >Экспорт/Импорт </h2 >
            <div className={styles.sectionContent} >
              <div className={styles.block} >
                <h3 className={styles.blockTitle} >Сохранение и загрузка </h3 >
                <div className={styles.blockContent} >
                  <p >Нажмите <strong >Экспорт</strong >, чтобы скачать проект в JSON. Файл содержит все комнаты, провода, лампы и настройки цен. <br />
                    Нажмите <strong >Импорт</strong > и выберите ранее сохранённый файл для восстановления проекта.</p >
                </div >
              </div >
              <div className={`${styles.block} ${styles.highlight}`} >
                <h3 className={styles.blockTitle} >Автосохранение </h3 >
                <div className={styles.blockContent} >
                  <p >Проект автоматически сохраняется в <code >localStorage</code > при каждом изменении. Данные хранятся в течение 1 часа и восстанавливаются при перезагрузке страницы.</p >
                </div >
              </div >
            </div >
          </section >

          {/* Советы */}
          <section id="tips" className={styles.section} >
            <h2 className={styles.sectionTitle} >Советы </h2 >
            <div className={styles.sectionContent} >
              <div className={styles.block} >
                <h3 className={styles.blockTitle} >Планирование и управление </h3 >
                <div className={styles.blockContent} >
                  <ul >
                    <li >Начинайте с общего освещения, затем добавляйте акцентные светильники для рабочих зон </li >
                    <li >Используйте тепловую карту для поиска "тёмных углов" перед финальным расчётом </li >
                    <li >Для точного размещения комнат используйте инструмент «Комната» — клик автоматически привяжет угол к сетке </li >
                    <li >Зажмите <code >Shift</code > и тяните мышь для перемещения по плану без риска сдвинуть объект </li >
                    <li >Регулярно экспортируйте проект, чтобы не потерять прогресс при очистке кэша браузера </li >
                  </ul >
                </div >
              </div >
            </div >
          </section >

          <div style={{ marginTop: '48px', textAlign: 'center' }} >
            <Link to="/lighting-calculator" className={styles.backButton} >
              ← Вернуться к калькулятору
            </Link >
          </div >
        </main >
      </div >
    </div >
  );
};

export default Guide;