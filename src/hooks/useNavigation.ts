import { useLocation } from 'react-router-dom';

export const useNavigation = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const isHomePage = currentPath === '/';
  const isProductPage = [
    '/ai_trading',
    '/predictive-analytics', 
    '/portfolio-optimization',
    '/risk-management'
  ].includes(currentPath);

  return {
    isHomePage,
    isProductPage,
    currentPath
  };
};