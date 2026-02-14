import { ReactNode } from 'react';
import { Info, AlertTriangle, CheckCircle, XCircle, X } from 'lucide-react';

interface AlertProps {
  type: 'info' | 'warning' | 'success' | 'error';
  title?: string;
  message: string | ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export function Alert({ type, title, message, dismissible, onDismiss }: AlertProps) {
  const types = {
    info: {
      bg: 'bg-brand-blue-50',
      border: 'border-brand-blue-200',
      text: 'text-brand-blue-900',
      icon: Info,
      iconColor: 'text-brand-blue-600',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-900',
      icon: AlertTriangle,
      iconColor: 'text-yellow-600',
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-900',
      icon: CheckCircle,
      iconColor: 'text-green-600',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-900',
      icon: XCircle,
      iconColor: 'text-red-600',
    },
  };

  const config = types[type];
  const Icon = config.icon;

  return (
    <div className={`rounded-lg border-l-4 p-4 ${config.bg} ${config.border}`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.iconColor}`} />
        <div className="flex-1">
          {title && (
            <h3 className={`font-semibold mb-1 ${config.text}`}>{title}</h3>
          )}
          <div className={`text-sm ${config.text}`}>{message}</div>
        </div>
        {dismissible && onDismiss && (
          <button
            onClick={onDismiss}
            className={`flex-shrink-0 ${config.iconColor} hover:opacity-70`}
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
