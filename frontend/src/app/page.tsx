"use client";

import { useState, useEffect } from "react";
import WalletButton from "@/components/WalletButton";
import ProgressBar from "@/components/ProgressBar";
import DonateCard from "@/components/DonateCard";
import CampaignInfo from "@/components/CampaignInfo";
import { useWallet } from "@/contexts/WalletContext";
import { sorobanService, CampaignStatus } from "@/services/soroban";

export default function Home() {
    const { isWalletConnected, publicKey } = useWallet();
    const [status, setStatus] = useState<CampaignStatus>({
        totalRaised: 2500,
        targetAmount: 10000,
        deadline: 0,
        deadlinePassed: false,
        targetReached: false,
        isFinalized: false,
    });
    const [currentLedger, setCurrentLedger] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [txHash, setTxHash] = useState<string | null>(null);

    useEffect(() => {
        loadCampaignData();
        const interval = setInterval(loadCampaignData, 10000);
        return () => clearInterval(interval);
    }, []);

    const loadCampaignData = async () => {
        try {
            const [campaignStatus, ledger] = await Promise.all([
                sorobanService.getCampaignStatus(),
                sorobanService.getCurrentLedger(),
            ]);
            setStatus(campaignStatus);
            setCurrentLedger(ledger);
        } catch (error) {
            console.error("Error loading campaign data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDonate = async (amount: number) => {
        if (!publicKey) return;

        try {
            const hash = await sorobanService.deposit(publicKey, amount);
            setTxHash(hash);

            // Wait for blockchain state to update, then refresh
            await new Promise(resolve => setTimeout(resolve, 3000));
            await loadCampaignData();
        } catch (error) {
            console.error("Donation failed:", error);
            throw error;
        }
    };

    return (
        <main className="min-h-screen bg-gradient-dark">
            {/* Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -left-32 w-96 h-96 bg-stellar-primary/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-stellar-accent/20 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-stellar-secondary/10 rounded-full blur-3xl"></div>
            </div>

            {/* Navigation */}
            <nav className="relative z-10 flex justify-between items-center px-6 lg:px-12 py-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-stellar flex items-center justify-center shadow-stellar">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <span className="text-xl font-bold text-white">StellarPulse</span>
                </div>
                <WalletButton />
            </nav>

            {/* Hero Section */}
            <section className="relative z-10 max-w-6xl mx-auto px-6 lg:px-12 py-12">
                <div className="text-center mb-12">
                    <h1 className="text-4xl lg:text-6xl font-bold text-white mb-4">
                        Decentralized
                        <span className="block bg-gradient-stellar bg-clip-text text-transparent">
                            Crowdfunding
                        </span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Fund innovative projects on the Stellar blockchain. Transparent, secure, and borderless.
                    </p>
                </div>

                {/* Campaign Card */}
                <div className="glass rounded-3xl p-8 mb-8 shadow-stellar">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
                        <div>
                            <span className="text-stellar-accent text-sm font-medium">Featured Campaign</span>
                            <h2 className="text-2xl lg:text-3xl font-bold text-white mt-1">
                                🚀 Community Innovation Fund
                            </h2>
                            <p className="text-gray-400 mt-2 max-w-xl">
                                Help us build the next generation of decentralized applications on Stellar.
                                Your contribution powers innovation.
                            </p>
                        </div>
                        <div className="flex-shrink-0">
                            <div className="w-24 h-24 rounded-2xl bg-gradient-stellar flex items-center justify-center shadow-glow">
                                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <ProgressBar
                        current={status.totalRaised}
                        target={status.targetAmount}
                    />
                </div>

                {/* Two Column Layout */}
                <div className="grid lg:grid-cols-2 gap-8">
                    <CampaignInfo status={status} currentLedger={currentLedger} />
                    <DonateCard
                        onDonate={handleDonate}
                        isDeadlinePassed={status.deadlinePassed}
                        isLoading={isLoading}
                    />
                </div>

                {/* Transaction Success */}
                {txHash && (
                    <div className="mt-8 p-4 glass rounded-xl border border-emerald-500/30">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-emerald-400 font-medium">Transaction Successful!</p>
                                <a
                                    href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-stellar-accent hover:underline"
                                >
                                    View on Stellar Expert →
                                </a>
                            </div>
                        </div>
                    </div>
                )}
            </section>

            {/* Footer */}
            <footer className="relative z-10 border-t border-stellar-border py-8 mt-12">
                <div className="max-w-6xl mx-auto px-6 lg:px-12 text-center">
                    <p className="text-gray-500 text-sm">
                        Built on <span className="text-stellar-accent">Stellar Soroban</span> •
                        Powered by <span className="text-stellar-secondary">Freighter Wallet</span>
                    </p>
                </div>
            </footer>
        </main>
    );
}
