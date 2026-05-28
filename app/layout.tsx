import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const minorkSans = localFont({
	src: [
		{ path: "./fonts/Fontspring-DEMO-minorksans-regular.otf", weight: "400", style: "normal" },
		{ path: "./fonts/Fontspring-DEMO-minorksans-medium.otf", weight: "500", style: "normal" },
		{ path: "./fonts/Fontspring-DEMO-minorksans-semibold.otf", weight: "600", style: "normal" },
		{ path: "./fonts/Fontspring-DEMO-minorksans-bold.otf", weight: "700", style: "normal" },
		{ path: "./fonts/Fontspring-DEMO-minorksans-extrabold.otf", weight: "800", style: "normal" },
		{ path: "./fonts/Fontspring-DEMO-minorksans-black.otf", weight: "900", style: "normal" },
	],
	variable: "--font-minork-sans",
});

export const metadata: Metadata = {
	title: "SuperPix",
	description: "SuperPix Page Test",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className={`${minorkSans.variable} h-full antialiased`}>
			<body className="min-h-full flex flex-col font-sans">{children}</body>
		</html>
	);
}
