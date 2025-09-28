import { Alert, AlertDescription, AlertTitle } from './alert';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';

export function ErrorBanner({ message }: { message: string }) {
  if (!message) return null;

  return (
    <Alert variant="destructive" className="mb-4">
      <ExclamationTriangleIcon className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
