export default function Button({ children, variant = 'primary', size = 'md', loading, disabled, ...props }) {
  return (
    <button
      className={`ui-btn ui-btn-${variant} ui-btn-${size}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <span className="spinner spinner-sm" /> : children}
    </button>
  );
}
