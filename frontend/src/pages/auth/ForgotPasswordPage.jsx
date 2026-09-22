import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/50 to-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center space-x-2.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-amber-400 flex items-center justify-center text-white font-black text-xl shadow-md">
            H
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-950">
            HIMATIF <span className="text-brand-600">ITC</span>
          </span>
        </Link>
        <h2 className="text-2xl font-black text-gray-950 tracking-tight">
          Pemulihan Kata Sandi
        </h2>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">
          Masukkan email akun Anda untuk menerima tautan reset kata sandi
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl border border-gray-200 shadow-sm space-y-6">
          {submitted ? (
            <div className="space-y-4 text-center">
              <Alert variant="success">
                Tautan reset kata sandi telah dikirim ke <strong>{email}</strong> jika akun terdaftar.
              </Alert>
              <Link to="/login" className="block text-sm font-semibold text-brand-600 hover:underline">
                &larr; Kembali ke halaman login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Alamat Email Akun"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
              />

              <Button type="submit" variant="primary" className="w-full font-bold py-2.5">
                Kirim Tautan Reset
              </Button>

              <div className="text-center pt-2">
                <Link to="/login" className="text-xs font-semibold text-gray-600 hover:text-brand-600">
                  Batal & kembali ke Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
