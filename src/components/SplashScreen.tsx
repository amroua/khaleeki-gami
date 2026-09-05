import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, ArrowLeft, ChevronLeft, Heart, Flower2 } from 'lucide-react';
import beautyWelcomeHero from '../assets/images/beauty_welcome_hero_1788547489675.jpg';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [progress] = useState(100);

  const featurePills = [
    { label: 'عناية', emoji: '✨' },
    { label: 'جمال', emoji: '💖' },
    { label: 'شعر', emoji: '💆‍♀️' },
    { label: 'بشرة', emoji: '🌸' },
    { label: 'مستحضرات', emoji: '💄' }
  ];

  return (
    <div
      id="splash-screen-container"
      className="relative min-h-screen w-full bg-gradient-to-b from-[#18052e] via-[#240a3d] to-[#120324] text-white flex flex-col justify-between items-center px-5 py-6 select-none overflow-hidden font-cairo"
      dir="rtl"
    >
      {/* Soft Ambient Background Lighting (Dark Mode) */}
      <div className="absolute -top-28 -right-28 w-80 h-80 bg-pink-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-28 -left-28 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md flex justify-between items-center pt-2 z-10"
      >
        <div className="splash-top-badge inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-pink-950/60 backdrop-blur-md border border-pink-700/50 text-xs text-pink-200 font-bold shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-pink-400" />
          <span>منصة الجمال والعناية المتكاملة</span>
        </div>

        <button
          id="splash-skip-button"
          onClick={onFinish}
          className="text-xs text-pink-200 hover:text-white px-3 py-1.5 rounded-full hover:bg-pink-800/40 transition-colors flex items-center gap-1 font-bold cursor-pointer"
        >
          <span>تخطي</span>
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      </motion.div>

      {/* Main Content Area */}
      <div className="flex flex-col items-center text-center max-w-sm my-auto z-10 px-2 py-4">
        {/* Elegant Hero Portrait */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 18, stiffness: 90, delay: 0.1 }}
          className="relative mb-6"
        >
          {/* Subtle glowing halo ring */}
          <div className="absolute -inset-2 bg-gradient-to-tr from-pink-500/40 via-purple-500/30 to-rose-400/40 rounded-full blur-md" />
          
          <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full p-1 bg-gradient-to-tr from-pink-400 via-rose-300 to-purple-400 shadow-2xl shadow-pink-950/60">
            <img
              src={beautyWelcomeHero}
              alt="خليكي جميلة"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover rounded-full select-none"
            />
          </div>

          {/* Floating Aesthetic Badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.35, type: 'spring', stiffness: 140 }}
            className="absolute -bottom-1 -right-1 bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 text-white p-2 rounded-full border-2 border-[#18052e] shadow-lg flex items-center justify-center"
          >
            <Flower2 className="w-4 h-4 text-pink-100" />
          </motion.div>
        </motion.div>

        {/* Main App Title */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.25 }}
          className="splash-title text-4xl sm:text-5xl font-black tracking-tight text-white mb-2 drop-shadow-md flex items-center justify-center gap-2"
        >
          <span>خليكي جميلة</span>
          <span className="text-pink-400 text-3xl sm:text-4xl">✨</span>
        </motion.h1>

        {/* Marketing Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.35 }}
          className="splash-subtitle text-pink-200 text-sm sm:text-base font-bold mb-4 leading-relaxed"
        >
          كل اللي يخص جمالك وعنايتك في مكان واحد
        </motion.p>

        {/* Categorical Feature Pills */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.45 }}
          className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 max-w-xs"
        >
          {featurePills.map((pill, idx) => (
            <span
              key={idx}
              className="splash-pill inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-purple-950/70 border border-pink-700/50 text-pink-100 shadow-sm transition-transform hover:scale-105"
            >
              <span>{pill.emoji}</span>
              <span>{pill.label}</span>
            </span>
          ))}
        </motion.div>
      </div>

      {/* Bottom Action Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.55 }}
        className="w-full max-w-sm flex flex-col items-center gap-3 pb-4 sm:pb-6 z-10"
      >
        {/* Subtle Progress Bar */}
        <div className="splash-progress-track w-full bg-purple-950/80 h-1.5 rounded-full overflow-hidden border border-purple-800/40">
          <div
            className="h-full bg-gradient-to-r from-pink-500 via-rose-400 to-purple-500 transition-all duration-150 ease-out shadow-sm"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Primary CTA Button */}
        <button
          id="splash-enter-main-app"
          onClick={onFinish}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 active:scale-[0.98] text-white font-black text-base sm:text-lg flex items-center justify-center gap-2.5 shadow-xl shadow-pink-950/60 border border-pink-400/40 transition-all cursor-pointer"
        >
          <span>ابدئي الآن ✨</span>
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>

        <div className="flex items-center gap-1.5 text-xs text-pink-300 font-semibold mt-0.5">
          <Heart className="w-3.5 h-3.5 text-pink-400 fill-pink-400/30" />
          <span>رحلتك نحو التألق والجمال تبدأ هنا</span>
        </div>
      </motion.div>
    </div>
  );
};
