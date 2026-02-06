"use client";

import React from "react";
import { useWallet } from "@/contexts/WalletContext";

export default function WalletButton() {
    const {
        isWalletConnected,
        isFreighterInstalled,
        publicKey,
        network,
        connectWallet,
        disconnectWallet,
        isConnecting,
        error,
    } = useWallet();

    const formatAddress = (address: string) => {
        return `${address.slice(0, 4)}...${address.slice(-4)}`;
    };

    if (isWalletConnected && publicKey) {
        return (
            <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                    <span className="text-sm font-medium text-white">
                        {formatAddress(publicKey)}
                    </span>
                    <span className="text-xs text-stellar-accent capitalize">
                        {network?.toLowerCase()}
                    </span>
                </div>
                <button
                    onClick={disconnectWallet}
                    className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30 transition-all duration-300 text-sm font-medium"
                >
                    Disconnect
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-end gap-2">
            <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="relative px-6 py-3 rounded-xl bg-gradient-stellar text-white font-semibold shadow-stellar hover:shadow-glow transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group"
            >
                <span className="relative z-10 flex items-center gap-2">
                    {isConnecting ? (
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
                            Connecting...
                        </>
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
                                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                                />
                            </svg>
                            Connect Freighter
                        </>
                    )}
                </span>
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            {!isFreighterInstalled && (
                <a
                    href="https://www.freighter.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-stellar-accent text-sm hover:underline"
                >
                    Install Freighter Wallet →
                </a>
            )}
        </div>
    );
}
