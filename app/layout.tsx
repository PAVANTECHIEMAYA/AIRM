import "./globals.css";

export const metadata = {
  title: "Teamwork",
  description: "Project management app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
