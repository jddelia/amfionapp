import "./globals.css";
import { Space_Grotesk, Newsreader } from "next/font/google";

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display"
});

const serif = Newsreader({
  subsets: ["latin"],
  variable: "--font-serif"
});

export const metadata = {
  title: "Amfion Booking Portal",
  description: "White-label AI booking portal"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${serif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
