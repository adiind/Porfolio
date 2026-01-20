
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Utensils, Bike, User, Newspaper, Radio, Layers, Target, Terminal, Database, Palette, Settings, BarChart3, Quote } from 'lucide-react';
import { CaseStudy } from '../types';

interface Props {
  caseStudy: CaseStudy;
  onClose: () => void;
}

const CaseStudyModal: React.FC<Props> = ({ caseStudy, onClose }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = caseStudy.slides || [];
  const theme = caseStudy.themeColor || 'red';

  const nextSlide = () => setCurrentSlide(p => Math.min(p + 1, slides.length - 1));
  const prevSlide = () => setCurrentSlide(p => Math.max(p - 1, 0));

  const getThemeClasses = () => {
    switch (theme) {
      case 'orange': return {
        text: 'text-orange-500',
        bg: 'bg-orange-500',
        lightBg: 'bg-orange-50',
        border: 'border-orange-500',
        button: 'hover:bg-orange-100'
      };
      case 'red':
      default: return {
        text: 'text-red-500',
        bg: 'bg-red-500',
        lightBg: 'bg-red-50',
        border: 'border-red-500',
        button: 'hover:bg-red-100'
      };
    }
  };
  const tc = getThemeClasses();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8 bg-black/90 backdrop-blur-xl"
    >
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-2 bg-white/10 rounded-full hover:bg-white/20 text-white transition-colors z-50"
      >
        <X size={24} />
      </button>

      <div className="relative w-full max-w-6xl aspect-video bg-white text-black rounded-lg shadow-2xl overflow-hidden flex flex-col font-sans">
        {/* Slide Content */}
        <div className="flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 p-8 md:p-12 flex flex-col"
            >
              {renderSlide(slides[currentSlide], tc)}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="h-16 border-t border-gray-100 flex items-center justify-between px-6 bg-gray-50">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            {caseStudy.title} • {currentSlide + 1} / {slides.length}
          </div>
          <div className="flex gap-2">
            <button
              onClick={prevSlide}
              disabled={currentSlide === 0}
              className={`p-2 rounded-full disabled:opacity-30 transition-colors ${tc.button}`}
            >
              <ChevronLeft size={20} className="text-gray-600" />
            </button>
            <button
              onClick={nextSlide}
              disabled={currentSlide === slides.length - 1}
              className={`p-2 rounded-full disabled:opacity-30 transition-colors ${tc.button}`}
            >
              <ChevronRight size={20} className="text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const renderSlide = (slide: any, tc: any) => {
  if (!slide) return null;

  switch (slide.type) {
    case 'cover':
      return (
        <div className="flex flex-col h-full justify-center items-center text-center">
          <div className="mb-6">
            <span className={`${tc.bg} text-white px-3 py-1.5 text-xs font-black uppercase tracking-widest rounded-sm`}>Case Study</span>
          </div>
          <h1 className={`text-4xl md:text-6xl font-black ${tc.text} mb-6 tracking-tight leading-tight max-w-4xl`}>
            {slide.title}
          </h1>
          <h2 className="text-xl md:text-3xl font-light text-gray-800 max-w-3xl mb-6">
            {slide.content.subtitle}
          </h2>
          <div className="w-20 h-1 bg-gray-200 mb-8" />
          <p className="text-gray-500 max-w-2xl text-base md:text-lg leading-relaxed mb-12">
            {slide.content.description}
          </p>
          <div className="mt-auto text-xs font-bold uppercase tracking-widest text-gray-400">
            {slide.content.role}
          </div>
        </div>
      );

    case 'problem-statement':
      return (
        <div className="flex flex-col h-full">
          <div className="flex flex-col md:flex-row gap-12 h-full">
            <div className="flex-1 flex flex-col justify-center">
              <h3 className={`text-4xl font-black ${tc.text} mb-6 uppercase`}>The "Why"</h3>
              <p className="text-xl text-gray-700 leading-relaxed mb-8 border-l-4 border-gray-200 pl-4">
                {slide.content.context}
              </p>
              <div className="space-y-6">
                {slide.content.painPoints.map((pt: any, i: number) => (
                  <div key={i} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <h4 className="font-bold text-gray-800 mb-1 flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${tc.bg}`} /> {pt.title}
                    </h4>
                    <p className="text-sm text-gray-600">{pt.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className={`flex-1 ${tc.lightBg} p-8 rounded-xl flex flex-col justify-center`}>
              <h3 className={`text-3xl font-black ${tc.text} mb-8 uppercase`}>The Challenge</h3>
              <div className="space-y-4">
                {slide.content.challenges.map((ch: string, i: number) => (
                  <div key={i} className="bg-white p-5 rounded-lg shadow-sm">
                    <p className="font-medium text-gray-800 leading-snug">"How might we {ch}?"</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );

    case 'process-role':
      return (
        <div className="flex flex-col h-full">
          <div className="mb-8">
            <h3 className={`text-2xl font-black ${tc.text} uppercase mb-4`}>Goals & Objectives</h3>
            <div className="grid grid-cols-5 gap-4">
              {slide.content.goals.map((g: string, i: number) => (
                <div key={i} className="bg-gray-900 text-white p-4 rounded-lg text-center flex items-center justify-center text-sm font-bold shadow-lg">
                  {g}
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 bg-gray-50 rounded-xl p-8">
            <h3 className={`text-2xl font-black ${tc.text} uppercase mb-6`}>My Role</h3>
            <div className="grid grid-cols-2 gap-8">
              {slide.content.role.map((r: any, i: number) => (
                <div key={i}>
                  <h4 className="font-bold text-lg text-gray-900 mb-2 flex items-center gap-2">
                    {i === 0 && <Target size={18} className={tc.text} />}
                    {i === 1 && <Database size={18} className={tc.text} />}
                    {i === 2 && <Palette size={18} className={tc.text} />}
                    {i === 3 && <Settings size={18} className={tc.text} />}
                    {r.title}
                  </h4>
                  <p className="text-sm text-gray-600 leading-relaxed border-l-2 border-gray-200 pl-3">{r.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case 'system-architecture':
      return (
        <div className="flex flex-col h-full">
          <h3 className={`text-4xl font-black ${tc.text} uppercase mb-8`}>System In Action</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {slide.content.features.map((f: any, i: number) => (
              <div key={i} className="bg-gray-800 text-white p-6 rounded-xl shadow-xl">
                <h4 className={`text-xl font-bold mb-3 ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-blue-400' : 'text-green-400'}`}>
                  {f.title}
                </h4>
                <p className="text-sm text-gray-300 leading-relaxed opacity-90">{f.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-auto bg-gray-100 p-6 rounded-xl flex items-center justify-between">
            <div className="text-gray-500 font-bold uppercase tracking-widest text-sm">Visual Cues</div>
            <div className="flex gap-12">
              {slide.content.visualCues.map((c: any, i: number) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="text-2xl mb-1">{c.name === 'Pacman' ? '🟡' : c.name === 'Mario' ? '🔴' : '🔵'}</div>
                  <div className="font-bold text-gray-800">{c.name}</div>
                  <div className="text-xs text-gray-500 uppercase">{c.context}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case 'outcomes':
      return (
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-end mb-8">
            <h3 className={`text-4xl font-black ${tc.text} uppercase`}>Design Outcomes</h3>
            <div className="text-right">
              <div className="text-xs uppercase tracking-widest text-gray-400">Impact</div>
              <div className="font-bold text-2xl">Hourly Refresh</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            {slide.content.kpis.map((kpi: any, i: number) => (
              <div key={i} className={`${tc.lightBg} border ${tc.border} rounded-lg p-6`}>
                <h4 className="font-black text-xl text-gray-900 mb-2">{kpi.name}</h4>
                <div className="font-mono text-xs bg-white/50 p-2 rounded mb-2 text-gray-600">{kpi.def}</div>
                <p className={`text-sm font-bold ${tc.text}`}>{kpi.purpose}</p>
              </div>
            ))}
          </div>

          <div className="flex-1 bg-gray-900 text-white rounded-xl p-8 flex flex-col justify-center">
            <h4 className="text-lg font-bold mb-6 text-center">Key Features</h4>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              {slide.content.highlights.map((h: string, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${tc.bg}`} />
                  <span className="text-sm opacity-90">{h}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case 'reflection':
      return (
        <div className="flex flex-col h-full justify-center items-center text-center max-w-3xl mx-auto">
          <div className="mb-12">
            <Quote size={48} className={`${tc.text} opacity-20`} />
          </div>
          <div className="space-y-12">
            {slide.content.points.map((p: string, i: number) => (
              <p key={i} className={`text-xl md:text-2xl font-serif text-gray-800 leading-relaxed ${i % 2 !== 0 ? tc.text : ''}`}>
                {p}
              </p>
            ))}
          </div>
          <div className="mt-12 w-20 h-1 bg-gray-200" />
        </div>
      );

    case 'problem': // Fallback/Original Zomato
      return (
        <div className="flex flex-col h-full">
          <div className={`${tc.text} font-black text-2xl uppercase tracking-tighter leading-none mb-8 border-l-4 ${tc.border} pl-3`}>
            Structural <br /> Breakdown
          </div>
          <div className={`${tc.lightBg} p-4 rounded-lg text-center mb-8`}>
            <p className="font-bold text-gray-800 text-lg">Opportunity 🚀</p>
            <p className="text-gray-600">{slide.content.stat}</p>
          </div>
          <div className="grid grid-cols-3 gap-8 flex-1">
            {slide.content.stakeholders.map((s: any, i: number) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-600">
                  {s.icon === 'plate' && <Utensils size={32} />}
                  {s.icon === 'bike' && <Bike size={32} />}
                  {s.icon === 'user' && <User size={32} />}
                </div>
                <h3 className="font-bold text-lg mb-4">{s.name}</h3>
                <ul className="text-sm text-gray-500 space-y-2 text-left list-disc pl-4">
                  {s.points.map((p: string, j: number) => <li key={j}>{p}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      );

    case 'solution':
      return (
        <div className="flex flex-col h-full relative">
          <div className={`${tc.text} font-black text-2xl uppercase tracking-tighter leading-none mb-4 border-l-4 ${tc.border} pl-3`}>
            Final <br /> Solution
          </div>
          <div className="flex-1 relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
              <div className={`w-[500px] h-[500px] border-4 ${tc.border} rounded-full flex items-center justify-center`}>
                <div className="w-[300px] h-[300px] border-4 border-green-500 rounded-full" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-8 w-full z-10">
              {slide.content.steps.map((step: any, i: number) => (
                <div key={i} className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex flex-col">
                  <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case 'impact':
      return (
        <div className="flex flex-col h-full justify-center">
          <div className={`${tc.text} font-black text-4xl uppercase tracking-tighter leading-none mb-12 border-l-8 ${tc.border} pl-6`}>
            Media <br /> Coverage
          </div>
          <div className="space-y-8 max-w-3xl">
            {slide.content.quotes.map((q: any, i: number) => (
              <div key={i} className="border-l-4 border-gray-200 pl-6 py-2">
                <p className="text-xl md:text-2xl font-serif text-gray-800 italic mb-3">"{q.text}"</p>
                <p className="font-bold text-gray-400 uppercase tracking-widest text-xs">— {q.source}</p>
              </div>
            ))}
          </div>
        </div>
      );

    default:
      return null;
  }
};

export default CaseStudyModal;
