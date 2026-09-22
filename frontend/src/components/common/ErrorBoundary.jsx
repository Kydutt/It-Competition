import React from 'react';
import Button from '../ui/Button';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled UI Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 bg-gray-50/50">
          <div className="max-w-md w-full bg-white rounded-2xl border border-rose-100 p-8 shadow-sm text-center space-y-4">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto text-2xl font-black shadow-2xs">
              ⚠️
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-950">Terjadi Kendala pada Halaman</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Aplikasi mendeteksi error pada tampilan. Anda dapat memuat ulang halaman ini atau kembali ke menu utama.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-gray-50 rounded-lg text-left text-[11px] font-mono text-gray-600 overflow-x-auto max-h-32 border border-gray-100">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex gap-2 justify-center pt-2">
              <Button variant="secondary" size="sm" onClick={this.handleGoHome}>
                Kembali ke Beranda
              </Button>
              <Button variant="primary" size="sm" onClick={this.handleReload} className="font-bold">
                Muat Ulang Halaman ↻
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
