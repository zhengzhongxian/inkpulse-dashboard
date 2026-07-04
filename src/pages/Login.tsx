import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDashboard } from '../context/DashboardContext';
import { toast } from '../utils/toast';

export const Login: React.FC = () => {
  const { login } = useDashboard();
  const navigate = useNavigate();

  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim() || !passwordInput.trim()) {
      toast.warning('Cảnh báo', 'Vui lòng điền tên đăng nhập và mật khẩu.');
      return;
    }

    setLoading(true);

    try {
      const res = await login(usernameInput.trim(), passwordInput.trim());
      if (res.success) {
        toast.success('Đăng nhập thành công', 'Chào mừng bạn trở lại hệ thống quản trị.');
        navigate('/');
      } else {
        toast.error('Đăng nhập thất bại', res.error || 'Tài khoản hoặc mật khẩu không chính xác.');
      }
    } catch (err) {
      toast.error('Lỗi kết nối', 'Có lỗi xảy ra khi kết nối máy chủ xác thực.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="login-wrapper">
      <div className="login-card">
        <Link to="/" className="login-back-btn" style={{ textDecoration: 'none' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          <span>Quay lại trang chủ</span>
        </Link>

        <div>
          <div className="login-logo-container" style={{ display: 'flex', justifyContent: 'center' }}>
            <img 
              src="/344cdadf-ff0f-46da-b1f2-50c8fe2548b4.png" 
              alt="Chào mừng" 
              className="logo-img" 
              style={{ height: '180px', marginTop: '-55px', marginBottom: '-30px', objectFit: 'contain' }} 
            />
          </div>

          <form onSubmit={handleFormSubmit}>
            <div className="form-group">
              <label className="form-label">Tài khoản</label>
              <input
                type="text"
                className="form-input"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Nhập tên đăng nhập hoặc địa chỉ email..."
                autoComplete="username"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mật khẩu</label>
              <div className="input-container">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Nhập mật khẩu bảo mật..."
                  autoComplete="current-password"
                  required
                  style={{ paddingRight: '56px' }}
                />
                <span
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </span>
              </div>
            </div>

            <div className="form-actions">
              <label className="remember-me">
                <input type="checkbox" />
                <span>Ghi nhớ thiết bị</span>
              </label>
            </div>

            <button
              type="submit"
              className="btn-primary btn-submit"
              disabled={loading}
            >
              {loading ? <span className="btn-spinner"></span> : 'Đăng Nhập'}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        .login-wrapper {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          background-color: var(--bg-primary);

          /* Local variables to match Inkpulse-fe exactly */
          --primary: #F66398;
          --primary-hover: #DA447D;
          --radius-sm: 8px;
          --transition: all 0.2s ease;
        }

        .login-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--text-muted);
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 24px;
          cursor: pointer;
          transition: var(--transition);
        }

        .login-back-btn:hover {
          color: var(--primary);
        }

        .login-card {
          background-color: transparent;
          border-radius: 0;
          box-shadow: none;
          width: 100%;
          max-width: 480px;
          padding: 0;
          border: none;
          text-align: left;
        }

        .form-group {
          margin-bottom: 24px;
          position: relative;
        }

        .form-label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 8px;
          color: var(--text-main);
        }

        .input-container {
          position: relative;
        }

        .form-input {
          width: 100%;
          padding: 12px 14px;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          font-family: var(--font);
          font-size: 14.5px;
          color: var(--text-main);
          outline: none;
          transition: var(--transition);
          background-color: var(--bg-secondary);
        }

        .form-input::placeholder {
          color: var(--text-light);
        }

        .form-input:focus {
          border-color: var(--primary);
          box-shadow: none;
        }

        .password-toggle {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: var(--transition);
        }

        .password-toggle:hover {
          color: var(--primary);
        }

        .form-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
          font-size: 14px;
        }

        .remember-me {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          color: var(--text-muted);
        }

        .remember-me input {
          accent-color: var(--primary);
          width: 16px;
          height: 16px;
        }

        .btn-primary {
          background-color: var(--primary);
          color: #FFFFFF;
          border: none;
          cursor: pointer;
          transition: var(--transition);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .btn-primary:hover:not(:disabled) {
          background-color: var(--primary-hover);
        }

        .btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .btn-submit {
          width: 100%;
          padding: 13px;
          font-size: 15px;
          font-weight: 700;
          border-radius: var(--radius-sm);
          letter-spacing: 0.1px;
        }

        .login-error-alert {
          background-color: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: var(--accent-red);
          border-radius: var(--radius-sm);
          padding: 11px 14px;
          font-size: 13.5px;
          font-weight: 500;
          margin-bottom: 20px;
          line-height: 1.5;
          text-align: center;
        }

        .btn-spinner {
          display: inline-block;
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #FFFFFF;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          vertical-align: middle;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </section>
  );
};

export default Login;
