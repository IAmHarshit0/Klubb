import React from 'react';
import { CheckCircle2, Clock, Building2, Briefcase, Users, ShieldCheck } from 'lucide-react';

type BadgeVariant =
  | 'verified'
  | 'self-reported'
  | 'pending'
  | 'institution'
  | 'campus'
  | 'group'
  | 'public'
  | 'neutral'
  | 'default'
  | 'secondary';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantConfig: Record<BadgeVariant, { className: string; icon?: React.ReactNode }> = {
  verified: {
    className: 'badge-verified',
    icon: <CheckCircle2 size={11} className="text-neutral-700 flex-shrink-0" />,
  },
  'self-reported': {
    className: 'badge-self-reported',
    icon: <Briefcase size={10} className="text-neutral-400 flex-shrink-0" />,
  },
  pending: {
    className: 'badge-pending',
    icon: <Clock size={10} className="text-neutral-400 flex-shrink-0" />,
  },
  institution: {
    className: 'badge-institution',
    icon: <Building2 size={11} className="text-neutral-600 flex-shrink-0" />,
  },
  campus: {
    className: 'inline-flex items-center gap-1 px-2 py-0.5 bg-neutral-100/70 border border-neutral-200 text-neutral-700 text-[11px] font-medium rounded-md',
    icon: <Building2 size={10} className="text-neutral-500 flex-shrink-0" />,
  },
  group: {
    className: 'inline-flex items-center gap-1 px-2 py-0.5 bg-neutral-100/70 border border-neutral-200 text-neutral-700 text-[11px] font-medium rounded-md',
    icon: <Users size={10} className="text-neutral-500 flex-shrink-0" />,
  },
  public: {
    className: 'inline-flex items-center gap-1 px-2 py-0.5 bg-neutral-100/70 border border-neutral-200 text-neutral-700 text-[11px] font-medium rounded-md',
  },
  neutral: {
    className: 'inline-flex items-center gap-1 px-2 py-0.5 bg-neutral-50 border border-neutral-200 text-neutral-500 text-[11px] font-medium rounded-md',
  },
  default: {
    className: 'inline-flex items-center gap-1 px-2 py-0.5 bg-neutral-100 border border-neutral-200 text-neutral-700 text-[11px] font-medium rounded-md',
  },
  secondary: {
    className: 'inline-flex items-center gap-1 px-2 py-0.5 bg-neutral-50 border border-neutral-200 text-neutral-500 text-[11px] font-medium rounded-md',
  },
};

export function Badge({ variant = 'neutral', children, className = '' }: BadgeProps) {
  const config = variantConfig[variant];
  return (
    <span className={`${config.className} ${className}`}>
      {config.icon}
      <span>{children}</span>
    </span>
  );
}

// ── Employment Badge ── elegant & clear
export function EmploymentBadge({ status }: { status: 'employer-verified' | 'self-reported' | 'pending' }) {
  if (status === 'employer-verified') {
    return <Badge variant="verified">Employer-verified</Badge>;
  }
  if (status === 'self-reported') {
    return <Badge variant="self-reported">Self-reported</Badge>;
  }
  return <Badge variant="pending">Pending verification</Badge>;
}

// ── Institution Badge ── subtle & clean
export function InstitutionBadge({ status }: { status: 'institution-verified' | 'unverified' }) {
  if (status === 'institution-verified') {
    return <Badge variant="institution">Institution-verified</Badge>;
  }
  return <Badge variant="neutral">Unverified</Badge>;
}
