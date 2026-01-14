export const metadata = {
  title: "Telegram Bot",
  description: "Telegram GPT Bot running on Vercel",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
