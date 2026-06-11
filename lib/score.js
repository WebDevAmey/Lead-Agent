export function scoreUS(signals, metaCurrency) {
  let pts = 0;
  const reasons = [];

  // Trust meta.json currency above everything
  if (metaCurrency === 'USD') {
    pts += 20; reasons.push('meta currency USD (+20)');
  } else if (metaCurrency === 'GBP') {
    pts -= 15; reasons.push('meta currency GBP (-15)');
  } else if (metaCurrency === 'EUR') {
    pts -= 15; reasons.push('meta currency EUR (-15)');
  } else {
    // Only use page-scraped currency if meta.json gave us nothing
    if (signals.currencies.usd && !signals.currencies.gbp && !signals.currencies.eur) {
      pts += 10; reasons.push('page USD only (+10)');
    } else if (signals.currencies.gbp) {
      pts -= 10; reasons.push('page GBP (-10)');
    } else if (signals.currencies.eur) {
      pts -= 10; reasons.push('page EUR (-10)');
    }
  }

  if (signals.usAddress) {
    pts += 10; reasons.push('US address format (+10)');
  }
  if (signals.usPhone) {
    pts += 8; reasons.push('US phone format (+8)');
  }

  const isUS = pts >= 18;
  return { isUS, usPts: pts, usReason: reasons.join('; ') || 'no US signals' };
}

export function scoreSolo(signals) {
  let pts = 0;
  const reasons = [];

  const total = signals.singularCount + signals.pluralCount;
  if (total >= 5) {
    const ratio = signals.singularCount / total;
    if (ratio >= 0.6) {
      pts += 22; reasons.push(`singular ratio ${ratio.toFixed(2)} >= 0.6 (+22)`);
    } else if (ratio >= 0.4) {
      pts += 10; reasons.push(`singular ratio ${ratio.toFixed(2)} 0.4–0.6 (+10)`);
    } else {
      reasons.push(`singular ratio ${ratio.toFixed(2)} too low (+0)`);
    }
  } else {
    reasons.push('too few pronouns to score ratio');
  }

  const makerPts = Math.min(signals.makerWords * 5, 14);
  if (makerPts > 0) {
    pts += makerPts; reasons.push(`maker words ×${signals.makerWords} (+${makerPts})`);
  }

  if (signals.founderName && !signals.hasCofounder) {
    pts += 10; reasons.push('single founder named, no co-founder (+10)');
  }

  if (signals.hasCofounder) {
    pts -= 12; reasons.push('co-founder mentioned (-12)');
  }
  if (signals.hasTeamPage) {
    pts -= 10; reasons.push('team page found (-10)');
  }

  const solo = Math.max(0, Math.min(50, pts));
  return { solo, soloReason: reasons.join('; ') };
}

export function finalScore({ isUS, usPts, solo, signals, productCount }) {
  let pts = 0;

  if (isUS) {
    pts += 30;
  } else {
    pts += Math.round(usPts * 0.6);
  }

  pts += solo;

  if (signals.email) pts += 8;

  if (productCount <= 30) pts += 8;
  else if (productCount <= 100) pts += 3;
  else if (productCount > 400) pts -= 8;

  return Math.max(0, Math.min(100, pts));
}