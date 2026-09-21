import { RouterProvider } from 'react-router-dom';
import { router } from '@/app/routes';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { useAppliedTheme } from '@/hooks/settings/useAppliedTheme';

export function App() {
  useAppliedTheme();
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
}
