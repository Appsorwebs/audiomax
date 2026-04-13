import React, { useState } from 'react';
import { BackArrowIcon } from './icons/BackArrowIcon';
import { SubscriptionPlan } from '../types';
import { PremiumButton } from './ui/PremiumButton';
import { PremiumHeader } from './ui/PremiumHeader';

interface PricingPageProps {
  onBack: () => void;
  onPlanSelect: (plan: SubscriptionPlan) => void;
  currentPlan: SubscriptionPlan;
}

type BillingCycle = 'monthly' | 'yearly';

const CheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
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
    };
    paypalIds?: {
        monthly: string;
        yearly: string;
    };
    icon: string;
    highlight?: boolean;
}

const plans: PlanDetails[] = [
    {
        plan: "Free",
        description: "For individuals testing the waters.",
        prices: { monthly: "$0", yearly: "$0" },
        features: ['60 mins transcription/mo', 'Basic speaker separation', '5 file uploads/mo', 'Community support'],
        icon: "🚀",
    },
    {
        plan: "Pro",
        description: "For professionals who need more power.",
        prices: { monthly: "$5", yearly: "$30" },
        features: ['300 mins transcription/mo', 'AI-assisted action items', 'Text Translation (10k chars)', 'Audio Translation (10 mins)', '20 file uploads/mo', 'Priority email support'],
        paypalIds: { monthly: 'YOUR_PRO_MONTHLY_ID', yearly: 'YOUR_PRO_YEARLY_ID' },
        icon: "⚡",
        highlight: true,
    },
    {
        plan: "Super Pro",
        description: "For power users and small teams.",
        prices: { monthly: "$25", yearly: "$150" },
        features: ['1000 mins transcription/mo', 'Voice ID profiles', 'Text Translation (50k chars)', 'Audio Translation (60 mins)', 'Unlimited uploads', 'Real-time translation'],
        paypalIds: { monthly: 'YOUR_SUPERPRO_MONTHLY_ID', yearly: 'YOUR_SUPERPRO_YEARLY_ID' },
        icon: "🔥",
    },
    {
        plan: "Enterprise",
        description: "For large organizations.",
        prices: { monthly: "$100", yearly: "$600" },
        features: ['Unlimited everything', 'Custom AI models', 'Advanced security & SSO', 'Cross-meeting analytics', 'Dedicated support', 'Custom branding & templates'],
        paypalIds: { monthly: 'YOUR_ENTERPRISE_MONTHLY_ID', yearly: 'YOUR_ENTERPRISE_YEARLY_ID' },
        icon: "👑",
    }
];

const PricingCard: React.FC<{
  details: PlanDetails;
  cycle: BillingCycle;
  isCurrent: boolean;
  onSelect: (plan: SubscriptionPlan) => void;
}> = ({ details, cycle, isCurrent, onSelect }) => {
    const { plan, description, features, prices, paypalIds, icon, highlight } = details;
    const price = cycle === 'monthly' ? prices.monthly : prices.yearly;
    const billing = cycle === 'monthly' ? '/mo' : '/yr';
    const buttonLink = paypalIds ? `https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=${cycle === 'monthly' ? paypalIds.monthly : paypalIds.yearly}` : '#';

    return (
      <div className={`${highlight ? 'glass-premium scale-105 ring-2 ring-primary-400' : 'glass-premium'} p-8 rounded-2xl flex flex-col transition-all duration-300 hover:shadow-2xl hover:scale-105`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold text-neutral-100">{plan}</h3>
          <span className="text-4xl">{icon}</span>
        </div>
        <p className="text-neutral-400 text-sm h-10">{description}</p>
        
        <div className="mt-6 mb-6">
          <p className="text-5xl font-bold text-transparent bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text">
            {price}
            {plan !== 'Free' && <span className="text-xl text-neutral-400 font-normal ml-1">{billing}</span>}
          </p>
        </div>

        {/* Button */}
        {isCurrent ? (
          <div className="badge badge-success w-full text-center py-3 font-semibold mb-6">
            ✓ Current Plan
          </div>
        ) : (
          <PremiumButton
            onClick={() => onSelect(plan)}
            variant={highlight ? 'gradient' : 'secondary'}
            size="lg"
            fullWidth
            className="mb-6"
          >
            {plan === 'Free' ? 'Downgrade' : `Choose ${plan}`}
          </PremiumButton>
        )}

        {/* Features List */}
        <ul className="space-y-3 flex-grow">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <CheckIcon className="text-success-500 flex-shrink-0 mt-0.5" />
              <span className="text-neutral-300 text-sm">{feature}</span>
            </li>
          ))}
        </ul>

        {/* Payment Options Note */}
        {!isCurrent && plan !== 'Free' && (
          <div className="mt-6 pt-4 border-t border-neutral-700/30">
            <p className="text-xs text-neutral-400 text-center">
              💳 PayPal • 🏦 Paystack • 💰 Other options available
            </p>
          </div>
        )}
      </div>
    );
};

const PricingPage: React.FC<PricingPageProps> = ({ onBack, onPlanSelect, currentPlan }) => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6 lg:space-y-8">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-primary-400 hover:text-primary-300 transition-colors group"
        >
          <BackArrowIcon className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </button>

        {/* Header */}
        <PremiumHeader
          title="Simple, Transparent Pricing"
          subtitle="Choose the perfect plan for your transcription needs. Upgrade or downgrade anytime."
          showGradient={true}
        />

        {/* Billing Toggle */}
        <div className="flex justify-center items-center gap-4">
          <span className={`font-semibold transition-colors ${billingCycle === 'monthly' ? 'text-primary-300' : 'text-neutral-400'}`}>
            Monthly
          </span>
          <button
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all ${
              billingCycle === 'yearly'
                ? 'bg-gradient-to-r from-primary-500 to-secondary-500'
                : 'bg-neutral-700'
            }`}
            aria-label="Toggle billing cycle"
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                billingCycle === 'yearly' ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
          <span className={`font-semibold transition-colors ${billingCycle === 'yearly' ? 'text-primary-300' : 'text-neutral-400'}`}>
            Yearly
            <span className="badge badge-success ml-2">Save 50%</span>
          </span>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
          {plans.map((p) => (
            <PricingCard
              key={p.plan}
              details={p}
              cycle={billingCycle}
              isCurrent={currentPlan === p.plan}
              onSelect={onPlanSelect}
            />
          ))}
        </div>

        {/* FAQ Section */}
        <div className="glass-premium p-8 rounded-2xl border border-primary-500/20">
          <h3 className="text-2xl font-bold text-neutral-100 mb-6">Frequently Asked Questions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
            <div>
              <h4 className="text-primary-300 font-semibold mb-2">Can I switch plans?</h4>
              <p className="text-neutral-400 text-sm">Yes! You can upgrade or downgrade your plan anytime. Changes take effect immediately.</p>
            </div>
            <div>
              <h4 className="text-primary-300 font-semibold mb-2">Do you offer refunds?</h4>
              <p className="text-neutral-400 text-sm">We offer a 7-day money-back guarantee for all paid plans, no questions asked.</p>
            </div>
            <div>
              <h4 className="text-primary-300 font-semibold mb-2">What about overage charges?</h4>
              <p className="text-neutral-400 text-sm">No hidden charges. We'll notify you before processing additional requests beyond your limit.</p>
            </div>
            <div>
              <h4 className="text-primary-300 font-semibold mb-2">Need a custom plan?</h4>
              <p className="text-neutral-400 text-sm">Contact our sales team for enterprise customization and volume discounts.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-8 border-t border-neutral-700/30">
          <p className="text-neutral-400 text-sm">
            Questions? <a href="mailto:sales@audiomax.com" className="text-primary-400 hover:text-primary-300">Contact our sales team</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
