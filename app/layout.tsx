import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
	title: "Recta — Strategisk Rekryteringsförberedelse",
	description: "Eliminera dåliga rekryteringar genom AI-driven analys i 6 steg.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="sv">
			<body className="min-h-screen bg-white">
				{children}
			</body>
		</html>
	);
}
