import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ComparisonProvider } from './context/ComparisonContext';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from './components/ProtectedRoute';
import LampRope from './components/LampRope';
import ThemeColorPicker from './components/ThemeColorPicker';
import ThemeTransition from './components/ThemeTransition';
import MainLayout from './components/MainLayout';
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
        <LampRope />
        <ThemeTransition />
        <ThemeColorPicker />

        <Routes>
          <Route path="/auth" element={<Auth />} />

          {/* Публичные страницы */}
          <Route path="/" element={
            <MainLayout isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed}>
              <Home />
            </MainLayout>
          } />
          <Route path="/catalog" element={
            <MainLayout isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed}>
              <Catalog />
            </MainLayout>
          } />
          <Route path="/contacts" element={
            <MainLayout isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed}>
              <Contacts />
            </MainLayout>
          } />
          <Route path="/calculator" element={
            <MainLayout isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed}>
              <LightingCalculator />
            </MainLayout>
          } />
          <Route path="/comparison" element={
            <MainLayout isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed}>
              <Comparison />
            </MainLayout>
          } />
          <Route path="/product/:id" element={
            <MainLayout isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed}>
              <Product isSidebarCollapsed={isCollapsed} />
            </MainLayout>
          } />
          <Route path="/profile" element={
            <MainLayout isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed}>
              <Profile />
            </MainLayout>
          } />
          <Route path="/guide" element={
            <MainLayout isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed}>
              <Guide />
            </MainLayout>
          } />
          <Route path="/equipment-guide" element={
            <MainLayout isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed}>
              <EquipmentGuide />
            </MainLayout>
          } />

          {/* Защищённые страницы */}
          <Route path="/requests" element={
            <ProtectedRoute>
              <MainLayout isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed}>
                <Requests />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute>
              <MainLayout isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed}>
                <Admin />
              </MainLayout>
            </ProtectedRoute>
          } />

          <Route path="*" element={
            <MainLayout isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed}>
              <NotFound />
            </MainLayout>
          } />
        </Routes>
      </ComparisonProvider>
    </Router>
  );
}

export default App;