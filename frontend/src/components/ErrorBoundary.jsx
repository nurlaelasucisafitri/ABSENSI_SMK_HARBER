import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Error tertangkap oleh ErrorBoundary:', error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="fullpage-loader" style={{ flexDirection: 'column', gap: 14 }}>
          <h3>Terjadi kesalahan pada halaman ini</h3>
          <p className="text-muted">Silakan muat ulang halaman. Kalau masalah berlanjut, hubungi developer.</p>
          <button className="ui-btn ui-btn-primary ui-btn-md" onClick={this.handleReload}>Muat Ulang</button>
        </div>
      );
    }
    return this.props.children;
  }
}
