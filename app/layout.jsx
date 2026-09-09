import "./globals.css";

export const metadata = {
  title: "Our Expenses",
  description: "Private household expense tracker",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
