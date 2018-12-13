import { ADDRESS_LENGTH, P2SH_ADDRESS_TYPE, HASH_LENGTH } from '../common';
import { AddressSerializer } from './serialize/address';
import { Address, Hash, AddressHash } from './crypto';
import { VarIntSerializer } from './serialize';

/***
  * ### CoinOwner
 */
export interface ICoinOwnerData {
  address?: Address;
  fromHash?: Hash;
  fromIndex?: number;
}

/**
 * Class to handle the protocol CoinOwner type
 */
export class CoinOwnerUtils {

  /**
   * Parse a coinOwner hash
   * https://github.com/nuls-io/nuls/blob/master/core-module/kernel/src/main/java/io/nuls/kernel/model/Coin.java#L197
   * https://github.com/nuls-io/nuls/blob/d8227554ce35dfd7557ed489fb5949b528a738bf/utxo-accounts-module/base/utxo-accounts-base/src/main/java/io/nuls/utxo/accounts/util/UtxoAccountsUtil.java#L30
   * @param coinOwner CoinOwner hash to be parsed
   * @param offset CoinOwner data parsed from CoinOwner hash
   */
  public static parse(coinOwner: AddressHash): ICoinOwnerData {

    if (coinOwner.length === ADDRESS_LENGTH) {

      const { data: address } = AddressSerializer.read(coinOwner, 0);

      return {
        address
      };

    } else {

      if (coinOwner.length >= HASH_LENGTH) {

        const fromHash: Hash = coinOwner.slice(0, HASH_LENGTH).toString('hex');
        const { data: fromIndex } = VarIntSerializer.read(coinOwner.slice(HASH_LENGTH, coinOwner.length), 0);

        return {
          fromHash,
          fromIndex
        }

      } else {

        throw new Error('P2SH_ADDRESS not implemented');

      }

    }

  }

  /**
   * Calculate the CoinOwner hash
   * @param data CoinOwner data to create the owner hash
   * @returns CoinOwnerHash
   */
  public static create(data: ICoinOwnerData): AddressHash {

    let owner: Buffer;

    if (data.fromHash && data.fromIndex) {

      const fromIndex: Buffer = Buffer.alloc(VarIntSerializer.size(data.fromIndex));
      VarIntSerializer.write(data.fromIndex, fromIndex, 0);

      owner = Buffer.concat([
        Buffer.from(data.fromHash, 'hex'),
        fromIndex
      ]);

    } else if (data.address) {

      owner = Buffer.alloc(ADDRESS_LENGTH);
      AddressSerializer.write(data.address, owner, 0);

      // https://github.com/nuls-io/nuls/blob/274204b748ed72fdac150637ee758037d64c7ce5/core-module/kernel/src/main/java/io/nuls/kernel/model/CoinData.java#L155
      if (owner[2] === P2SH_ADDRESS_TYPE) {

        throw new Error('P2SH_ADDRESS not implemented');

      }

    } else {

      throw new Error('Error writing coinOwner');

    }

    return owner;

  }

}