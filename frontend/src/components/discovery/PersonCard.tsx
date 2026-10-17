import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ExternalLink } from 'lucide-react';
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
    <article className="mercury-card p-5 flex flex-col gap-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link to={`/profile/${person.id}`} className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-mercury-gray-100 to-mercury-gray-200 flex items-center justify-center text-base font-black text-mercury-gray-700 hover:ring-2 hover:ring-mercury-gray-200 transition-all">
            {person.name.charAt(0)}
          </div>
        </Link>

        <div className="flex-1 min-w-0">
          <Link
            to={`/profile/${person.id}`}
            className="text-sm font-bold text-mercury-black hover:underline underline-offset-2 truncate block"
          >
            {person.name}
          </Link>

          {/* Affiliation */}
          {primaryAff && (
            <div className="flex items-center flex-wrap gap-1.5 mt-1">
              <span className="text-xs text-mercury-gray-500">{primaryAff.role}</span>
              {primaryAff.programme && (
                <span className="text-xs text-mercury-gray-400">· {primaryAff.programme}</span>
              )}
              {primaryAff.batch && (
                <span className="text-xs text-mercury-gray-400">{primaryAff.batch}</span>
              )}
              <InstitutionBadge status={primaryAff.verificationStatus} />
            </div>
          )}

          {/* Employment */}
          {primaryClaim && (
            <div className="flex items-center flex-wrap gap-1.5 mt-1">
              <span className="text-xs font-medium text-mercury-gray-700">
                {primaryClaim.jobTitle} @ {primaryClaim.companyName}
              </span>
              <EmploymentBadge status={primaryClaim.status} />
            </div>
          )}
        </div>
      </div>

      {/* Bio */}
      {person.bio && (
        <p className="text-xs text-mercury-gray-600 leading-relaxed line-clamp-2">{person.bio}</p>
      )}

      {/* Skills */}
      {person.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {person.skills.slice(0, 5).map((skill) => (
            <span
              key={skill}
              className="px-2 py-0.5 bg-mercury-gray-50 border border-mercury-gray-100 text-mercury-gray-600 text-xs rounded-lg"
            >
              {skill}
            </span>
          ))}
          {person.skills.length > 5 && (
            <span className="text-xs text-mercury-gray-400 self-center">
              +{person.skills.length - 5}
            </span>
          )}
        </div>
      )}

      {/* Availability badges */}
      {person.availability && !person.availability.paused && (
        <div className="flex flex-wrap gap-1.5">
          {person.availability.mentorship && (
            <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-100">
              Open to mentorship
            </span>
          )}
          {person.availability.referrals && (
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-100">
              Open to referrals
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-mercury-gray-50">
        <Link to={`/profile/${person.id}`} className="flex-1">
          <Button variant="secondary" size="sm" className="w-full">
            View Profile
          </Button>
        </Link>
        {connectionState === 'none' && onConnect && !person.availability?.paused && (
          <Button size="sm" onClick={() => onConnect(person.id)}>
            Connect
          </Button>
        )}
        {connectionState === 'pending' && (
          <span className="text-xs text-mercury-gray-400 font-medium">Pending</span>
        )}
        {connectionState === 'accepted' && (
          <span className="text-xs text-green-600 font-semibold">Connected</span>
        )}
      </div>
    </article>
  );
}
