import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/contexts/WalletContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "StellarPulse Crowdfunding",
    description: "Decentralized crowdfunding on Stellar Soroban",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <WalletProvider>{children}</WalletProvider>
            </body>
        </html>
    );
}
