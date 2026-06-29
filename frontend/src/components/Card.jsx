export default function Card({ title, headerColor, actions, children, className = '' }) {
  return (
    <div className={`ui-card ${className}`}>
      {(title || actions) && (
        <div className={`ui-card-header ${headerColor ? `ui-card-header-${headerColor}` : ''}`}>
          {title && <h4 className="ui-card-title">{title}</h4>}
          {actions && <div className="ui-card-actions">{actions}</div>}
        </div>
      )}
      <div className="ui-card-body">{children}</div>
    </div>
  );
}
