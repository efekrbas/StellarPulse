"use client";

import React from "react";

interface CampaignStatus {
    totalRaised: number;
    targetAmount: number;
    deadline: number;
    deadlinePassed: boolean;
    targetReached: boolean;
    isFinalized: boolean;
}

interface CampaignInfoProps {
    status: CampaignStatus;
    currentLedger: number;
}

export default function CampaignInfo({
    status,
    currentLedger,
}: CampaignInfoProps) {
    const ledgersRemaining = Math.max(0, status.deadline - currentLedger);
    // Approximate 5 seconds per ledger
    const secondsRemaining = ledgersRemaining * 5;
    const daysRemaining = Math.floor(secondsRemaining / 86400);
    const hoursRemaining = Math.floor((secondsRemaining % 86400) / 3600);

    const getStatusBadge = () => {
        if (status.isFinalized) {
            return (
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-medium">
                    ✓ Completed
                </span>
            );
        }
        if (status.deadlinePassed) {
            if (status.targetReached) {
                return (
                    <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm font-medium">
                        🎉 Successful
                    </span>
                );
            }
            return (
                <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-sm font-medium">
                    ⏰ Expired
                </span>
            );
        }
        return (
            <span className="px-3 py-1 rounded-full bg-stellar-secondary/20 text-stellar-accent text-sm font-medium">
                🚀 Active
            </span>
        );
    };

    return (
        <div className="glass rounded-2xl p-6">
            <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-bold text-white">Campaign Details</h3>
                {getStatusBadge()}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-stellar-dark rounded-xl p-4">
                    <p className="text-gray-400 text-sm mb-1">Backers</p>
                    <p className="text-2xl font-bold text-white">—</p>
                </div>

                <div className="bg-stellar-dark rounded-xl p-4">
                    <p className="text-gray-400 text-sm mb-1">Time Remaining</p>
                    {status.deadlinePassed ? (
                        <p className="text-xl font-bold text-red-400">Ended</p>
                    ) : (
                        <p className="text-2xl font-bold text-stellar-accent">
                            {daysRemaining > 0
                                ? `${daysRemaining}d ${hoursRemaining}h`
                                : `${hoursRemaining}h ${Math.floor((secondsRemaining % 3600) / 60)}m`}
                        </p>
                    )}
                </div>

                <div className="bg-stellar-dark rounded-xl p-4">
                    <p className="text-gray-400 text-sm mb-1">Target</p>
                    <p className="text-xl font-bold text-white">
                        {status.targetAmount.toLocaleString()} XLM
                    </p>
                </div>

                <div className="bg-stellar-dark rounded-xl p-4">
                    <p className="text-gray-400 text-sm mb-1">Raised</p>
                    <p className="text-xl font-bold text-emerald-400">
                        {status.totalRaised.toLocaleString()} XLM
                    </p>
                </div>
            </div>

            {status.targetReached && !status.isFinalized && status.deadlinePassed && (
                <div className="mt-4 p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                    <p className="text-green-400 text-sm">
                        🎯 Campaign successful! The owner can now withdraw the funds.
                    </p>
                </div>
            )}

            {!status.targetReached && status.deadlinePassed && !status.isFinalized && (
                <div className="mt-4 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                    <p className="text-yellow-400 text-sm">
                        ⚠️ Campaign did not reach its goal. Contributors can claim refunds.
                    </p>
                </div>
            )}
        </div>
    );
}
