import React from 'react';
import './EmptyState.css';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  variant?: 'default' | 'compact';
  className?: string;
  style?: React.CSSProperties;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = 'default',
  className = '',
  style,
}: EmptyStateProps) {
  return (
    <div className={`empty-state empty-state--${variant} ${className}`} style={style}>
      {icon && <div className="empty-state__icon">{icon}</div>}
      <h3 className="empty-state__title">{title}</h3>
      {description && <p className="empty-state__description">{description}</p>}
      {action && (
        <button
          type="button"
          className="empty-state__action-btn"
          onClick={action.onClick}
        >
          {action.icon && <span className="empty-state__action-icon">{action.icon}</span>}
          <span>{action.label}</span>
        </button>
      )}
    </div>
  );
}

export default EmptyState;
