import React, { useState } from 'react';
import { QuizQuestion } from '../types/polymer';
import { Brain, HelpCircle, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';

interface DynamicQuizProps {
  questions: QuizQuestion[];
  polymerCode: string;
}

export const DynamicQuiz: React.FC<DynamicQuizProps> = ({ questions, polymerCode }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  const currentQ = questions[currentIndex] || questions[0];

  const handleSelect = (idx: number) => {
    if (selectedOpt !== null) return;
    setSelectedOpt(idx);
    if (idx === currentQ.correct) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    setSelectedOpt(null);
    setCurrentIndex((prev) => (prev + 1) % questions.length);
  };

  if (!currentQ) return null;

  const optionLabels = ['الف', 'ب', 'ج', 'د'];

  return (
    <div className="bg-bg-surface border border-border-subtle rounded-lg p-5 my-6 shadow-xs">
      {/* Header & Score Progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h3 className="text-lg font-black flex items-center gap-2 text-text-primary">
          <Brain className="w-5 h-5 text-status-warning" />
          <span>آزمون خودارزیابی تخصصی {polymerCode}</span>
        </h3>
        <div className="flex items-center gap-2 self-start sm:self-auto font-mono tabular-nums">
          <span className="text-xs font-bold font-sans bg-bg-surface border border-border-subtle px-2.5 py-1 rounded text-text-primary">
            سوال {currentIndex + 1} از {questions.length}
          </span>
          <span className="text-xs font-bold bg-status-success/10 border border-status-success/30 px-2.5 py-1 rounded text-status-success">
            امتیاز: {score}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-bg-surface h-1.5 rounded mb-4 overflow-hidden">
        <div
          className="bg-status-warning h-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="bg-bg-base border border-border-subtle p-4 rounded-md mb-4 font-bold text-sm text-text-primary leading-relaxed flex items-start gap-2.5">
        <HelpCircle className="w-5 h-5 text-status-warning flex-shrink-0 mt-0.5" />
        <span>{currentQ.q}</span>
      </div>

      {/* Options List */}
      <div className="grid grid-cols-1 gap-2.5">
        {currentQ.opts.map((opt, idx) => {
          const isCorrect = idx === currentQ.correct;
          const isSelected = idx === selectedOpt;

          let optionStyle =
            'border-border-subtle bg-bg-surface text-text-primary hover:border-amber-500/60 hover:bg-bg-base hover:bg-slate-850';
          let badgeStyle = 'bg-bg-surface text-text-secondary';

          if (selectedOpt !== null) {
            if (isCorrect) {
              optionStyle =
                'border-emerald-500 bg-status-success bg-emerald-950/50 text-emerald-900 text-status-success font-bold';
              badgeStyle = 'bg-status-success text-bg-surface';
            } else if (isSelected) {
              optionStyle =
                'border-rose-500 bg-rose-50 bg-rose-950/50 text-rose-900 text-status-error font-bold';
              badgeStyle = 'bg-status-error text-bg-surface';
            } else {
              optionStyle = 'opacity-50 border-border-subtle bg-bg-base';
            }
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={selectedOpt !== null}
              className={`w-full text-right p-3 rounded-md border text-xs font-medium transition-all duration-150 flex items-center justify-between gap-3 cursor-pointer ${optionStyle}`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-6 h-6 rounded text-xs font-bold flex items-center justify-center flex-shrink-0 transition-colors ${badgeStyle}`}
                >
                  {optionLabels[idx] || idx + 1}
                </span>
                <span className="leading-snug">{opt}</span>
              </div>
              {selectedOpt !== null && isCorrect && (
                <CheckCircle2 className="w-4 h-4 text-status-success" />
              )}
              {selectedOpt !== null && isSelected && !isCorrect && (
                <XCircle className="w-4 h-4 text-status-error" />
              )}
            </button>
          );
        })}
      </div>

      {/* Feedback Banner */}
      {selectedOpt !== null && (
        <div
          className={`mt-4 p-3.5 rounded-md border transition-all duration-200 ${
            selectedOpt === currentQ.correct
              ? 'bg-status-success/10 border-status-success/30 text-status-success'
              : 'bg-status-error/10 border-status-error/30 text-status-error'
          }`}
        >
          {selectedOpt === currentQ.correct ? (
            <div className="flex items-start gap-2 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-status-success mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-extrabold text-status-success mb-0.5">
                  پاسخ کاملاً صحیح است!
                </div>
                <div className="text-xs font-medium text-status-success leading-relaxed">
                  {currentQ.fb}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2 text-xs font-bold">
              <XCircle className="w-4 h-4 text-status-error mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-extrabold text-status-error mb-0.5">پاسخ نادرست است</div>
                <div className="text-xs font-medium text-status-error leading-relaxed">
                  گزینه صحیح:{' '}
                  <span className="underline font-bold">{currentQ.opts[currentQ.correct]}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer controls */}
      <div className="mt-4 flex justify-between items-center pt-3 border-t border-border-subtle">
        <span className="text-[11px] text-text-secondary font-medium">
          سوال بعدی را برای تثبیت یادگیری بزنید
        </span>
        <button
          onClick={handleNext}
          className="bg-status-warning hover:bg-amber-600 text-text-primary font-bold text-xs px-4 py-2 rounded-md shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <span>سوال بعدی</span>
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
