import MainSidebar from './MainSidebar';
import PageTransition from './PageTransition';
import styles from './MainSidebar.module.css';

const MainLayout = ({ children, isCollapsed, setIsCollapsed }) => (
  <>
    <MainSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
    <PageTransition collapseKey={isCollapsed ? 'collapsed' : 'expanded'}>
      <div className={`${styles.mainContent} ${isCollapsed ? styles.mainContentCollapsed : ''}`}>
        {children}
      </div>
    </PageTransition>
  </>
);

export default MainLayout;