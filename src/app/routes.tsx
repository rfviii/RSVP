import { createBrowserRouter } from 'react-router-dom';
import { HomePage } from '@/pages/HomePage';
import { ReaderRoute } from '@/pages/ReaderRoute';
import { SettingsPage } from '@/pages/SettingsPage';

export const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/reader/:documentId', element: <ReaderRoute /> },
  { path: '/settings', element: <SettingsPage /> },
]);
