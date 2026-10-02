export function calculateListeningBand(score: number): number {
  if (score >= 39) return 9.0;
  if (score >= 37) return 8.5;
  if (score >= 35) return 8.0;
  if (score >= 32) return 7.5;
  if (score >= 30) return 7.0;
  if (score >= 26) return 6.5;
  if (score >= 23) return 6.0;
  if (score >= 18) return 5.5;
  if (score >= 16) return 5.0;
  if (score >= 13) return 4.5;
  if (score >= 10) return 4.0;
  return 3.5;
}

export function calculateReadingBand(score: number): number {
  if (score >= 39) return 9.0;
  if (score >= 37) return 8.5;
  if (score >= 35) return 8.0;
  if (score >= 33) return 7.5;
  if (score >= 30) return 7.0;
  if (score >= 27) return 6.5;
  if (score >= 23) return 6.0;
  if (score >= 19) return 5.5;
  if (score >= 15) return 5.0;
  if (score >= 13) return 4.5;
  if (score >= 10) return 4.0;
  return 3.5;
}

export function calculateOverallBand(listeningBand?: number, readingBand?: number): number {
  if (listeningBand !== undefined && readingBand !== undefined) {
    const rawAverage = (listeningBand + readingBand) / 2;
    // IELTS rounds to the nearest half band (.25 rounds up to .5, .75 rounds up to next whole band)
    const decimal = rawAverage % 1;
    const base = Math.floor(rawAverage);
    if (decimal < 0.25) return base;
    if (decimal < 0.75) return base + 0.5;
    return base + 1.0;
  }
  return listeningBand ?? readingBand ?? 0;
}
