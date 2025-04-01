import { useState, useEffect } from "react";
import { formatCountdown } from "../utils/formatters";

export function useCountdown(startTime: Date, endTime: Date) {
  const [timeDisplay, setTimeDisplay] = useState<string>("");
  const [percentComplete, setPercentComplete] = useState<number>(0);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const totalDuration = endTime.getTime() - startTime.getTime();
      
      // Contest hasn't started yet
      if (now < startTime) {
        const remaining = startTime.getTime() - now.getTime();
        setTimeDisplay(formatCountdown(remaining));
        setPercentComplete(0);
      } 
      // Contest is ongoing
      else if (now >= startTime && now <= endTime) {
        const elapsed = now.getTime() - startTime.getTime();
        const remaining = endTime.getTime() - now.getTime();
        const percent = Math.round((elapsed / totalDuration) * 100);
        
        setTimeDisplay(formatCountdown(remaining));
        setPercentComplete(percent);
      } 
      // Contest has ended
      else {
        setTimeDisplay("Ended");
        setPercentComplete(100);
      }
    };

    // Initial update
    updateCountdown();
    
    // Update every second
    const interval = setInterval(updateCountdown, 1000);
    
    // Cleanup
    return () => clearInterval(interval);
  }, [startTime, endTime]);

  return { timeDisplay, percentComplete };
}
