import React from 'react';
import { Link } from 'react-router-dom';
import type { DiscoveryPerson } from '../../types/api';
import { EmploymentBadge, InstitutionBadge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface PersonCardProps {
  person: DiscoveryPerson;
  onConnect?: (personId: string) => void;
  connectionState?: 'none' | 'pending' | 'accepted';
}

export function PersonCard({ person, onConnect, connectionState = 'none' }: PersonCardProps) {
  const primaryAff = person.affiliations?.[0];
  const primaryClaim = person.employmentClaims?.[0];

  return (
    <article className="mercury-card p-5 flex flex-col justify-between gap-4 animate-fade-in hover:border-neutral-300 transition-all">
      <div className="space-y-3.5">
        {/* Top Header: Avatar + Info */}
        <div className="flex items-start gap-3.5">
          <Link to={`/profile/${person.id}`} className="flex-shrink-0 group">
            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-neutral-900 to-neutral-700 text-white flex items-center justify-center text-sm font-bold shadow-sm ring-1 ring-black/5 group-hover:ring-neutral-400 transition-all">
              {person.name.charAt(0)}
            </div>
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <Link
                to={`/profile/${person.id}`}
                className="text-sm font-bold text-neutral-950 hover:text-neutral-700 truncate tracking-tight transition-colors"
              >
                {person.name}
              </Link>
            </div>

            {/* Current Professional Role */}
            {primaryClaim ? (
              <p className="text-xs font-semibold text-neutral-800 mt-0.5 truncate">
                {primaryClaim.jobTitle}{' '}
                <span className="text-neutral-400 font-normal">@</span>{' '}
                <span className="text-neutral-900">{primaryClaim.companyName}</span>
              </p>
            ) : null}

            {/* Academic Affiliation */}
            {primaryAff ? (
              <p className="text-[11px] text-neutral-500 mt-0.5 truncate">
                {primaryAff.role}
                {[primaryAff.programme, primaryAff.batch].filter(Boolean).length > 0 && (
                  <span> · {[primaryAff.programme, primaryAff.batch].filter(Boolean).join(', ')}</span>
                )}
              </p>
            ) : null}
          </div>
        </div>

        {/* Verification Status Row (Compact & Elegant) */}
        {(primaryAff?.verificationStatus || primaryClaim?.status) && (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {primaryClaim && <EmploymentBadge status={primaryClaim.status} />}
            {primaryAff && <InstitutionBadge status={primaryAff.verificationStatus} />}
          </div>
        )}

        {/* Bio */}
        {person.bio && (
          <p className="text-xs text-neutral-600 leading-relaxed line-clamp-2 font-normal">
            {person.bio}
          </p>
        )}

        {/* Skills Tags (Unified Minimalist Palette) */}
        {person.skills?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {person.skills.slice(0, 4).map((skill) => (
              <span
                key={skill}
                className="px-2 py-0.5 bg-neutral-100/70 border border-neutral-200/50 text-neutral-700 text-[11px] rounded-md font-medium"
              >
                {skill}
              </span>
            ))}
            {person.skills.length > 4 && (
              <span className="text-[10px] text-neutral-400 font-medium self-center px-1">
                +{person.skills.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Availability Status (Subtle Indicators) */}
        {person.availability && !person.availability.paused && (
          <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-neutral-500">
            {person.availability.mentorship && (
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Mentorship
              </span>
            )}
            {person.availability.referrals && (
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Referrals
              </span>
            )}
            {person.availability.questions && (
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                Open to questions
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="flex items-center gap-2 pt-3.5 border-t border-neutral-100">
        <Link to={`/profile/${person.id}`} className="flex-1">
          <Button variant="secondary" size="sm" className="w-full text-xs font-medium py-2 rounded-xl">
            View Profile
          </Button>
        </Link>

        {connectionState === 'none' && onConnect && !person.availability?.paused && (
          <Button size="sm" onClick={() => onConnect(person.id)} className="text-xs font-semibold py-2 px-4 rounded-xl">
            Connect
          </Button>
        )}

        {connectionState === 'pending' && (
          <span className="text-xs text-neutral-400 font-medium px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-xl">
            Pending
          </span>
        )}

        {connectionState === 'accepted' && (
          <span className="text-xs text-neutral-800 font-semibold px-3 py-1.5 bg-neutral-100 border border-neutral-200 rounded-xl">
            Connected
          </span>
        )}
      </div>
    </article>
  );
}
