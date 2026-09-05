import React, { useState } from 'react';
import { Download, Upload, RotateCcw, CheckCircle2, AlertTriangle, ShieldCheck, Lock } from 'lucide-react';
import {
  exportDatabaseJSON,
  importDatabaseJSON,
  resetDatabaseToDefaults,
  getAuthToken
} from '../../services/storageService';

interface AdminSettingsProps {
  onRefreshData: () => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({ onRefreshData }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [importStatus, setImportStatus] = useState<'success' | 'error' | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPasswordError('كلمة المرور يجب أن تتكون من 6 خانات على الأقل');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('كلمتا المرور غير متطابقتين');
      return;
    }

    setPasswordLoading(true);
    setPasswordError('');

    try {
      const token = getAuthToken();
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ newPassword })
      });

      const data = await res.json();
      setPasswordLoading(false);

      if (res.ok) {
        setPasswordSuccess(true);
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccess(false), 3500);
      } else {
        setPasswordError(data.error || 'فشل تحديث كلمة المرور');
      }
    } catch {
      setPasswordLoading(false);
      setPasswordError('تعذر الاتصال بالخادم');
    }
  };

  const handleExport = () => {
    const json = exportDatabaseJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mashrooak-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = importDatabaseJSON(content);
        if (ok) {
          setImportStatus('success');
          onRefreshData();
        } else {
          setImportStatus('error');
        }
        setTimeout(() => setImportStatus(null), 3000);
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    resetDatabaseToDefaults();
    setResetConfirmOpen(false);
    onRefreshData();
  };

  return (
    <div className="space-y-4 text-right max-w-2xl mx-auto" dir="rtl">
      {/* Admin Password Management */}
      <div className="bg-[#210a40] border border-purple-700/60 rounded-3xl p-5 sm:p-6 space-y-4 shadow-lg">
        <div className="flex items-center gap-2.5 border-b border-purple-800/50 pb-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-600/30 border border-purple-500/50 flex items-center justify-center text-purple-300">
            <Lock className="w-5 h-5 text-purple-300" />
          </div>
          <div>
            <h4 className="text-base font-extrabold text-white">تغيير كلمة مرور حساب الأدمن</h4>
            <p className="text-xs text-purple-300">تعيين كلمة مرور جديدة ومخصصة لحساب المشرف الرئيسي</p>
          </div>
        </div>

        {passwordSuccess && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl flex items-center gap-2 text-xs font-bold text-emerald-300 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>تم تغيير كلمة مرور الأدمن بنجاح في قاعدة البيانات!</span>
          </div>
        )}

        {passwordError && (
          <div className="p-3 bg-rose-950/80 border border-rose-500/50 rounded-xl flex items-center gap-2 text-xs font-bold text-rose-300 animate-in fade-in">
            <AlertTriangle className="w-4 h-4" />
            <span>{passwordError}</span>
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-purple-200">كلمة المرور الجديدة</label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="6 أحرف أو أرقام على الأقل"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-[#180730] border border-purple-700/60 rounded-xl px-3 py-2 text-xs text-white placeholder-purple-400/40 focus:outline-none focus:border-purple-400 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-purple-200">تأكيد كلمة المرور</label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="أعد إدخال كلمة المرور"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[#180730] border border-purple-700/60 rounded-xl px-3 py-2 text-xs text-white placeholder-purple-400/40 focus:outline-none focus:border-purple-400 font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={passwordLoading}
            className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 active:scale-[0.99] text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
          >
            {passwordLoading ? 'جاري الحفظ في الخادم...' : 'تحديث وحفظ كلمة المرور'}
          </button>
        </form>
      </div>

      {/* Database Backup & Export/Import */}
      <div className="bg-[#210a40] border border-purple-700/60 rounded-3xl p-5 sm:p-6 space-y-4 shadow-lg">
        <div className="flex items-center gap-2.5 border-b border-purple-800/50 pb-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-600/30 border border-purple-500/50 flex items-center justify-center text-purple-300">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-extrabold text-white">النسخ الاحتياطي واستعادة البيانات</h4>
            <p className="text-xs text-purple-300">تصدير واستيراد كافة الفيديوهات والتركيبات والأسعار بصيغة JSON</p>
          </div>
        </div>

        {importStatus === 'success' && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl flex items-center gap-2 text-xs font-bold text-emerald-300 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>تم استيراد قاعدة البيانات بنجاح وتحديث كافة الأقسام!</span>
          </div>
        )}

        {importStatus === 'error' && (
          <div className="p-3 bg-rose-950/80 border border-rose-500/50 rounded-xl flex items-center gap-2 text-xs font-bold text-rose-300 animate-in fade-in">
            <AlertTriangle className="w-4 h-4" />
            <span>فشل استيراد الملف، تأكد من صحة ملف JSON.</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            onClick={handleExport}
            className="p-3.5 bg-purple-900/60 hover:bg-purple-800/80 border border-purple-700/60 rounded-2xl text-xs font-extrabold text-white flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-purple-300" />
            <span>تصدير نسخة احتياطية (JSON)</span>
          </button>

          <label className="p-3.5 bg-purple-900/60 hover:bg-purple-800/80 border border-purple-700/60 rounded-2xl text-xs font-extrabold text-white flex items-center justify-center gap-2 transition-all cursor-pointer">
            <Upload className="w-4 h-4 text-purple-300" />
            <span>استيراد نسخة احتياطية</span>
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>
      </div>

      {/* Reset System */}
      <div className="bg-[#210a40] border border-purple-700/60 rounded-3xl p-5 sm:p-6 space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-extrabold text-white">استعادة البيانات المبدئية</h4>
            <p className="text-xs text-purple-300">إعادة تعيين الأقسام والمنتجات المبدئية للعناية والجمال</p>
          </div>

          <button
            onClick={() => setResetConfirmOpen(true)}
            className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-700/50 text-rose-200 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>إعادة ضبط</span>
          </button>
        </div>

        {resetConfirmOpen && (
          <div className="p-3 bg-rose-950/90 border border-rose-500/50 rounded-2xl space-y-2 mt-2">
            <p className="text-xs text-rose-200 font-bold">
              هل أنت متأكد؟ سيتم استبدال البيانات الحالية بالبيانات الافتراضية.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-extrabold"
              >
                تأكيد الاستعادة
              </button>
              <button
                onClick={() => setResetConfirmOpen(false)}
                className="px-3 py-1 bg-purple-900 text-purple-200 rounded-lg text-xs"
              >
                إلغاء
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
