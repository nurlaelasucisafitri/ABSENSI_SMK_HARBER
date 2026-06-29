const COLOR_MAP = {
  warning: { bg: 'linear-gradient(60deg, #ffa726, #fb8c00)', shadow: 'rgba(255, 152, 0, 0.4)' },
  success: { bg: 'linear-gradient(60deg, #66bb6a, #43a047)', shadow: 'rgba(76, 175, 80, 0.4)' },
  danger: { bg: 'linear-gradient(60deg, #ef5350, #e53935)', shadow: 'rgba(244, 67, 54, 0.4)' },
  info: { bg: 'linear-gradient(60deg, #26c6da, #00acc1)', shadow: 'rgba(0, 188, 212, 0.4)' },
  primary: { bg: 'linear-gradient(60deg, #ab47bc, #8e24aa)', shadow: 'rgba(156, 39, 176, 0.4)' },
  rose: { bg: 'linear-gradient(60deg, #ec407a, #d81b60)', shadow: 'rgba(233, 30, 99, 0.4)' },
};

export default function StatCard({ icon, label, value, color = 'info', footer }) {
  const c = COLOR_MAP[color] || COLOR_MAP.info;
  return (
    <div className="stat-card">
      <div className="stat-card-icon" style={{ background: c.bg, boxShadow: `0 4px 20px 0 rgba(0,0,0,0.14), 0 7px 10px -5px ${c.shadow}` }}>
        {icon}
      </div>
      <div className="stat-card-body">
        <p className="stat-card-label">{label}</p>
        <h3 className="stat-card-value">{value}</h3>
      </div>
      {footer && <div className="stat-card-footer">{footer}</div>}
    </div>
  );
}
