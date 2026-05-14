import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ComparisonProvider } from './context/ComparisonContext';
import MainSidebar from './components/MainSidebar';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from './components/ProtectedRoute';
import LampRope from './components/LampRope';
import ThemeColorPicker from './components/ThemeColorPicker';
import ThemeTransition from './components/ThemeTransition';
import styles from './components/MainSidebar.module.css';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import Contacts from './pages/Contacts';
import Auth from './pages/Auth';
import Requests from './pages/Requests';
import Admin from './pages/Admin';
import Product from './pages/Product';
import Profile from './pages/Profile';
import LightingCalculator from './pages/LightingCalculator';
import Guide from './pages/Guide';
import Comparison from './pages/Comparison';
import NotFound from './pages/NotFound';
import EquipmentGuide from './pages/EquipmentGuide';
function App() {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', isCollapsed);
  }, [isCollapsed]);

  return (
    <Router>
      <ScrollToTop />
      <ComparisonProvider>
        {/* Физическая верёвочка с лампочкой */}
        <LampRope />

        {/* Анимация смены темы расширяющимся кругом */}
        <ThemeTransition />

        {/* Временная панель выбора цвета темы */}
        <ThemeColorPicker />

        <Routes>
        <Route path="/auth" element={<Auth />} />

        {/* Публичные страницы - доступны без авторизации */}
         <Route path="/" element={
           <>
             <MainSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
             <div className={`${styles.mainContent} ${isCollapsed ? styles.mainContentCollapsed : ''}`}>
               <Home />
             </div>
           </>
         } />
         <Route path="/catalog" element={
           <>
             <MainSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
             <div className={`${styles.mainContent} ${isCollapsed ? styles.mainContentCollapsed : ''}`}>
               <Catalog />
             </div>
           </>
         } />
          <Route path="/contacts" element={
            <>
              <MainSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
              <div className={`${styles.mainContent} ${isCollapsed ? styles.mainContentCollapsed : ''}`}>
                <Contacts />
              </div>
            </>
          } />
           <Route path="/calculator" element={
             <>
               <MainSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
               <div className={`${styles.mainContent} ${isCollapsed ? styles.mainContentCollapsed : ''}`}>
                 <LightingCalculator />
               </div>
             </>
           } />
            <Route path="/comparison" element={
             <>
               <MainSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
               <div className={`${styles.mainContent} ${isCollapsed ? styles.mainContentCollapsed : ''}`}>
                 <Comparison />
               </div>
             </>
           } />
           <Route path="/product/:id" element={
             <>
               <MainSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
               <div className={`${styles.mainContent} ${isCollapsed ? styles.mainContentCollapsed : ''}`}>
                 <Product isSidebarCollapsed={isCollapsed} />
               </div>
             </>
           } />

           <Route path="/profile" element={
             <>
               <MainSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
               <div className={`${styles.mainContent} ${isCollapsed ? styles.mainContentCollapsed : ''}`}>
                 <Profile />
               </div>
             </>
           } />

           <Route path="/guide" element={
             <>
               <MainSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
               <div className={`${styles.mainContent} ${isCollapsed ? styles.mainContentCollapsed : ''}`}>
                 <Guide />
               </div>
             </>
           } />
     <Route path="/equipment-guide" element={
             <>
               <MainSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
               <div className={`${styles.mainContent} ${isCollapsed ? styles.mainContentCollapsed : ''}`}>
                 <EquipmentGuide />
               </div>
             </>
           } />
         {/* Защищённые страницы - только для авторизованных */}
         <Route path="/requests" element={
           <ProtectedRoute>
             <MainSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
             <div className={`${styles.mainContent} ${isCollapsed ? styles.mainContentCollapsed : ''}`}>
               <Requests />
             </div>
           </ProtectedRoute>
         } />
              <Route path="/admin" element={
                <ProtectedRoute>
                  <MainSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
                  <div className={`${styles.mainContent} ${isCollapsed ? styles.mainContentCollapsed : ''}`}>
                    <Admin />
                  </div>
                </ProtectedRoute>
              } />
          <Route path="*" element={
            <>
              <MainSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
              <div className={`${styles.mainContent} ${isCollapsed ? styles.mainContentCollapsed : ''}`}>
                <NotFound />
              </div>
            </>
          } />
        </Routes>
      </ComparisonProvider>
    </Router>
  );
}

export default App;