import React, { useState } from 'react';
import { Check, Zap, X, CreditCard, Loader2 } from 'lucide-react';
import { startCheckout, PlanId } from '../services/paymentService';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const plans: {
  id: PlanId;
  name: string;
  credits: number;
  price: string;
  perImage: string;
  color: string;
  popular: boolean;
}[] = [
  { id: 'start', name: 'Start', credits: 5, price: '19 PLN', perImage: '3,80 zł', color: 'from-blue-500 to-cyan-400', popular: false },
  { id: 'pro', name: 'Pro', credits: 25, price: '49 PLN', perImage: '1,96 zł', color: 'from-purple-500 to-pink-500', popular: true },
  { id: 'biznes', name: 'Biznes', credits: 100, price: '149 PLN', perImage: '1,49 zł', color: 'from-amber-400 to-orange-500', popular: false },
];

const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose }) => {
  const [processingPlan, setProcessingPlan] = useState<PlanId | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleBuy = async (planId: PlanId) => {
    setError(null);
    setProcessingPlan(planId);
    try {
      await startCheckout(planId);
    } catch {
      setError('Nie udało się rozpocząć płatności. Spróbuj ponownie za chwilę.');
      setProcessingPlan(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-[#0f172a] border border-gray-800 rounded-2xl max-w-5xl w-full shadow-2xl p-6 md:p-10 my-8">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-800 z-10"
          >
            <X size={24} />
          </button>

          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Wybierz pakiet</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Jedna wizualizacja = jeden kredyt. Płacisz jednorazowo, bez abonamentu.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative bg-[#1e293b] rounded-xl p-1 transition-transform duration-300 hover:-translate-y-2 ${plan.popular ? 'ring-2 ring-purple-500 shadow-[0_0_20px_rgba(147,51,234,0.3)]' : 'border border-gray-700'}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg z-10 w-max">
                    Najpopularniejszy
                  </div>
                )}

                <div className="bg-[#111827] rounded-lg p-6 h-full flex flex-col">
                  <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="flex items-end gap-2 mb-6">
                    <span className="text-3xl font-bold text-white">{plan.price}</span>
                    <span className="text-gray-400 mb-1">/ jednorazowo</span>
                  </div>

                  <div className={`bg-gradient-to-r ${plan.color} bg-clip-text text-transparent font-bold text-4xl mb-6 flex items-center gap-2`}>
                    <Zap className="text-yellow-400 fill-current" />
                    {plan.credits} <span className="text-lg text-gray-400 font-normal">Kredytów</span>
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {[`${plan.credits} wizualizacji AI`, `${plan.perImage} za wizualizację`, 'Analiza zdjęcia gratis', 'Kredyty nie wygasają'].map((feature) => (
                      <li key={feature} className="flex items-center gap-3 text-gray-300 text-sm">
                        <div className="p-1 rounded-full bg-gray-800 text-green-400">
                          <Check size={14} strokeWidth={3} />
                        </div>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleBuy(plan.id)}
                    disabled={processingPlan !== null}
                    className={`w-full py-3 px-4 rounded-lg font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 ${
                      processingPlan === plan.id ? 'bg-gray-600 cursor-wait' : `bg-gradient-to-r ${plan.color} hover:opacity-90 active:scale-95`
                    }`}
                  >
                    {processingPlan === plan.id ? (
                      <>
                        <Loader2 className="animate-spin" size={20} /> Przekierowuję...
                      </>
                    ) : (
                      <>
                        Kupuję <CreditCard size={18} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {error && <p className="mt-6 text-center text-sm text-red-400">{error}</p>}

          <div className="mt-10 text-center text-sm text-gray-500">
            Bezpieczne płatności Stripe: BLIK, karta, Apple Pay, Google Pay.
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingModal;
