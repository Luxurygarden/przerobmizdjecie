import React, { useState } from 'react';
import { Check, Zap, X, CreditCard, Loader2 } from 'lucide-react';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchase: (amount: number) => void;
}

const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose, onPurchase }) => {
  const [processingPlan, setProcessingPlan] = useState<number | null>(null);

  if (!isOpen) return null;

  const plans = [
    {
      id: 1,
      name: "Start",
      credits: 5,
      price: "19 PLN",
      features: ["5 Wizualizacji", "Standardowa jakość", "Wsparcie email"],
      color: "from-blue-500 to-cyan-400",
      popular: false
    },
    {
      id: 2,
      name: "Pro",
      credits: 25,
      price: "49 PLN",
      features: ["25 Wizualizacji", "Wysoka jakość HD", "Priorytetowe generowanie", "Komercyjne użycie"],
      color: "from-purple-500 to-pink-500",
      popular: true
    },
    {
      id: 3,
      name: "Biznes",
      credits: 100,
      price: "149 PLN",
      features: ["100 Wizualizacji", "Jakość 4K", "Dedykowane wsparcie", "API Access"],
      color: "from-amber-400 to-orange-500",
      popular: false
    }
  ];

  const handleBuy = (planId: number, credits: number) => {
    setProcessingPlan(planId);
    // Simulate payment processing
    setTimeout(() => {
      onPurchase(credits);
      setProcessingPlan(null);
      onClose();
    }, 1500);
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
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Wybierz plan dla siebie
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Odblokuj pełną moc generowania wizualizacji. Wybierz pakiet kredytów, który najlepiej odpowiada Twoim potrzebom.
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
                    <Zap className={`text-${plan.color.split('-')[1]}-500 fill-current`} />
                    {plan.credits} <span className="text-lg text-gray-400 font-normal">Kredytów</span>
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-3 text-gray-300 text-sm">
                        <div className="p-1 rounded-full bg-gray-800 text-green-400">
                          <Check size={14} strokeWidth={3} />
                        </div>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleBuy(plan.id, plan.credits)}
                    disabled={processingPlan !== null}
                    className={`w-full py-3 px-4 rounded-lg font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2
                      ${processingPlan === plan.id 
                        ? 'bg-gray-600 cursor-wait' 
                        : `bg-gradient-to-r ${plan.color} hover:opacity-90 active:scale-95`
                      }
                    `}
                  >
                    {processingPlan === plan.id ? (
                      <>
                        <Loader2 className="animate-spin" size={20} /> Przetwarzanie...
                      </>
                    ) : (
                      <>
                        Wybieram <CreditCard size={18} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center text-sm text-gray-500">
            Bezpieczne płatności obsługiwane przez Stripe. Gwarancja zwrotu pieniędzy w ciągu 14 dni.
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingModal;