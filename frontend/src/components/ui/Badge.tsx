import React from 'react';
import { CheckCircle, Clock, Building2, Briefcase, Users } from 'lucide-react';

type BadgeVariant =
  | 'verified'
  | 'self-reported'
  | 'pending'
  | 'institution'
  | 'campus'
  | 'group'
  | 'public'
  | 'neutral';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantConfig: Record<BadgeVariant, { className: string; icon?: React.ReactNode }> = {
  verified: {
    className: 'badge-verified',
    icon: <CheckCircle size={11} className="flex-shrink-0" />,
  },
  'self-reported': {
    className: 'badge-self-reported',
    icon: <Briefcase size={11} className="flex-shrink-0" />,
  },
  pending: {
    className: 'badge-pending',
    icon: <Clock size={11} className="flex-shrink-0" />,
  },
  institution: {
    className: 'badge-institution',
    icon: <Building2 size={11} className="flex-shrink-0" />,
  },
  campus: {
    className: 'inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full',
    icon: <Building2 size={11} className="flex-shrink-0" />,
  },
  group: {
    className: 'inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 text-xs font-medium rounded-full',
    icon: <Users size={11} className="flex-shrink-0" />,
  },
  public: {
    className: 'inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded-full',
  },
  neutral: {
    className: 'inline-flex items-center gap-1 px-2 py-0.5 bg-mercury-gray-100 text-mercury-gray-600 text-xs font-medium rounded-full',
  },
};

export function Badge({ variant = 'neutral', children, className = '' }: BadgeProps) {
  const config = variantConfig[variant];
  return (
    <span className={`${config.className} ${className}`}>
      {config.icon}
      {children}
    </span>
  );
}

// ── Employment Badge ── never shows a generic verified tick
export function EmploymentBadge({ status }: { status: 'employer-verified' | 'self-reported' | 'pending' }) {
  if (status === 'employer-verified') {
    return <Badge variant="verified">Employer-verified</Badge>;
  }
  if (status === 'self-reported') {
    return <Badge variant="self-reported">Self-reported</Badge>;
  }
  return <Badge variant="pending">Pending verification</Badge>;
}

// ── Institution Badge ── clearly labeled
export function InstitutionBadge({ status }: { status: 'institution-verified' | 'unverified' }) {
  if (status === 'institution-verified') {
    return <Badge variant="institution">Institution-verified</Badge>;
  }
  return <Badge variant="neutral">Unverified</Badge>;
}
