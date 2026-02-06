import * as StellarSdk from "@stellar/stellar-sdk";

// Soroban RPC endpoint
const SOROBAN_RPC_URL = "https://soroban-testnet.stellar.org";
const NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET;

// Contract ID - Replace with your deployed contract ID
export const CONTRACT_ID = "CBL7JXM2XHCHYYQEF2QKB4RS2O24CWXZ454Y7FRIXENVHQJIM4DUFZRT";

// XLM Native Token SAC Wrapper on Testnet
export const XLM_TOKEN_ADDRESS = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";

export interface CampaignStatus {
    totalRaised: number;
    targetAmount: number;
    deadline: number;
    deadlinePassed: boolean;
    targetReached: boolean;
    isFinalized: boolean;
}

class SorobanService {
    private server: StellarSdk.SorobanRpc.Server;

    constructor() {
        this.server = new StellarSdk.SorobanRpc.Server(SOROBAN_RPC_URL);
    }

    /**
     * Get the current campaign status from the contract
     */
    async getCampaignStatus(): Promise<CampaignStatus> {
        try {
            const contract = new StellarSdk.Contract(CONTRACT_ID);

            const tx = new StellarSdk.TransactionBuilder(
                await this.getSourceAccount(),
                {
                    fee: "100000",
                    networkPassphrase: NETWORK_PASSPHRASE,
                }
            )
                .addOperation(contract.call("get_status"))
                .setTimeout(30)
                .build();

            const response = await this.server.simulateTransaction(tx);

            if (StellarSdk.SorobanRpc.Api.isSimulationSuccess(response) && response.result) {
                const result = response.result.retval;
                return this.parseCampaignStatus(result);
            }

            throw new Error("Failed to get campaign status");
        } catch (error) {
            console.error("Error getting campaign status:", error);
            // Return default values for demo
            return {
                totalRaised: 0,
                targetAmount: 10000,
                deadline: 0,
                deadlinePassed: false,
                targetReached: false,
                isFinalized: false,
            };
        }
    }

    /**
     * Make a deposit to the crowdfunding campaign
     */
    async deposit(
        contributorPublicKey: string,
        amount: number
    ): Promise<string> {
        try {
            // Dynamic import Freighter API
            const freighterApi = await import("@stellar/freighter-api");

            const contract = new StellarSdk.Contract(CONTRACT_ID);
            const contributor = new StellarSdk.Address(contributorPublicKey);

            // Convert XLM to stroops (7 decimals for Stellar)
            const amountInStroops = BigInt(Math.floor(amount * 10_000_000));

            const sourceAccount = await this.server.getAccount(contributorPublicKey);

            const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
                fee: "100000",
                networkPassphrase: NETWORK_PASSPHRASE,
            })
                .addOperation(
                    contract.call(
                        "deposit",
                        contributor.toScVal(),
                        StellarSdk.nativeToScVal(amountInStroops, { type: "i128" })
                    )
                )
                .setTimeout(300)
                .build();

            // Simulate to get the prepared transaction
            const simulated = await this.server.simulateTransaction(tx);

            if (!StellarSdk.SorobanRpc.Api.isSimulationSuccess(simulated)) {
                console.error("Simulation failed:", simulated);
                throw new Error("Transaction simulation failed");
            }

            const preparedTx = StellarSdk.SorobanRpc.assembleTransaction(
                tx,
                simulated
            ).build();

            // Sign with Freighter - handle both old and new API
            let signedXdr: string;

            if (freighterApi.signTransaction) {
                const signResult = await freighterApi.signTransaction(preparedTx.toXDR(), {
                    networkPassphrase: NETWORK_PASSPHRASE,
                });

                // Handle both response formats
                if (typeof signResult === "string") {
                    signedXdr = signResult;
                } else if (signResult.signedTxXdr) {
                    signedXdr = signResult.signedTxXdr;
                } else if (signResult.error) {
                    throw new Error(signResult.error);
                } else {
                    throw new Error("Failed to sign transaction");
                }
            } else {
                throw new Error("Freighter signTransaction not available");
            }

            // Submit the transaction
            const txEnvelope = StellarSdk.TransactionBuilder.fromXDR(
                signedXdr,
                NETWORK_PASSPHRASE
            );

            const sendResponse = await this.server.sendTransaction(txEnvelope);

            if (sendResponse.status === "ERROR") {
                throw new Error("Failed to submit transaction");
            }

            // Wait for confirmation
            const txHash = sendResponse.hash;
            let getResponse = await this.server.getTransaction(txHash);

            while (getResponse.status === "NOT_FOUND") {
                await new Promise((resolve) => setTimeout(resolve, 1000));
                getResponse = await this.server.getTransaction(txHash);
            }

            if (getResponse.status === "SUCCESS") {
                return txHash;
            }

            throw new Error("Transaction failed");
        } catch (error) {
            console.error("Error making deposit:", error);
            throw error;
        }
    }

    /**
     * Get the current ledger sequence number
     */
    async getCurrentLedger(): Promise<number> {
        try {
            const health = await this.server.getHealth();
            return health.latestLedger;
        } catch {
            return 0;
        }
    }

    private async getSourceAccount(): Promise<StellarSdk.Account> {
        // Use a random public key for simulation (read-only operations)
        return new StellarSdk.Account(
            "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
            "0"
        );
    }

    private parseCampaignStatus(scVal: StellarSdk.xdr.ScVal): CampaignStatus {
        try {
            const obj = StellarSdk.scValToNative(scVal);
            return {
                totalRaised: Number(obj.total_raised) / 10_000_000 || 0,
                targetAmount: Number(obj.target_amount) / 10_000_000 || 10000,
                deadline: Number(obj.deadline) || 0,
                deadlinePassed: obj.deadline_passed || false,
                targetReached: obj.target_reached || false,
                isFinalized: obj.is_finalized || false,
            };
        } catch {
            return {
                totalRaised: 0,
                targetAmount: 10000,
                deadline: 0,
                deadlinePassed: false,
                targetReached: false,
                isFinalized: false,
            };
        }
    }
}

export const sorobanService = new SorobanService();
