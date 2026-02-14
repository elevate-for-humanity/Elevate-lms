import { CheckCircle2, Clock, AlertCircle, XCircle } from 'lucide-react';

type MOUStatusBadgeProps = {
  status: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
};

export function MOUStatusBadge({
  status,
  showIcon = true,
  size = 'md',
}: MOUStatusBadgeProps) {
  const configs: Record<
    string,
    {
      label: string;
      color: string;
      icon: any;
      bgColor: string;
    }
  > = {
    not_sent: {
      label: 'Not Sent',
      color: 'text-black',
      bgColor: 'bg-gray-100',
      icon: XCircle,
    },
    pending: {
      label: 'Pending',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-100',
      icon: Clock,
    },
    sent: {
      label: 'Sent',
      color: 'text-brand-blue-700',
      bgColor: 'bg-brand-blue-100',
      icon: Clock,
    },
    signed_by_holder: {
      label: 'Awaiting Countersignature',
      color: 'text-orange-700',
      bgColor: 'bg-orange-100',
      icon: Clock,
    },
    fully_executed: {
      label: 'Fully Executed',
      color: 'text-green-700',
      bgColor: 'bg-green-100',
      icon: CheckCircle2,
    },
  };

  const config = configs[status] || {
    label: 'Unknown',
    color: 'text-black',
    bgColor: 'bg-gray-100',
    icon: AlertCircle,
  };

  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-2.5',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${config.bgColor} ${config.color} ${sizeClasses[size]}`}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {config.label}
    </span>
  );
}

export function MOUStatusAlert({
  status,
  programHolderName,
}: {
  status: string;
  programHolderName?: string;
}) {
  if (status === 'fully_executed') {
    return (
      <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium text-green-900">MOU Fully Executed</p>
          <p className="text-sm text-green-700 mt-1">
            Your MOU is fully signed and you can now enroll participants and
            receive revenue share payments.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'signed_by_holder') {
    return (
      <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
        <Clock className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium text-orange-900">
            MOU Awaiting Countersignature
          </p>
          <p className="text-sm text-orange-700 mt-1">
            You've signed the MOU. An Elevate representative will countersign
            and provide the fully executed copy.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'pending' || status === 'sent') {
    return (
      <div className="flex items-start gap-3 p-4 bg-brand-blue-50 border border-brand-blue-200 rounded-lg">
        <AlertCircle className="h-5 w-5 text-brand-orange-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium text-brand-blue-900">Action Required: Sign MOU</p>
          <p className="text-sm text-brand-blue-700 mt-1">
            Please review and sign your MOU to begin training participants and
            receiving revenue share payments.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
      <div>
        <p className="font-medium text-yellow-900">MOU Required</p>
        <p className="text-sm text-yellow-700 mt-1">
          A signed MOU is required before you can enroll participants or receive
          payments.
        </p>
      </div>
    </div>
  );
}
