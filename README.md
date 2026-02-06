# StellarPulse - Decentralized Crowdfunding Platform

<div align="center">

![Stellar](https://img.shields.io/badge/Stellar-Soroban-7B61FF?style=for-the-badge&logo=stellar&logoColor=white)
![Rust](https://img.shields.io/badge/Rust-000000?style=for-the-badge&logo=rust&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

A fully decentralized crowdfunding platform built on **Stellar Soroban** smart contracts with a modern **Next.js** frontend and **Freighter Wallet** integration.

[Features](#-features) • [Tech Stack](#-tech-stack) • [Installation](#-installation) • [Deployment](#-deployment) • [Testing](#-testing-on-testnet)

</div>

---

## 📋 Overview

StellarPulse enables transparent, trustless crowdfunding campaigns on the Stellar blockchain. Campaign owners can set funding goals and deadlines, while contributors can donate XLM tokens with full visibility into campaign progress. Smart contract logic ensures funds are only released when goals are met.

### Key Capabilities

- **Trustless Fund Management**: Smart contract holds all funds until conditions are met
- **Automatic Refunds**: Contributors can reclaim funds if campaigns fail to reach their goals
- **Real-time Progress Tracking**: Live updates on funding status and time remaining
- **Secure Wallet Integration**: Seamless connection with Freighter browser wallet

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Initialize Campaign** | Set target amount, deadline, and token for contributions |
| **Deposit Funds** | Contributors send tokens securely via smart contract |
| **Withdraw Funds** | Campaign owner withdraws only after deadline + goal reached |
| **Refund Mechanism** | Automatic refunds if campaign fails to meet target |
| **Status Tracking** | Real-time visibility into raised amount and deadline |
| **Progress Bar UI** | Visual representation of funding progress |
| **Wallet Connection** | One-click Freighter wallet integration |

---

## 🛠 Tech Stack

### Smart Contract (Backend)
| Technology | Purpose |
|------------|---------|
| **Rust** | Smart contract programming language |
| **Soroban SDK** | Stellar's smart contract framework |
| **stellar-cli** | Deployment and interaction tool |

### Frontend
| Technology | Purpose |
|------------|---------|
| **Next.js 14** | React framework with App Router |
| **TypeScript** | Type-safe JavaScript |
| **Tailwind CSS** | Utility-first CSS framework |
| **@stellar/stellar-sdk** | Blockchain interaction |
| **@stellar/freighter-api** | Wallet connection |

---

## 📁 Project Structure

```
StellarPulse/
├── src/
│   └── lib.rs                 # Soroban smart contract
├── Cargo.toml                 # Rust dependencies
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx       # Main crowdfunding page
│   │   │   ├── layout.tsx     # Root layout with providers
│   │   │   └── globals.css    # Global styles
│   │   ├── components/
│   │   │   ├── WalletButton.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   ├── DonateCard.tsx
│   │   │   └── CampaignInfo.tsx
│   │   ├── contexts/
│   │   │   └── WalletContext.tsx
│   │   └── services/
│   │       └── soroban.ts     # Contract interaction service
│   ├── package.json
│   ├── tailwind.config.ts
│   └── tsconfig.json
└── README.md
```

---

## 📦 Installation

### Prerequisites

- [Rust](https://www.rust-lang.org/tools/install) (1.70+)
- [Node.js](https://nodejs.org/) (18+)
- [Stellar CLI](https://developers.stellar.org/docs/tools/developer-tools/cli/install-cli)
- [Freighter Wallet](https://www.freighter.app/) browser extension

### 1. Clone the Repository

```bash
git clone https://github.com/efekrbas/StellarPulse.git
cd StellarPulse
```

### 2. Install Stellar CLI

```bash
cargo install --locked stellar-cli
```

### 3. Add WebAssembly Target

```bash
rustup target add wasm32v1-none
```

### 4. Build the Smart Contract

```bash
stellar contract build
```

### 5. Install Frontend Dependencies

```bash
cd frontend
npm install
```

---

## 🚀 Deployment

### Step 1: Configure Stellar CLI for Testnet

```bash
stellar network add testnet --rpc-url https://soroban-testnet.stellar.org --network-passphrase "Test SDF Network ; September 2015"
```

### Step 2: Generate a New Keypair

```bash
stellar keys generate deployer --network testnet
```

> **Note:** If you get an error "identity already exists", you can skip this step or use a different name like `deployer2`.

### Step 3: Fund the Account

```bash
stellar keys fund deployer --network testnet
```

### Step 4: Deploy the Contract

```bash
stellar contract deploy --wasm target/wasm32v1-none/release/crowdfunding.wasm --source deployer --network testnet
```

Save the returned **Contract ID** for the next steps.

### Step 5: Initialize the Campaign

```bash
# Get your public key
stellar keys address deployer

# Initialize the campaign (replace <CONTRACT_ID> and <YOUR_PUBLIC_KEY>)
stellar contract invoke --id <CONTRACT_ID> --source deployer --network testnet -- initialize --owner <YOUR_PUBLIC_KEY> --token_address CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC --target_amount 10000000000 --deadline 5000000
```

### Step 6: Configure Frontend

Edit `frontend/src/services/soroban.ts`:

```typescript
export const CONTRACT_ID = "YOUR_CONTRACT_ID_HERE";
```

### Step 7: Run the Frontend

```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing on Testnet

### Smart Contract Unit Tests

```bash
cargo test
```

### Manual Contract Testing

#### Check Campaign Status

```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --network testnet \
  -- \
  get_status
```

#### Make a Test Deposit

```bash
# Generate a contributor account
stellar keys generate contributor --network testnet
stellar keys fund contributor --network testnet

# Deposit 10 XLM (100000000 stroops)
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source contributor \
  --network testnet \
  -- \
  deposit \
  --contributor <CONTRIBUTOR_PUBLIC_KEY> \
  --amount 100000000
```

#### Check Deposit Balance

```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --network testnet \
  -- \
  get_deposit \
  --contributor <CONTRIBUTOR_PUBLIC_KEY>
```

### Frontend Testing

1. Install the [Freighter Wallet](https://www.freighter.app/) browser extension
2. Create or import a wallet
3. Switch to **Testnet** in Freighter settings
4. Fund your wallet using the [Stellar Testnet Friendbot](https://laboratory.stellar.org/#account-creator?network=test)
5. Connect your wallet on the StellarPulse frontend
6. Make a test donation

---

## 📖 Smart Contract API

### Functions

| Function | Parameters | Description |
|----------|------------|-------------|
| `initialize` | `owner`, `token_address`, `target_amount`, `deadline` | Create a new campaign |
| `deposit` | `contributor`, `amount` | Contribute to the campaign |
| `withdraw` | — | Owner withdraws funds (post-deadline, goal reached) |
| `refund` | `contributor` | Contributor reclaims funds (failed campaign) |
| `get_status` | — | Returns campaign status struct |
| `get_deposit` | `contributor` | Returns contributor's deposit amount |

### Campaign States

| State | Condition | Available Actions |
|-------|-----------|-------------------|
| **Active** | Before deadline | `deposit` |
| **Successful** | Deadline passed + target reached | `withdraw` (owner only) |
| **Failed** | Deadline passed + target not reached | `refund` (contributors) |
| **Finalized** | Funds withdrawn | None |

---

## 🔐 Security Considerations

- All funds are held by the smart contract, not a centralized party
- Withdrawals require cryptographic authorization from the campaign owner
- Refunds can only be claimed by the original contributor
- Contract state is immutable once initialized
- All transactions are publicly verifiable on the Stellar blockchain

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🔗 Resources

- [Stellar Developer Documentation](https://developers.stellar.org/)
- [Soroban Smart Contracts](https://soroban.stellar.org/)
- [Freighter Wallet](https://www.freighter.app/)
- [Stellar Laboratory](https://laboratory.stellar.org/)
- [Stellar Expert Block Explorer](https://stellar.expert/)

---

<div align="center">

**Built with 💜 on Stellar Soroban**

</div>
