use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, panic_with_error, token,
    Address, Bytes, BytesN, Env,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum HTLCError {
    LockNotFound = 1,
    InvalidPreimage = 2,
    LockExpired = 3,
    AlreadyWithdrawn = 4,
    AlreadyRefunded = 5,
    NotYetExpired = 6,
    Unauthorized = 7,
}

#[contracttype]
#[derive(Clone)]
pub struct LockEntry {
    pub sender: Address,
    pub receiver: Address,
    pub token: Address,
    pub amount: i128,
    pub hashlock: BytesN<32>,
    pub timelock: u64,
    pub withdrawn: bool,
    pub refunded: bool,
}

#[contracttype]
pub enum DataKey {
    Lock(BytesN<32>),
}

#[contractevent(data_format = "vec")]
pub struct Locked {
    pub lock_id: BytesN<32>,
    pub amount: i128,
    pub timelock: u64,
}

#[contractevent(data_format = "vec")]
pub struct Withdrawn {
    pub lock_id: BytesN<32>,
    pub preimage: Bytes,
}

#[contractevent(data_format = "vec")]
pub struct Refunded {
    pub lock_id: BytesN<32>,
}

#[contract]
pub struct HTLCContract;

#[contractimpl]
impl HTLCContract {

    pub fn lock(
        env: Env,
        sender: Address,
        receiver: Address,
        token: Address,
        amount: i128,
        hashlock: BytesN<32>,
        timelock: u64,
    ) -> BytesN<32> {
        sender.require_auth();
        assert!(amount > 0, "amount must be positive");
        assert!(
            timelock > env.ledger().timestamp(),
            "timelock must be future"
        );

        // Transfer from sender to contract
        token::Client::new(&env, &token).transfer(
            &sender,
            &env.current_contract_address(),
            &amount,
        );

        // Deterministic lock ID from hashlock + timestamp
        let mut id_input = Bytes::new(&env);
        id_input.append(&Bytes::from_array(&env, &hashlock.to_array()));
        id_input.append(&Bytes::from_array(
            &env,
            &env.ledger().timestamp().to_be_bytes(),
        ));
        let lock_id: BytesN<32> = env.crypto().sha256(&id_input).into();

        env.storage().persistent().set(
            &DataKey::Lock(lock_id.clone()),
            &LockEntry {
                sender,
                receiver,
                token,
                amount,
                hashlock,
                timelock,
                withdrawn: false,
                refunded: false,
            },
        );

        // Emit event for relay to detect
        Locked {
            lock_id: lock_id.clone(),
            amount,
            timelock,
        }
        .publish(&env);

        lock_id
    }

    /// Withdraw by revealing the secret preimage.
    pub fn withdraw(env: Env, lock_id: BytesN<32>, preimage: Bytes) -> bool {
        let mut entry: LockEntry = env
            .storage()
            .persistent()
            .get(&DataKey::Lock(lock_id.clone()))
            .unwrap_or_else(|| panic_with_error!(&env, HTLCError::LockNotFound));

        if entry.withdrawn {
            panic_with_error!(&env, HTLCError::AlreadyWithdrawn)
        }
        if entry.refunded {
            panic_with_error!(&env, HTLCError::AlreadyRefunded)
        }

        let hash: BytesN<32> = env.crypto().sha256(&preimage).into();
        if hash != entry.hashlock {
            panic_with_error!(&env, HTLCError::InvalidPreimage)
        }

        if env.ledger().timestamp() >= entry.timelock {
            panic_with_error!(&env, HTLCError::LockExpired)
        }

        token::Client::new(&env, &entry.token).transfer(
            &env.current_contract_address(),
            &entry.receiver,
            &entry.amount,
        );

        entry.withdrawn = true;
        env.storage()
            .persistent()
            .set(&DataKey::Lock(lock_id.clone()), &entry);

        // Publish preimage — relay watches this to unlock source chain
        Withdrawn { lock_id, preimage }.publish(&env);

        true
    }

    /// Refund after timelock expiry.
    pub fn refund(env: Env, lock_id: BytesN<32>) -> bool {
        let mut entry: LockEntry = env
            .storage()
            .persistent()
            .get(&DataKey::Lock(lock_id.clone()))
            .unwrap_or_else(|| panic_with_error!(&env, HTLCError::LockNotFound));

        if entry.withdrawn {
            panic_with_error!(&env, HTLCError::AlreadyWithdrawn)
        }
        if entry.refunded {
            panic_with_error!(&env, HTLCError::AlreadyRefunded)
        }
        if env.ledger().timestamp() < entry.timelock {
            panic_with_error!(&env, HTLCError::NotYetExpired)
        }

        token::Client::new(&env, &entry.token).transfer(
            &env.current_contract_address(),
            &entry.sender,
            &entry.amount,
        );

        entry.refunded = true;
        env.storage()
            .persistent()
            .set(&DataKey::Lock(lock_id.clone()), &entry);
        Refunded { lock_id }.publish(&env);

        true
    }

    pub fn get_lock(env: Env, lock_id: BytesN<32>) -> LockEntry {
        env.storage()
            .persistent()
            .get(&DataKey::Lock(lock_id))
            .unwrap_or_else(|| panic_with_error!(&env, HTLCError::LockNotFound))
    }
}

mod test;
