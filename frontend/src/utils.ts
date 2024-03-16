export const lightenColor = (hex: string, percent: number) => {
  percent = Math.min(100, Math.max(0, percent));

  // Convert the hex color to RGB
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  // Calculate the amount to lighten each channel
  const amount = Math.round(2.55 * percent);

  // Calculate the new RGB values
  const newR = Math.min(255, r + amount);
  const newG = Math.min(255, g + amount);
  const newB = Math.min(255, b + amount);

  // Convert the new RGB values back to hex
  const newHex = `#${(newR < 16 ? "0" : "") + newR.toString(16)}${
    (newG < 16 ? "0" : "") + newG.toString(16)
  }${(newB < 16 ? "0" : "") + newB.toString(16)}`;

  return newHex;
};

export function getCurrentYear(): number {
  return new Date().getFullYear();
}
