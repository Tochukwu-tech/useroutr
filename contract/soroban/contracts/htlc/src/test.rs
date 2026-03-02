#![cfg(test)]

use super::*;
use soroban_sdk::testutils::{Address as _, Ledger};
use soroban_sdk::{token, Address, Bytes, BytesN, Env};

fn setup() -> (
    Env,
    Address,
    Address,
    Address,
    Address,
) {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set_timestamp(1_000);

    let contract_id = env.register(HTLCContract, ());

    let token_admin = Address::generate(&env);
    let stellar_asset = env.register_stellar_asset_contract_v2(token_admin);
    let token_address = stellar_asset.address();
    let asset_admin_client = token::StellarAssetClient::new(&env, &token_address);

    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);

    asset_admin_client.mint(&sender, &10_000);

    (env, contract_id, token_address, sender, receiver)
}

#[test]
fn lock_stores_entry_and_moves_funds() {
    let (env, contract_id, token_address, sender, receiver) = setup();
    let client = HTLCContractClient::new(&env, &contract_id);
    let token = token::TokenClient::new(&env, &token_address);
    let amount = 1_500_i128;
    let timelock = 2_000_u64;
    let preimage = Bytes::from_array(&env, &[1, 2, 3, 4]);
    let hashlock: BytesN<32> = env.crypto().sha256(&preimage).into();

    let lock_id = client.lock(&sender, &receiver, &token.address, &amount, &hashlock, &timelock);

    let entry = client.get_lock(&lock_id);
    assert!(entry.sender == sender);
    assert!(entry.receiver == receiver);
    assert!(entry.token == token.address);
    assert!(entry.amount == amount);
    assert!(entry.hashlock == hashlock);
    assert!(entry.timelock == timelock);
    assert!(!entry.withdrawn);
    assert!(!entry.refunded);

    assert_eq!(token.balance(&sender), 8_500);
    assert_eq!(token.balance(&contract_id), amount);
}

#[test]
fn withdraw_with_valid_preimage_transfers_to_receiver() {
    let (env, contract_id, token_address, sender, receiver) = setup();
    let client = HTLCContractClient::new(&env, &contract_id);
    let token = token::TokenClient::new(&env, &token_address);
    let amount = 900_i128;
    let timelock = 2_000_u64;
    let preimage = Bytes::from_array(&env, &[7, 7, 7, 7]);
    let hashlock: BytesN<32> = env.crypto().sha256(&preimage).into();

    let lock_id = client.lock(&sender, &receiver, &token.address, &amount, &hashlock, &timelock);
    let ok = client.withdraw(&lock_id, &preimage);
    assert!(ok);

    let entry = client.get_lock(&lock_id);
    assert!(entry.withdrawn);
    assert!(!entry.refunded);

    assert_eq!(token.balance(&contract_id), 0);
    assert_eq!(token.balance(&receiver), amount);
}

#[test]
fn refund_after_expiry_returns_funds_to_sender() {
    let (env, contract_id, token_address, sender, receiver) = setup();
    let client = HTLCContractClient::new(&env, &contract_id);
    let token = token::TokenClient::new(&env, &token_address);
    let amount = 1_200_i128;
    let timelock = 1_050_u64;
    let preimage = Bytes::from_array(&env, &[9, 9, 9]);
    let hashlock: BytesN<32> = env.crypto().sha256(&preimage).into();

    let lock_id = client.lock(&sender, &receiver, &token.address, &amount, &hashlock, &timelock);

    env.ledger().set_timestamp(1_051);
    let ok = client.refund(&lock_id);
    assert!(ok);

    let entry = client.get_lock(&lock_id);
    assert!(!entry.withdrawn);
    assert!(entry.refunded);

    assert_eq!(token.balance(&contract_id), 0);
    assert_eq!(token.balance(&sender), 10_000);
}

#[test]
#[should_panic(expected = "Error(Contract, #2)")]
fn withdraw_with_invalid_preimage_panics() {
    let (env, contract_id, token_address, sender, receiver) = setup();
    let client = HTLCContractClient::new(&env, &contract_id);
    let token = token::TokenClient::new(&env, &token_address);
    let amount = 500_i128;
    let timelock = 2_000_u64;
    let good_preimage = Bytes::from_array(&env, &[11, 22, 33]);
    let bad_preimage = Bytes::from_array(&env, &[44, 55, 66]);
    let hashlock: BytesN<32> = env.crypto().sha256(&good_preimage).into();

    let lock_id = client.lock(&sender, &receiver, &token.address, &amount, &hashlock, &timelock);
    client.withdraw(&lock_id, &bad_preimage);
}

#[test]
#[should_panic(expected = "Error(Contract, #3)")]
fn withdraw_after_expiry_panics() {
    let (env, contract_id, token_address, sender, receiver) = setup();
    let client = HTLCContractClient::new(&env, &contract_id);
    let token = token::TokenClient::new(&env, &token_address);
    let amount = 700_i128;
    let timelock = 1_010_u64;
    let preimage = Bytes::from_array(&env, &[77]);
    let hashlock: BytesN<32> = env.crypto().sha256(&preimage).into();

    let lock_id = client.lock(&sender, &receiver, &token.address, &amount, &hashlock, &timelock);
    env.ledger().set_timestamp(1_010);
    client.withdraw(&lock_id, &preimage);
}

#[test]
#[should_panic(expected = "Error(Contract, #6)")]
fn refund_before_expiry_panics() {
    let (env, contract_id, token_address, sender, receiver) = setup();
    let client = HTLCContractClient::new(&env, &contract_id);
    let token = token::TokenClient::new(&env, &token_address);
    let amount = 700_i128;
    let timelock = 2_000_u64;
    let preimage = Bytes::from_array(&env, &[88]);
    let hashlock: BytesN<32> = env.crypto().sha256(&preimage).into();

    let lock_id = client.lock(&sender, &receiver, &token.address, &amount, &hashlock, &timelock);
    env.ledger().set_timestamp(1_500);
    client.refund(&lock_id);
}

#[test]
#[should_panic(expected = "Error(Contract, #4)")]
fn second_withdraw_panics() {
    let (env, contract_id, token_address, sender, receiver) = setup();
    let client = HTLCContractClient::new(&env, &contract_id);
    let token = token::TokenClient::new(&env, &token_address);
    let amount = 333_i128;
    let timelock = 2_000_u64;
    let preimage = Bytes::from_array(&env, &[99]);
    let hashlock: BytesN<32> = env.crypto().sha256(&preimage).into();

    let lock_id = client.lock(&sender, &receiver, &token.address, &amount, &hashlock, &timelock);
    client.withdraw(&lock_id, &preimage);
    client.withdraw(&lock_id, &preimage);
}

#[test]
#[should_panic(expected = "Error(Contract, #4)")]
fn refund_after_withdraw_panics() {
    let (env, contract_id, token_address, sender, receiver) = setup();
    let client = HTLCContractClient::new(&env, &contract_id);
    let token = token::TokenClient::new(&env, &token_address);
    let amount = 444_i128;
    let timelock = 2_000_u64;
    let preimage = Bytes::from_array(&env, &[111]);
    let hashlock: BytesN<32> = env.crypto().sha256(&preimage).into();

    let lock_id = client.lock(&sender, &receiver, &token.address, &amount, &hashlock, &timelock);
    client.withdraw(&lock_id, &preimage);
    env.ledger().set_timestamp(2_100);
    client.refund(&lock_id);
}
