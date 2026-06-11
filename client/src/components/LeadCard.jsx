import ScoreBadge from './ScoreBadge';
import StatusChip from './StatusChip';
import SoloScoreBar from './SoloScoreBar';
import Tooltip from './Tooltip';
import {
  MailIcon,
  InstagramIcon,
  LinkedinIcon,
  FacebookIcon,
  PhoneIcon,
  FormIcon,
  InfoIcon,
} from './Icons';

function asUrl(value) {
  if (!value) return null;
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function IconLink({ href, label, children }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      title={label}
      aria-label={label}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-100"
    >
      {children}
    </a>
  );
}

export default function LeadCard({ lead }) {
  const {
    domain,
    store_name,
    founder_name,
    score,
    solo_score,
    solo_reason,
    us_reason,
    status,
    email,
    instagram,
    linkedin,
    facebook,
    phone,
    contact_form_url,
  } = lead;

  const why = [
    us_reason ? `US: ${us_reason}` : null,
    solo_reason ? `Solo: ${solo_reason}` : null,
  ]
    .filter(Boolean)
    .join('\n\n');

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 transition hover:border-zinc-700 sm:flex-row sm:items-center sm:gap-4">
      <ScoreBadge score={score} />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={asUrl(domain)}
            target="_blank"
            rel="noreferrer"
            className="truncate text-base font-semibold text-zinc-100 hover:text-violet-400"
          >
            {store_name || domain}
          </a>
          {store_name && (
            <a
              href={asUrl(domain)}
              target="_blank"
              rel="noreferrer"
              className="truncate text-sm text-zinc-500 hover:text-violet-400"
            >
              {domain}
            </a>
          )}
          <StatusChip status={status} />
          {why && (
            <Tooltip content={<span className="whitespace-pre-line">{why}</span>}>
              <span className="inline-flex h-5 w-5 cursor-help items-center justify-center text-zinc-500 hover:text-zinc-300">
                <InfoIcon width={14} height={14} />
              </span>
            </Tooltip>
          )}
        </div>

        {founder_name && (
          <p className="mt-0.5 truncate text-sm text-zinc-400">{founder_name}</p>
        )}

        <div className="mt-2">
          <SoloScoreBar score={solo_score} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
        <IconLink href={email ? `mailto:${email}` : null} label={email}>
          <MailIcon />
        </IconLink>
        <IconLink href={asUrl(instagram)} label="Instagram">
          <InstagramIcon />
        </IconLink>
        <IconLink href={asUrl(linkedin)} label="LinkedIn">
          <LinkedinIcon />
        </IconLink>
        <IconLink href={asUrl(facebook)} label="Facebook">
          <FacebookIcon />
        </IconLink>
        <IconLink href={phone ? `tel:${phone}` : null} label={phone}>
          <PhoneIcon />
        </IconLink>
        {contact_form_url && (
          <a
            href={asUrl(contact_form_url)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-zinc-800 px-2.5 text-xs font-medium text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100"
          >
            <FormIcon />
            Contact form
          </a>
        )}
      </div>
    </div>
  );
}
