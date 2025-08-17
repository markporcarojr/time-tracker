export function convertToHours(ms: number) {
  // Calculate total minutes
  const totalMinutes = Math.floor(ms / (1000 * 60));

  // Calculate hours
  const hours = Math.floor(totalMinutes / 60);

  // Calculate remaining minutes
  const minutes = totalMinutes % 60;

  // Format hours and minutes with leading zeros if necessary
  const formattedHours = String(hours).padStart(2, "0");
  const formattedMinutes = String(minutes).padStart(2, "0");

  return `${formattedHours}h : ${formattedMinutes}m`;
}
