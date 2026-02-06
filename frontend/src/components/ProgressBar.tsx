"use client";

import React from "react";

interface ProgressBarProps {
    current: number;
    target: number;
    symbol?: string;
}

export default function ProgressBar({
    current,
    target,
    symbol = "XLM",
}: ProgressBarProps) {
    const percentage = Math.min((current / target) * 100, 100);
    const isComplete = current >= target;

    return (
        <div className="w-full">
            <div className="flex justify-between items-end mb-3">
                <div>
                    <span className="text-3xl font-bold text-white">
                        {current.toLocaleString()}
                    </span>
                    <span className="text-xl text-gray-400 ml-2">{symbol}</span>
                </div>
                <div className="text-right">
                    <span className="text-lg text-gray-400">of </span>
                    <span className="text-lg font-semibold text-white">
                        {target.toLocaleString()} {symbol}
                    </span>
                </div>
            </div>

            <div className="relative h-4 bg-stellar-border rounded-full overflow-hidden">
                <div
                    className={`absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out ${isComplete
                            ? "bg-gradient-to-r from-green-500 to-emerald-400"
                            : "bg-gradient-stellar"
                        }`}
                    style={{ width: `${percentage}%` }}
                >
                    <div className="absolute inset-0 animate-shimmer"></div>
                </div>
            </div>

            <div className="flex justify-between items-center mt-3">
                <span
                    className={`text-lg font-bold ${isComplete ? "text-emerald-400" : "text-stellar-accent"
                        }`}
                >
                    {percentage.toFixed(1)}%
                </span>
                {isComplete && (
                    <span className="flex items-center gap-2 text-emerald-400 font-medium">
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
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        Goal Reached!
                    </span>
                )}
            </div>
        </div>
    );
}
