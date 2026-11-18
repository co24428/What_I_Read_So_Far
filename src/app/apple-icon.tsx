import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Home-screen icon for iPhone ("Add to Home Screen"): three book spines in the status colours.
// Drawn with shapes only, so no font has to be downloaded at build time.
export default function AppleIcon() {
  const spine = (bg: string, h: number, tilt = 0) => (
    <div style={{ width: 30, height: h, background: bg, borderRadius: 5, marginLeft: 8, transform: `rotate(${tilt}deg)`, transformOrigin: "bottom left" }} />
  );
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 38, background: "#292524" }}>
        {spine("#0ea5e9", 96)}
        {spine("#10b981", 108)}
        {spine("#f59e0b", 88)}
        {spine("#e7e5e4", 100, 12)}
      </div>
    ),
    size,
  );
}
