#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, token, Address, Env, Map, Symbol
};

/// Storage keys for persistent data
#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    /// Campaign owner address
    Owner,
    /// Target amount to be raised
    TargetAmount,
    /// Campaign deadline (Unix timestamp in ledger sequence)
    Deadline,
    /// Token contract address for deposits
    TokenAddress,
    /// Total amount currently raised
    TotalRaised,
    /// Map of contributor addresses to their deposit amounts
    Deposits,
    /// Whether the campaign has been finalized (funds withdrawn)
    IsFinalized,
}

/// Campaign status information
#[derive(Clone)]
#[contracttype]
pub struct CampaignStatus {
    /// Total amount raised so far
    pub total_raised: i128,
    /// Target amount for the campaign
    pub target_amount: i128,
    /// Campaign deadline (ledger sequence number)
    pub deadline: u32,
    /// Whether the target has been reached
    pub target_reached: bool,
    /// Whether the deadline has passed
    pub deadline_passed: bool,
    /// Whether funds have been withdrawn
    pub is_finalized: bool,
}

#[contract]
pub struct CrowdfundingContract;

#[contractimpl]
impl CrowdfundingContract {
    /// Initialize the crowdfunding campaign
    /// 
    /// # Arguments
    /// * `env` - The contract environment
    /// * `owner` - The address of the campaign owner who can withdraw funds
    /// * `token_address` - The address of the token contract (e.g., native XLM wrapper)
    /// * `target_amount` - The target amount to be raised
    /// * `deadline` - The deadline as a ledger sequence number
    /// 
    /// # Panics
    /// Panics if the contract is already initialized
    pub fn initialize(
        env: Env,
        owner: Address,
        token_address: Address,
        target_amount: i128,
        deadline: u32,
    ) {
        // Ensure contract is not already initialized
        if env.storage().instance().has(&DataKey::Owner) {
            panic!("Contract already initialized");
        }

        // Validate inputs
        if target_amount <= 0 {
            panic!("Target amount must be positive");
        }
        
        if deadline <= env.ledger().sequence() {
            panic!("Deadline must be in the future");
        }

        // Require authorization from the owner
        owner.require_auth();

        // Store campaign data
        env.storage().instance().set(&DataKey::Owner, &owner);
        env.storage().instance().set(&DataKey::TokenAddress, &token_address);
        env.storage().instance().set(&DataKey::TargetAmount, &target_amount);
        env.storage().instance().set(&DataKey::Deadline, &deadline);
        env.storage().instance().set(&DataKey::TotalRaised, &0_i128);
        env.storage().instance().set(&DataKey::IsFinalized, &false);
        
        // Initialize empty deposits map
        let deposits: Map<Address, i128> = Map::new(&env);
        env.storage().instance().set(&DataKey::Deposits, &deposits);

        // Extend instance TTL for long-term storage
        env.storage().instance().extend_ttl(100, 100_000);
    }

    /// Deposit tokens into the crowdfunding campaign
    /// 
    /// # Arguments
    /// * `env` - The contract environment
    /// * `contributor` - The address of the contributor
    /// * `amount` - The amount to deposit
    /// 
    /// # Panics
    /// Panics if the deadline has passed or campaign is finalized
    pub fn deposit(env: Env, contributor: Address, amount: i128) {
        // Require authorization from the contributor
        contributor.require_auth();

        // Validate amount
        if amount <= 0 {
            panic!("Deposit amount must be positive");
        }

        // Check if campaign is finalized
        let is_finalized: bool = env
            .storage()
            .instance()
            .get(&DataKey::IsFinalized)
            .unwrap_or(false);
        if is_finalized {
            panic!("Campaign is already finalized");
        }

        // Check if deadline has passed
        let deadline: u32 = env
            .storage()
            .instance()
            .get(&DataKey::Deadline)
            .expect("Contract not initialized");
        if env.ledger().sequence() >= deadline {
            panic!("Campaign deadline has passed");
        }

        // Get token contract address
        let token_address: Address = env
            .storage()
            .instance()
            .get(&DataKey::TokenAddress)
            .expect("Contract not initialized");

        // Transfer tokens from contributor to this contract
        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(&contributor, &env.current_contract_address(), &amount);

        // Update total raised
        let mut total_raised: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalRaised)
            .unwrap_or(0);
        total_raised += amount;
        env.storage().instance().set(&DataKey::TotalRaised, &total_raised);

        // Update contributor's deposit record
        let mut deposits: Map<Address, i128> = env
            .storage()
            .instance()
            .get(&DataKey::Deposits)
            .unwrap_or(Map::new(&env));
        
        let current_deposit = deposits.get(contributor.clone()).unwrap_or(0);
        deposits.set(contributor.clone(), current_deposit + amount);
        env.storage().instance().set(&DataKey::Deposits, &deposits);

        // Extend TTL
        env.storage().instance().extend_ttl(100, 100_000);

        // Emit deposit event
        env.events().publish(
            (Symbol::new(&env, "deposit"), contributor.clone()),
            (contributor, amount, total_raised),
        );
    }

    /// Withdraw funds from the campaign (only owner, after deadline, if target reached)
    /// 
    /// # Arguments
    /// * `env` - The contract environment
    /// 
    /// # Panics
    /// Panics if:
    /// - Caller is not the owner
    /// - Deadline has not passed
    /// - Target amount has not been reached
    /// - Funds have already been withdrawn
    pub fn withdraw(env: Env) {
        // Get owner and require authorization
        let owner: Address = env
            .storage()
            .instance()
            .get(&DataKey::Owner)
            .expect("Contract not initialized");
        owner.require_auth();

        // Check if campaign is already finalized
        let is_finalized: bool = env
            .storage()
            .instance()
            .get(&DataKey::IsFinalized)
            .unwrap_or(false);
        if is_finalized {
            panic!("Funds have already been withdrawn");
        }

        // Check if deadline has passed
        let deadline: u32 = env
            .storage()
            .instance()
            .get(&DataKey::Deadline)
            .expect("Contract not initialized");
        if env.ledger().sequence() < deadline {
            panic!("Campaign deadline has not passed yet");
        }

        // Check if target has been reached
        let target_amount: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TargetAmount)
            .expect("Contract not initialized");
        let total_raised: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalRaised)
            .unwrap_or(0);
        
        if total_raised < target_amount {
            panic!("Target amount has not been reached");
        }

        // Get token contract address
        let token_address: Address = env
            .storage()
            .instance()
            .get(&DataKey::TokenAddress)
            .expect("Contract not initialized");

        // Transfer all raised funds to the owner
        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(&env.current_contract_address(), &owner, &total_raised);

        // Mark campaign as finalized
        env.storage().instance().set(&DataKey::IsFinalized, &true);

        // Extend TTL
        env.storage().instance().extend_ttl(100, 100_000);

        // Emit withdrawal event
        env.events().publish(
            (Symbol::new(&env, "withdraw"), owner.clone()),
            (owner, total_raised),
        );
    }

    /// Get the current status of the crowdfunding campaign
    /// 
    /// # Arguments
    /// * `env` - The contract environment
    /// 
    /// # Returns
    /// A `CampaignStatus` struct containing all campaign information
    pub fn get_status(env: Env) -> CampaignStatus {
        let total_raised: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalRaised)
            .unwrap_or(0);
        
        let target_amount: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TargetAmount)
            .unwrap_or(0);
        
        let deadline: u32 = env
            .storage()
            .instance()
            .get(&DataKey::Deadline)
            .unwrap_or(0);
        
        let is_finalized: bool = env
            .storage()
            .instance()
            .get(&DataKey::IsFinalized)
            .unwrap_or(false);

        let current_sequence = env.ledger().sequence();

        CampaignStatus {
            total_raised,
            target_amount,
            deadline,
            target_reached: total_raised >= target_amount,
            deadline_passed: current_sequence >= deadline,
            is_finalized,
        }
    }

    /// Get the deposit amount for a specific contributor
    /// 
    /// # Arguments
    /// * `env` - The contract environment
    /// * `contributor` - The address of the contributor
    /// 
    /// # Returns
    /// The amount deposited by the contributor
    pub fn get_deposit(env: Env, contributor: Address) -> i128 {
        let deposits: Map<Address, i128> = env
            .storage()
            .instance()
            .get(&DataKey::Deposits)
            .unwrap_or(Map::new(&env));
        
        deposits.get(contributor).unwrap_or(0)
    }

    /// Refund a contributor if the campaign failed (deadline passed but target not reached)
    /// 
    /// # Arguments
    /// * `env` - The contract environment
    /// * `contributor` - The address of the contributor to refund
    /// 
    /// # Panics
    /// Panics if:
    /// - Deadline has not passed
    /// - Target has been reached (successful campaign)
    /// - Campaign is already finalized
    /// - Contributor has no deposits
    pub fn refund(env: Env, contributor: Address) {
        // Require authorization from the contributor
        contributor.require_auth();

        // Check if campaign is finalized
        let is_finalized: bool = env
            .storage()
            .instance()
            .get(&DataKey::IsFinalized)
            .unwrap_or(false);
        if is_finalized {
            panic!("Campaign is already finalized");
        }

        // Check if deadline has passed
        let deadline: u32 = env
            .storage()
            .instance()
            .get(&DataKey::Deadline)
            .expect("Contract not initialized");
        if env.ledger().sequence() < deadline {
            panic!("Campaign deadline has not passed yet");
        }

        // Check if target was NOT reached (refund only on failed campaigns)
        let target_amount: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TargetAmount)
            .expect("Contract not initialized");
        let total_raised: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalRaised)
            .unwrap_or(0);
        
        if total_raised >= target_amount {
            panic!("Campaign was successful, refunds not available");
        }

        // Get contributor's deposit
        let mut deposits: Map<Address, i128> = env
            .storage()
            .instance()
            .get(&DataKey::Deposits)
            .unwrap_or(Map::new(&env));
        
        let deposit_amount = deposits.get(contributor.clone()).unwrap_or(0);
        if deposit_amount <= 0 {
            panic!("No deposit found for this contributor");
        }

        // Get token contract address
        let token_address: Address = env
            .storage()
            .instance()
            .get(&DataKey::TokenAddress)
            .expect("Contract not initialized");

        // Transfer tokens back to contributor
        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(&env.current_contract_address(), &contributor, &deposit_amount);

        // Update deposits map - remove contributor's deposit
        deposits.set(contributor.clone(), 0);
        env.storage().instance().set(&DataKey::Deposits, &deposits);

        // Update total raised
        let new_total = total_raised - deposit_amount;
        env.storage().instance().set(&DataKey::TotalRaised, &new_total);

        // Extend TTL
        env.storage().instance().extend_ttl(100, 100_000);

        // Emit refund event
        env.events().publish(
            (Symbol::new(&env, "refund"), contributor.clone()),
            (contributor, deposit_amount),
        );
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::{Address as _, Ledger};

    #[test]
    fn test_initialize() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(CrowdfundingContract, ());
        let client = CrowdfundingContractClient::new(&env, &contract_id);

        let owner = Address::generate(&env);
        let token_address = Address::generate(&env);
        let target_amount: i128 = 1_000_000_000; // 100 XLM (7 decimals)
        let deadline: u32 = env.ledger().sequence() + 1000;

        client.initialize(&owner, &token_address, &target_amount, &deadline);

        let status = client.get_status();
        assert_eq!(status.total_raised, 0);
        assert_eq!(status.target_amount, target_amount);
        assert_eq!(status.deadline, deadline);
        assert!(!status.target_reached);
        assert!(!status.deadline_passed);
        assert!(!status.is_finalized);
    }

    #[test]
    #[should_panic(expected = "Contract already initialized")]
    fn test_double_initialize() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(CrowdfundingContract, ());
        let client = CrowdfundingContractClient::new(&env, &contract_id);

        let owner = Address::generate(&env);
        let token_address = Address::generate(&env);
        let target_amount: i128 = 1_000_000_000;
        let deadline: u32 = env.ledger().sequence() + 1000;

        client.initialize(&owner, &token_address, &target_amount, &deadline);
        // Second initialization should panic
        client.initialize(&owner, &token_address, &target_amount, &deadline);
    }

    #[test]
    fn test_get_deposit() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(CrowdfundingContract, ());
        let client = CrowdfundingContractClient::new(&env, &contract_id);

        let owner = Address::generate(&env);
        let token_address = Address::generate(&env);
        let contributor = Address::generate(&env);

        client.initialize(&owner, &token_address, &1_000_000_000, &(env.ledger().sequence() + 1000));

        // Check initial deposit is 0
        let deposit = client.get_deposit(&contributor);
        assert_eq!(deposit, 0);
    }
}
