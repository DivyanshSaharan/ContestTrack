/**
 * Format a date for display
 * @param dateString ISO date string
 * @param includeUTC Whether to include UTC in the formatted string
 * @returns Formatted date string
 */
export function formatDate(dateString: string | Date, includeUTC = false): string {
  const date = new Date(dateString);
  
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  
  let formatted = date.toLocaleString('en-US', options);
  
  if (includeUTC) {
    formatted += ' UTC';
  }
  
  return formatted;
}

/**
 * Format a duration in milliseconds to a human-readable string
 * @param durationMs Duration in milliseconds
 * @returns Human-readable duration string
 */
export function formatDuration(durationMs: number): string {
  // For durations longer than a day
  if (durationMs >= 86400000) { // 24 * 60 * 60 * 1000
    const days = Math.floor(durationMs / 86400000);
    const hours = Math.floor((durationMs % 86400000) / 3600000);
    
    if (hours === 0) {
      return `${days} day${days !== 1 ? 's' : ''}`;
    }
    return `${days} day${days !== 1 ? 's' : ''}, ${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  
  // For durations longer than an hour
  if (durationMs >= 3600000) { // 60 * 60 * 1000
    const hours = Math.floor(durationMs / 3600000);
    const minutes = Math.floor((durationMs % 3600000) / 60000);
    
    if (minutes === 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    return `${hours}h ${minutes}m`;
  }
  
  // For durations less than an hour
  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.floor((durationMs % 60000) / 1000);
  
  if (minutes === 0) {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }
  
  return `${minutes}m ${seconds}s`;
}

/**
 * Format time for a countdown display
 * @param timeMs Time in milliseconds
 * @returns Formatted countdown string
 */
export function formatCountdown(timeMs: number): string {
  if (timeMs <= 0) return "00:00:00";
  
  // Calculate hours, minutes, seconds
  const hours = Math.floor(timeMs / (1000 * 60 * 60));
  const minutes = Math.floor((timeMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeMs % (1000 * 60)) / 1000);
  
  // Format with leading zeros
  const formattedHours = hours.toString().padStart(2, '0');
  const formattedMinutes = minutes.toString().padStart(2, '0');
  const formattedSeconds = seconds.toString().padStart(2, '0');
  
  return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}

/**
 * Format time elapsed since a date
 * @param dateString ISO date string
 * @returns Human-readable elapsed time string
 */
export function formatTimeElapsed(dateString: string | Date): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    }
    
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  }
  
  if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  }
  
  // For more than a week, return a date
  return formatDate(dateString);
}
