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
        features: ['60 mins transcription/mo', 'Basic speaker separation', '5 file uploads/mo', 'Community support'],
    },
    {
        plan: "Pro",
        description: "For professionals who need more power.",
        prices: { monthly: "$5", yearly: "$50" },
        features: ['300 mins transcription/mo', 'AI-assisted action items', 'Text Translation (10k chars)', 'Audio Translation (10 mins)', '20 file uploads/mo', 'Priority email support'],
        paypalIds: { monthly: 'YOUR_PRO_MONTHLY_ID', yearly: 'YOUR_PRO_YEARLY_ID' }
    },
    {
        plan: "Super Pro",
        description: "For power users and small teams.",
        prices: { monthly: "$25", yearly: "$150" },
        features: ['1000 mins transcription/mo', 'Voice ID profiles', 'Text Translation (50k chars)', 'Audio Translation (60 mins)', 'Unlimited uploads', 'Real-time translation'],
        paypalIds: { monthly: 'YOUR_SUPERPRO_MONTHLY_ID', yearly: 'YOUR_SUPERPRO_YEARLY_ID' }
    },
    {
        plan: "Enterprise",
        description: "For large organizations.",
        prices: { monthly: "$100", yearly: "$1000" },
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
        buttonContent = <span className="w-full block py-3 text-center font-semibold rounded-md bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-default">Current Plan</span>;
    } else if (plan === 'Free') {
        buttonContent = <button onClick={() => onSelect(plan)} className="w-full py-3 text-center font-semibold rounded-md transition-colors bg-slate-500 hover:bg-slate-600 text-white">Downgrade</button>
    } else {
         buttonContent = (
            <div className="mt-6 text-center">
                 <button onClick={() => onSelect(plan)} className={`w-full py-3 text-center font-semibold rounded-md transition-colors ${isFeatured ? 'bg-sky-500 text-white hover:bg-sky-600' : 'bg-slate-600 hover:bg-slate-700 text-slate-100 dark:bg-sky-500/20 dark:hover:bg-sky-500/30 dark:text-sky-300'}`}>
                    Choose {plan}
                 </button>
                 {/* This is a simulated action. For real payments, you'd use the link below after a successful transaction. */}
                 <a href={buttonLink} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-400 hover:text-sky-500 mt-2 inline-block">Pay with PayPal</a>
                 {/* Placeholder for Paystack or other payment options */}
                 <p className="text-xs text-slate-400 mt-1 cursor-pointer hover:text-sky-500">Pay with Paystack</p>
            </div>
        )
    }

    return (
      <div className={`rounded-lg p-6 flex flex-col border ${isFeatured ? 'bg-slate-100 dark:bg-slate-800 border-sky-500' : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'}`}>
        <h3 className="text-xl font-bold text-sky-600 dark:text-sky-400">{plan}</h3>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 h-10">{description}</p>
        <p className="mt-4 text-4xl font-extrabold text-slate-900 dark:text-slate-100">{price}<span className="text-base font-medium text-slate-500 dark:text-slate-400">{plan !== 'Free' ? billing : ''}</span></p>
        
        {buttonContent}
    
        <ul className="mt-8 space-y-3 text-slate-600 dark:text-slate-300 flex-grow">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <CheckIcon />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    );
}

const PricingPage: React.FC<PricingPageProps> = ({ onBack, onPlanSelect, currentPlan }) => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  return (
    <div>
        <button onClick={onBack} className="flex items-center text-sm text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 transition-colors mb-8">
            <BackArrowIcon className="h-4 w-4 mr-2" />
            Back to Dashboard
        </button>

        <div className="text-center mb-10">
            <h2 className="text-4xl font-bold text-slate-900 dark:text-slate-100">Find the right plan for you</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-2xl mx-auto">
                From solo users to large enterprises, AudioMax has a plan that fits your needs.
            </p>
        </div>
        
        <div className="flex justify-center items-center space-x-4 mb-10">
            <span className={`font-semibold ${billingCycle === 'monthly' ? 'text-sky-600 dark:text-sky-400' : 'text-slate-500 dark:text-slate-400'}`}>Monthly</span>
            <button
                onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${billingCycle === 'yearly' ? 'bg-sky-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                aria-label="Toggle billing cycle"
            >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className={`font-semibold ${billingCycle === 'yearly' ? 'text-sky-600 dark:text-sky-400' : 'text-slate-500 dark:text-slate-400'}`}>
                Yearly <span className="text-xs text-green-500">(Save up to 50%!)</span>
            </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-8">
            {plans.map(p => (
                <PricingCard
                    key={p.plan}
                    details={p}
                    cycle={billingCycle}
                    isCurrent={currentPlan === p.plan}
                    onSelect={onPlanSelect}
                    isFeatured={p.plan === 'Pro'}
                />
            ))}
        </div>
        <div className="text-center mt-8 text-sm text-slate-500 dark:text-slate-400">
            {/* Note: apporweb@gmail.com is the recipient for PayPal payments */}
            <p>For Paystack or other payment options, please contact sales.</p>
        </div>
    </div>
  );
};

export default PricingPage;
