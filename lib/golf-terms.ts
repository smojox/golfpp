export function getGolfTerm(score: number, par: number): string {
  const diff = score - par
  
  if (diff <= -4) return 'Condor'
  if (diff === -3) return 'Albatross'
  if (diff === -2) return 'Eagle'
  if (diff === -1) return 'Birdie'
  if (diff === 0) return 'Par'
  if (diff === 1) return 'Bogey'
  if (diff === 2) return 'Double Bogey'
  if (diff === 3) return 'Triple Bogey'
  if (diff >= 4) return `${diff} Over Par`
  
  return 'Par'
}

export function getGolfTermColor(score: number, par: number): string {
  const diff = score - par
  
  if (diff <= -2) return 'text-yellow-600' // Eagle or better
  if (diff === -1) return 'text-green-600' // Birdie
  if (diff === 0) return 'text-blue-600'   // Par
  if (diff === 1) return 'text-orange-600' // Bogey
  if (diff >= 2) return 'text-red-600'     // Double bogey or worse
  
  return 'text-gray-600'
}