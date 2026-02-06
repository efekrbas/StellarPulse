"use client";

import React, { useState } from "react";
import { useWallet } from "@/contexts/WalletContext";

interface DonateCardProps {
    onDonate: (amount: number) => Promise<void>;
    isDeadlinePassed: boolean;
    isLoading: boolean;
}

export default function DonateCard({
    onDonate,
    isDeadlinePassed,
    isLoading,
}: DonateCardProps) {
    const { isWalletConnected } = useWallet();
    const [amount, setAmount] = useState<string>("");
    const [isDonating, setIsDonating] = useState(false);

    const presetAmounts = [10, 50, 100, 500];

    const handleDonate = async () => {
        const donationAmount = parseFloat(amount);
        if (isNaN(donationAmount) || donationAmount <= 0) return;

        setIsDonating(true);
        try {
            await onDonate(donationAmount);
            setAmount("");
        } catch (error) {
            console.error("Donation failed:", error);
        } finally {
            setIsDonating(false);
        }
    };

    const isDisabled =
        !isWalletConnected ||
        isDeadlinePassed ||
        isDonating ||
        isLoading ||
        !amount ||
        parseFloat(amount) <= 0;

    return (
        <div className="glass rounded-2xl p-6 animate-pulse-glow">
            <h3 className="text-xl font-bold text-white mb-4">Make a Donation</h3>

            {isDeadlinePassed && (
                <div className="mb-4 p-3 rounded-lg bg-yellow-500/20 border border-yellow-500/50">
                    <p className="text-yellow-400 text-sm font-medium">
                        ⏰ Campaign has ended. Donations are no longer accepted.
                    </p>
                </div>
            )}

            <div className="mb-4">
                <label className="block text-gray-400 text-sm mb-2">Amount (XLM)</label>
                <div className="relative">
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Enter amount"
                        disabled={isDeadlinePassed}
                        className="w-full px-4 py-3 bg-stellar-dark border border-stellar-border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-stellar-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                        XLM
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-6">
                {presetAmounts.map((preset) => (
                    <button
                        key={preset}
                        onClick={() => setAmount(preset.toString())}
                        disabled={isDeadlinePassed}
                        className="px-3 py-2 rounded-lg bg-stellar-dark border border-stellar-border text-gray-300 hover:border-stellar-secondary hover:text-white transition-all duration-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {preset} XLM
                    </button>
                ))}
            </div>

            <button
                onClick={handleDonate}
                disabled={isDisabled}
                className="w-full py-4 rounded-xl bg-gradient-stellar text-white font-bold text-lg shadow-stellar hover:shadow-glow transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {isDonating ? (
                    <>
                        <svg
                            className="animate-spin h-5 w-5"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            ></circle>
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                        </svg>
                        Processing...
                    </>
                ) : !isWalletConnected ? (
                    "Connect Wallet First"
                ) : (
                    <>
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        Donate Now
                    </>
                )}
            </button>

            {!isWalletConnected && (
                <p className="text-center text-gray-500 text-sm mt-3">
                    Please connect your wallet to make a donation
                </p>
            )}
        </div>
    );
}
