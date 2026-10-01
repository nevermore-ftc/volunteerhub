import "./globals.css";

export const metadata = {
  title: "VolunteerHub — школьная биржа волонтёрства",
  description: "Единая школьная система волонтёрства",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body className="min-h-screen bg-slate-50 text-slate-800 antialiased">
        {children}
      </body>
    </html>
  );
}
