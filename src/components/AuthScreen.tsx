import React, { useState } from 'react';
import { Sparkles, Mail, Lock, User, LogIn, UserPlus, AlertCircle, ShieldCheck, Phone } from 'lucide-react';
import { loginWithCredentials, registerNewUser, AuthUser } from '../services/storageService';

interface AuthScreenProps {
  onAuthSuccess: (user: AuthUser) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  // 1. Default to 'register' mode so new users start with registration immediately
  const [mode, setMode] = useState<'login' | 'register'>('register');
  
  // Login state (supports email or phone number)
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register state (supports full name, email or phone number, password)
  const [regName, setRegName] = useState('');
  const [regIdentifier, setRegIdentifier] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier.trim()) {
      setErrorMsg('يرجى إدخال البريد الإلكتروني أو رقم الهاتف');
      return;
    }
    setErrorMsg(null);
    setLoading(true);

    const result = await loginWithCredentials(loginIdentifier.trim(), loginPassword);
    setLoading(false);

    if (result.success && result.user) {
      onAuthSuccess(result.user);
    } else {
      setErrorMsg(result.error || 'بيانات الدخول غير صحيحة');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim()) {
      setErrorMsg('يرجى إدخال الاسم');
      return;
    }
    if (!regIdentifier.trim()) {
      setErrorMsg('يرجى إدخال البريد الإلكتروني أو رقم الهاتف');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMsg('يجب ألا تقل كلمة المرور عن 6 أحرف أو أرقام');
      return;
    }

    setErrorMsg(null);
    setLoading(true);

    const result = await registerNewUser(regName.trim(), regIdentifier.trim(), regPassword);
    setLoading(false);

    if (result.success && result.user) {
      onAuthSuccess(result.user);
    } else {
      setErrorMsg(result.error || 'فشل في إنشاء الحساب');
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#120424] via-[#1a0734] to-[#250a48] flex items-center justify-center p-4 font-cairo text-purple-50" dir="rtl">
      <div className="w-full max-w-md bg-[#1d0a36] border border-purple-700/60 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-purple-950/80 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* App Logo & Title */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white mx-auto shadow-lg shadow-purple-900/50">
            <Sparkles className="w-7 h-7 text-purple-100" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">خليكي جميلة</h1>
          <p className="text-xs text-purple-300 font-medium">
            منصة تعليم وصناعة مستحضرات التجميل والعناية الاحترافية
          </p>
        </div>

        {/* Auth Mode Toggle Tabs */}
        <div className="flex bg-[#140626] p-1 rounded-2xl border border-purple-800/50">
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'register'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-900/60'
                : 'text-purple-300 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>إنشاء حساب جديد</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'login'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-900/60'
                : 'text-purple-300 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>تسجيل الدخول</span>
          </button>
        </div>

        {/* Error Message Display */}
        {errorMsg && (
          <div className="flex items-center gap-2 text-xs text-rose-300 font-bold bg-rose-950/50 p-3 rounded-xl border border-rose-800/50 animate-shake text-right">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Register Form (Default mode) */}
        {mode === 'register' ? (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div className="space-y-1.5 text-right">
              <label className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-purple-400" />
                <span>الاسم</span>
              </label>
              <input
                type="text"
                required
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="أحمد محمد"
                className="w-full bg-[#140626] border border-purple-700/60 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-purple-400/40 focus:outline-none focus:border-purple-400 font-medium"
              />
            </div>

            <div className="space-y-1.5 text-right">
              <label className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
                <div className="flex items-center gap-1 text-purple-400">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="text-[10px]">/</span>
                  <Phone className="w-3 h-3" />
                </div>
                <span>البريد الإلكتروني أو رقم الهاتف</span>
              </label>
              <input
                type="text"
                required
                value={regIdentifier}
                onChange={(e) => setRegIdentifier(e.target.value)}
                placeholder="name@example.com أو 01xxxxxxxxx"
                className="w-full bg-[#140626] border border-purple-700/60 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-purple-400/40 focus:outline-none focus:border-purple-400 font-medium text-left font-mono"
              />
            </div>

            <div className="space-y-1.5 text-right">
              <label className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-purple-400" />
                <span>كلمة المرور</span>
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="6 خانات على الأقل"
                className="w-full bg-[#140626] border border-purple-700/60 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-purple-400/40 focus:outline-none focus:border-purple-400 font-medium text-left font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 active:scale-[0.98] text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-purple-900/50"
            >
              {loading ? (
                <span className="text-xs">جاري إنشاء الحساب...</span>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>إنشاء حساب جديد</span>
                </>
              )}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                }}
                className="text-xs text-purple-300 hover:text-white font-medium transition-colors cursor-pointer hover:underline"
              >
                لديك حساب بالفعل؟ اضغط هنا لتسجيل الدخول
              </button>
            </div>
          </form>
        ) : (
          /* Login Form */
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1.5 text-right">
              <label className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
                <div className="flex items-center gap-1 text-purple-400">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="text-[10px]">/</span>
                  <Phone className="w-3 h-3" />
                </div>
                <span>البريد الإلكتروني أو رقم الهاتف</span>
              </label>
              <input
                type="text"
                required
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                placeholder="name@example.com أو 01xxxxxxxxx"
                className="w-full bg-[#140626] border border-purple-700/60 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-purple-400/40 focus:outline-none focus:border-purple-400 font-medium text-left font-mono"
              />
            </div>

            <div className="space-y-1.5 text-right">
              <label className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-purple-400" />
                <span>كلمة المرور</span>
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#140626] border border-purple-700/60 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-purple-400/40 focus:outline-none focus:border-purple-400 font-medium text-left font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 active:scale-[0.98] text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-purple-900/50"
            >
              {loading ? (
                <span className="text-xs">جاري تسجيل الدخول...</span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>تسجيل الدخول</span>
                </>
              )}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMsg(null);
                }}
                className="text-xs text-purple-300 hover:text-white font-medium transition-colors cursor-pointer hover:underline"
              >
                ليس لديك حساب؟ اضغط هنا لإنشاء حساب جديد
              </button>
            </div>
          </form>
        )}

        {/* Security badge footer */}
        <div className="pt-2 border-t border-purple-800/40 flex items-center justify-center gap-2 text-[11px] text-purple-400/80 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
          <span>المصادقة سحابية مؤمنة عبر MongoDB Atlas و JWT</span>
        </div>
      </div>
    </div>
  );
};
