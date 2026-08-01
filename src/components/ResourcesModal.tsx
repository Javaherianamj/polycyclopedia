import React from 'react';
import { BookOpen, FileText, FlaskConical, Factory, X } from 'lucide-react';

interface ResourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ResourcesModal: React.FC<ResourcesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-surface/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-bg-surface border border-border-subtle rounded-lg w-full max-w-4xl max-h-[85vh] overflow-y-auto shadow-2xl p-6 sm:p-8 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 w-8 h-8 rounded-md bg-bg-surface hover:bg-bg-surface flex items-center justify-center font-bold text-text-secondary transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border-subtle">
          <div className="w-10 h-10 rounded-md bg-accent-secondary border-accent-secondary border-accent-secondary p-2 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-accent-primary" />
          </div>
          <div>
            <h2 className="text-xl font-black text-text-primary">
              مراجع، مراجع علمی و دیتاشیت‌های صنعتی (Academic & Industry Sources)
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary mt-0.5 font-medium">
              Polypedia - دانشنامه مرجع مهندسی پلیمر • انجمن علمی مهندسی پلیمر
            </p>
          </div>
        </div>

        {/* Sources Content List */}
        <div className="space-y-6 text-sm text-text-secondary">
          {/* Section 1: Standard Academic Handbooks */}
          <div className="bg-bg-base p-5 rounded-md border border-border-subtle">
            <h3 className="font-extrabold text-base text-accent-primary mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>۱. کتب مرجع و هندبوک‌های پایه علوم و مهندسی پلیمر</span>
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm list-disc list-inside leading-relaxed text-text-secondary">
              <li>
                <strong className="en-mono text-text-primary font-mono">
                  Polymer Handbook (4th Edition)
                </strong>{' '}
                - J. Brandrup, E.H. Immergut, E.A. Grulke (Wiley-Interscience) -{' '}
                <span className="text-text-secondary">
                  مرجع مقادیر Enthalpy of Fusion, Crystal Parameters, Density
                </span>
              </li>
              <li>
                <strong className="en-mono text-text-primary font-mono">
                  Principles of Polymerization (4th Edition)
                </strong>{' '}
                - George Odian (Wiley) -{' '}
                <span className="text-text-secondary">
                  مرجع سینتیک سنتز، پلیمریزاسیون رادیکالی، زیگلر-ناتا و متالوسن
                </span>
              </li>
              <li>
                <strong className="en-mono text-text-primary font-mono">
                  Encyclopedia of Polymer Science and Technology
                </strong>{' '}
                - Herman F. Mark (Wiley) -{' '}
                <span className="text-text-secondary">
                  خواص حرارتی، مکانیکی و ساختار کریستالی گریدها
                </span>
              </li>
              <li>
                <strong className="en-mono text-text-primary font-mono">Polymer Physics</strong> -
                Michael Rubinstein, Ralph H. Colby (Oxford University Press) -{' '}
                <span className="text-text-secondary">
                  فرمول‌بندی وزن درهم‌تنیدگی (Me) و شعاع ژیراسیون (Rg)
                </span>
              </li>
            </ul>
          </div>

          {/* Section 2: Technical Standard Test Methods */}
          <div className="bg-bg-base p-5 rounded-md border border-border-subtle">
            <h3 className="font-extrabold text-base text-status-success mb-3 flex items-center gap-2">
              <FlaskConical className="w-4 h-4" />
              <span>۲. استانداردهای آزمون‌های بین‌المللی (ISO / ASTM Test Methods)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-bg-surface p-3 rounded border border-border-subtle">
                <span className="font-bold en-mono font-mono tabular-nums text-text-primary block mb-0.5">
                  ASTM D1238 / ISO 1133
                </span>
                <span className="text-text-secondary">اندازه‌گیری شاخص جریان مذاب (MFI / MFR)</span>
              </div>
              <div className="bg-bg-surface p-3 rounded border border-border-subtle">
                <span className="font-bold en-mono font-mono tabular-nums text-text-primary block mb-0.5">
                  ASTM D638 / ISO 527
                </span>
                <span className="text-text-secondary">خواص کششی، مدول یانگ و استحکام تسلیم</span>
              </div>
              <div className="bg-bg-surface p-3 rounded border border-border-subtle">
                <span className="font-bold en-mono font-mono tabular-nums text-text-primary block mb-0.5">
                  ASTM D3418 / ISO 11357
                </span>
                <span className="text-text-secondary">
                  کالری‌متری روبشی تفاضلی (DSC) برای Tg، Tm و درصد بلورینگی
                </span>
              </div>
              <div className="bg-bg-surface p-3 rounded border border-border-subtle">
                <span className="font-bold en-mono font-mono tabular-nums text-text-primary block mb-0.5">
                  ASTM D7611 / ISO 11469
                </span>
                <span className="text-text-secondary">
                  کدگذاری کدهای بازیافت رزین‌ها (Resin Identification Code)
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Iranian & International Petrochemical Plant Catalogs */}
          <div className="bg-bg-base p-5 rounded-md border border-border-subtle">
            <h3 className="font-extrabold text-base text-accent-primary mb-3 flex items-center gap-2">
              <Factory className="w-4 h-4" />
              <span>۳. دیتاشیت‌ها و کاتالوگ‌های پتروشیمی‌های داخلی و خارجی</span>
            </h3>
            <p className="text-xs text-text-secondary mb-3">
              اطلاعات تجاری، MFI، چگالی، کاربردها و گریدهای تجاری مستقیم از برگه مشخصات فنی
              پتروشیمی‌های زیر استخراج گردیده است:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-semibold">
              <div className="p-3 bg-bg-surface rounded border border-border-subtle">
                <span className="text-status-warning font-bold block mb-1">
                  مجتمع‌های پتروشیمی ایران:
                </span>
                پتروشیمی امیرکبیر، پتروشیمی جم، پتروشیمی مارون، پتروشیمی ایلام، پتروشیمی بندرامام،
                پتروشیمی تبریز و شازند اراک.
              </div>
              <div className="p-3 bg-bg-surface rounded border border-border-subtle">
                <span className="text-accent-primary font-bold block mb-1">
                  مجتمع‌های چندملیتی:
                </span>
                SABIC (عربستان)، LyondellBasell (هلند/آمریکا)، Dow Chemical (آمریکا)، ExxonMobil
                (آمریکا)، Formosa Plastics (تایوان)، INEOS (بریتانیا) و PetroChina (چین).
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-8 pt-4 border-t border-border-subtle flex justify-between items-center text-xs text-text-secondary">
          <span>توسعه‌یافته توسط انجمن علمی مهندسی پلیمر</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-accent-primary hover:bg-blue-700 text-text-primary font-bold transition-colors cursor-pointer"
          >
            بستن پنجره
          </button>
        </div>
      </div>
    </div>
  );
};
