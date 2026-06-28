import React, { useState } from 'react';
import { BackArrowIcon } from './icons/BackArrowIcon';
import { SubscriptionPlan } from '../types';

interface PricingPageProps {
  onBack: () => void;
  onPlanSelect: (plan: SubscriptionPlan) => void;
  currentPlan: SubscriptionPlan;
}

type BillingCycle = 'monthly' | 'yearly';

const CheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5 text-green-500 dark:text-green-400 mr-3 shrink-0">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
);

interface PlanDetails {
    plan: SubscriptionPlan;
    description: string;
    features: string[];
    prices: {
        monthly: string;
        yearly: string;
    },
    paypalIds?: {
        monthly: string;
        yearly: string;
    }
}

const plans: PlanDetails[] = [
    {
        plan: "Free",
        description: "For individuals testing the waters.",
        prices: { monthly: "$0", yearly: "$0" },
        features: ['30 mins transcription/mo', 'Basic speaker separation', '5 file uploads/mo', 'Community support'],
    },
    {
        plan: "Pro",
        description: "For professionals who need more power.",
        prices: { monthly: "$5", yearly: "$30" },
        features: ['300 mins transcription/mo', 'AI-assisted action items', 'Text Translation (10k chars)', 'Audio Translation (10 mins)', '50 file uploads/mo', 'Priority email support'],
        paypalIds: { monthly: 'YOUR_PRO_MONTHLY_ID', yearly: 'YOUR_PRO_YEARLY_ID' }
    },
    {
        plan: "Super Pro",
        description: "For power users and small teams.",
        prices: { monthly: "$25", yearly: "$150" },
        features: ['1000 mins transcription/mo', 'Voice ID profiles', 'Text Translation (50k chars)', 'Audio Translation (60 mins)', '200 file uploads/mo', 'Real-time translation'],
        paypalIds: { monthly: 'YOUR_SUPERPRO_MONTHLY_ID', yearly: 'YOUR_SUPERPRO_YEARLY_ID' }
    },
    {
        plan: "Enterprise",
        description: "For large organizations.",
        prices: { monthly: "$100", yearly: "$600" },
        features: ['Unlimited everything', 'Custom AI models', 'Advanced security & SSO', 'Cross-meeting analytics', 'Dedicated support', 'Custom branding & templates'],
        paypalIds: { monthly: 'YOUR_ENTERPRISE_MONTHLY_ID', yearly: 'YOUR_ENTERPRISE_YEARLY_ID' }
    }
];

const PricingCard: React.FC<{
  details: PlanDetails;
  cycle: BillingCycle;
  isCurrent: boolean;
  onSelect: (plan: SubscriptionPlan) => void;
  isFeatured?: boolean;
}> = ({ details, cycle, isCurrent, onSelect, isFeatured }) => {
    const { plan, description, features, prices, paypalIds } = details;
    const price = cycle === 'monthly' ? prices.monthly : prices.yearly;
    const billing = cycle === 'monthly' ? '/mo' : '/yr';
    const buttonLink = paypalIds ? `https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=${cycle === 'monthly' ? paypalIds.monthly : paypalIds.yearly}` : '#';

    let buttonContent;
    if (isCurrent) {
        buttonContent = <span className="w-full block py-3 text-center font-bold rounded-xl glass-card cursor-default">✓ Current Plan</span>;
    } else if (plan === 'Free') {
        buttonContent = <button onClick={() => onSelect(plan)} className="w-full py-3 text-center font-bold rounded-xl transition-all duration-300 glass-button hover:scale-105">Downgrade</button>
    } else {
         buttonContent = (
            <div className="mt-6">
                 <button 
                   onClick={() => onSelect(plan)} 
                   className={`w-full py-4 text-center font-bold rounded-xl transition-all duration-300 transform hover:scale-105 ${
                     isFeatured 
                       ? 'gradient-button shadow-lg shadow-purple-500/50' 
                       : 'glass-button'
                   }`}
                 >
                    Choose {plan} →
                 </button>
                 <div className="mt-3 flex flex-col space-y-2 text-xs">
                   <a href={buttonLink} target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white transition-colors">
                     💳 Pay with PayPal
                   </a>
                   <p className="text-white/60 hover:text-white transition-colors cursor-pointer">
                     💰 Pay with Paystack
                   </p>
                 </div>
            </div>
        )
    }

    return (
      <div className={`glass-card flex flex-col relative overflow-hidden group transform hover:scale-105 transition-all duration-500 ${
        isFeatured ? 'border-2 border-purple-500 shadow-2xl shadow-purple-500/30' : ''
      }`}>
        {isFeatured && (
          <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-4 py-1 rounded-bl-lg">
            ⭐ POPULAR
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-blue-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        <div className="relative z-10">
          <h3 className="text-2xl font-black gradient-text mb-2">{plan}</h3>
          <p className="text-sm text-white/70 h-10">{description}</p>
          <div className="mt-6 mb-4">
            <span className="text-5xl font-black gradient-text">{price}</span>
            {plan !== 'Free' && <span className="text-lg font-semibold text-white/60 ml-2">{billing}</span>}
          </div>
          
          {buttonContent}
      
          <ul className="mt-8 space-y-4 text-white/90 flex-grow">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start group/item">
                <CheckIcon className="group-hover/item:scale-110 transition-transform duration-300" />
                <span className="group-hover/item:text-white transition-colors duration-300">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
}

const PricingPage: React.FC<PricingPageProps> = ({ onBack, onPlanSelect, currentPlan }) => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  return (
    <div>
        <button onClick={onBack} className="glass-button flex items-center mb-8 group">
            <BackArrowIcon className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
            Back to Dashboard
        </button>

        <div className="text-center mb-12" style={{animation: 'fade-in-up 0.6s ease-out'}}>
            <h2 className="text-5xl font-black gradient-text mb-4">Find the right plan for you</h2>
            <p className="text-white/70 text-xl mt-4 max-w-3xl mx-auto">
                From solo users to large enterprises, AudioMax has a plan that fits your needs. 🚀
            </p>
        </div>
        
        <div className="flex justify-center items-center space-x-6 mb-12 glass-card inline-flex mx-auto" style={{animation: 'fade-in-up 0.6s ease-out 0.1s both'}}>
            <span className={`font-bold text-lg transition-colors duration-300 ${billingCycle === 'monthly' ? 'text-white' : 'text-white/50'}`}>
              Monthly
            </span>
            <button
                onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-300 ${
                  billingCycle === 'yearly' 
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 shadow-lg shadow-purple-500/50' 
                    : 'bg-white/20'
                }`}
                aria-label="Toggle billing cycle"
            >
                <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                  billingCycle === 'yearly' ? 'translate-x-7' : 'translate-x-1'
                }`} />
            </button>
            <span className={`font-bold text-lg transition-colors duration-300 ${billingCycle === 'yearly' ? 'text-white' : 'text-white/50'}`}>
                Yearly 
                <span className="ml-2 text-sm font-bold text-green-300 bg-green-500/20 px-3 py-1 rounded-full">
                  💰 Save up to 50%!
                </span>
            </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6" style={{animation: 'fade-in-up 0.6s ease-out 0.2s both'}}>
            {plans.map((p, index) => (
                <div key={p.plan} style={{animation: `fade-in-up 0.5s ease-out ${0.3 + index * 0.1}s both`}}>
                  <PricingCard
                      details={p}
                      cycle={billingCycle}
                      isCurrent={currentPlan === p.plan}
                      onSelect={onPlanSelect}
                      isFeatured={p.plan === 'Pro'}
                  />
                </div>
            ))}
        </div>
        
        <div className="text-center mt-12 glass-card max-w-2xl mx-auto" style={{animation: 'fade-in-up 0.6s ease-out 0.7s both'}}>
            <p className="text-white/70">
              💳 Multiple payment options available: PayPal, Paystack, and more.
            </p>
            <p className="text-white/50 text-sm mt-2">
              Questions? Contact our sales team for custom enterprise solutions.
            </p>
        </div>
    </div>
  );
};

export default PricingPage;
