"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface WalletContextType {
    isWalletConnected: boolean;
    isFreighterInstalled: boolean;
    publicKey: string | null;
    network: string | null;
    connectWallet: () => Promise<void>;
    disconnectWallet: () => void;
    isConnecting: boolean;
    error: string | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
    const [isWalletConnected, setIsWalletConnected] = useState(false);
    const [isFreighterInstalled, setIsFreighterInstalled] = useState(false);
    const [publicKey, setPublicKey] = useState<string | null>(null);
    const [network, setNetwork] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Check and auto-reconnect on mount
        const timer = setTimeout(checkAndReconnect, 500);
        return () => clearTimeout(timer);
    }, []);

    const checkAndReconnect = async () => {
        try {
            const freighterApi = await import("@stellar/freighter-api");

            // Check if installed
            const connResult = await freighterApi.isConnected();
            const installed = typeof connResult === "object" ? (connResult as any).isConnected : connResult;
            setIsFreighterInstalled(!!installed);

            if (!installed) return;

            // Check if already allowed (user previously connected)
            const allowedResult = await freighterApi.isAllowed();
            const allowed = typeof allowedResult === "object" ? (allowedResult as any).isAllowed : allowedResult;

            if (allowed) {
                // Auto-reconnect
                const pubKeyResult = await freighterApi.getPublicKey();
                let pubKey: string | null = null;

                if (typeof pubKeyResult === "string") {
                    pubKey = pubKeyResult;
                } else if (typeof pubKeyResult === "object" && pubKeyResult !== null) {
                    pubKey = (pubKeyResult as any).publicKey || null;
                }

                if (pubKey) {
                    setPublicKey(pubKey);

                    const netResult = await freighterApi.getNetwork();
                    let net = "TESTNET";
                    if (typeof netResult === "string") {
                        net = netResult;
                    } else if (typeof netResult === "object" && netResult !== null) {
                        net = (netResult as any).network || "TESTNET";
                    }

                    setNetwork(net);
                    setIsWalletConnected(true);
                    console.log("Auto-reconnected to wallet:", pubKey);
                }
            }
        } catch (err) {
            console.log("Auto-reconnect failed:", err);
        }
    };

    const connectWallet = async () => {
        setIsConnecting(true);
        setError(null);

        try {
            const freighterApi = await import("@stellar/freighter-api");

            const connResult = await freighterApi.isConnected();
            const installed = typeof connResult === "object" ? (connResult as any).isConnected : connResult;

            if (!installed) {
                setError("Freighter wallet is not installed. Please install it from freighter.app");
                setIsConnecting(false);
                return;
            }

            setIsFreighterInstalled(true);
            await freighterApi.setAllowed();

            const pubKeyResult = await freighterApi.getPublicKey();

            let pubKey: string | null = null;
            if (typeof pubKeyResult === "string") {
                pubKey = pubKeyResult;
            } else if (typeof pubKeyResult === "object" && pubKeyResult !== null) {
                pubKey = (pubKeyResult as any).publicKey || null;
                if ((pubKeyResult as any).error) {
                    setError((pubKeyResult as any).error);
                    setIsConnecting(false);
                    return;
                }
            }

            if (pubKey) {
                setPublicKey(pubKey);

                const netResult = await freighterApi.getNetwork();
                let net = "TESTNET";
                if (typeof netResult === "string") {
                    net = netResult;
                } else if (typeof netResult === "object" && netResult !== null) {
                    net = (netResult as any).network || "TESTNET";
                }

                setNetwork(net);
                setIsWalletConnected(true);
            } else {
                setError("Could not get public key from Freighter");
            }
        } catch (err: any) {
            console.error("Connection error:", err);
            setError(err?.message || "Failed to connect wallet");
        } finally {
            setIsConnecting(false);
        }
    };

    const disconnectWallet = () => {
        setPublicKey(null);
        setNetwork(null);
        setIsWalletConnected(false);
    };

    return (
        <WalletContext.Provider
            value={{
                isWalletConnected,
                isFreighterInstalled,
                publicKey,
                network,
                connectWallet,
                disconnectWallet,
                isConnecting,
                error,
            }}
        >
            {children}
        </WalletContext.Provider>
    );
}

export function useWallet() {
    const context = useContext(WalletContext);
    if (context === undefined) {
        throw new Error("useWallet must be used within a WalletProvider");
    }
    return context;
}
