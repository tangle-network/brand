import { Button } from '../primitives/button';
import type { SiteLink } from './site-nav';

interface Plan {
  id: string;
  monthlyPriceCents: number;
  creditsPerMonth: number;
  features: string[];
  isPopular?: boolean;
}
export interface PlanTableProps {
  plans: Plan[];
  names: Record<string, string>;
  rate: { size: string; perHour: number; minimum: number; href: string };
  actions: (SiteLink & { primary?: boolean })[];
  more: SiteLink;
}

export function PlanTable({ plans, names, rate, actions, more }: PlanTableProps) {
  return (
    <div className="mk mk-plan-table">
      <div className="mk-rate">
        <div>
          <span className="mk-mono">{rate.size}</span>
          <strong>
            ${rate.perHour.toFixed(4)}
            <small> / hour</small>
          </strong>
        </div>
        <div>
          <span>Minimum for any sandbox</span>
          <strong>
            ${rate.minimum.toFixed(4)}
            <small> / hour</small>
          </strong>
        </div>
        <a href={rate.href}>{rate.href.replace(/^https?:\/\/[^/]+/, '')} ↗</a>
      </div>
      <div className="mk-plans" data-plans>
        {plans
          .filter((plan) => names[plan.id])
          .map((plan) => {
            const dollars = plan.monthlyPriceCents / 100,
              price = `$${Number.isInteger(dollars) ? dollars : dollars.toFixed(2)}`;
            return (
              <article
                key={plan.id}
                className={`mk-plan${plan.isPopular ? ' mk-popular' : ''}`}
                data-plan={plan.id}
              >
                <h3>{names[plan.id]}</h3>
                <div className="mk-price">
                  <span className="plan-amount">{price}</span>
                  {dollars > 0 && <small>/ month</small>}
                </div>
                <p className="mk-credit">
                  {plan.creditsPerMonth
                    ? `$${(plan.creditsPerMonth / 100).toLocaleString('en-US', { maximumFractionDigits: 2 })} credit each month`
                    : 'No included credit'}
                </p>
                <ul className="plan-features">
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </article>
            );
          })}
      </div>
      <div className="mk-plan-foot">
        <div className="mk-actions">
          {actions.map((action) => (
            <Button
              key={action.href}
              asChild
              variant={action.primary ? 'default' : 'outline'}
              className={`mk-btn ${action.primary ? 'mk-primary' : 'mk-ghost'}`}
            >
              <a href={action.href}>{action.label}</a>
            </Button>
          ))}
        </div>
        <a className="mk-section-link" href={more.href}>
          {more.label}
        </a>
      </div>
    </div>
  );
}
