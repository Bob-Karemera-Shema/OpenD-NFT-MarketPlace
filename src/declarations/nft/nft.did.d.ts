import type { Principal } from '@dfinity/principal';
export interface NFT {
  'getCanisterId' : () => Promise<Principal>,
  'getImage' : () => Promise<Array<number>>,
  'getName' : () => Promise<string>,
  'getOwner' : () => Promise<Principal>,
}
export interface _SERVICE extends NFT {}
