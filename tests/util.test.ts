import { expect } from 'chai';
import {
  closestGreaterOrEqPackableTransactionAmount,
  closestGreaterOrEqPackableTransactionFee,
  closestPackableTransactionAmount,
  closestPackableTransactionFee,
  isTransactionAmountPackable,
  isTransactionFeePackable,
  TokenSet,
} from '../src/utils';
import { BigNumber } from 'ethers';

describe('utils', () => {
  describe('Packing and unpacking', function () {
    it('Test basic fee packing/unpacking', function () {
      let nums = [
        '0',
        '1',
        '2',
        '2047000',
        '1000000000000000000000000000000000',
      ];
      for (let num of nums) {
        const bigNumberAmount = BigNumber.from(num);
        expect(closestPackableTransactionFee(bigNumberAmount).toString()).equal(
          bigNumberAmount.toString(),
          'fee packing'
        );
        expect(
          closestGreaterOrEqPackableTransactionFee(bigNumberAmount).toString()
        ).equal(bigNumberAmount.toString(), 'fee packing up');
        expect(
          isTransactionAmountPackable(bigNumberAmount),
          'check amount pack'
        ).eq(true);
        expect(
          closestPackableTransactionAmount(bigNumberAmount).toString()
        ).equal(bigNumberAmount.toString(), 'amount packing');
        expect(
          closestGreaterOrEqPackableTransactionAmount(
            bigNumberAmount
          ).toString()
        ).equal(bigNumberAmount.toString(), 'amount packing up');
        expect(isTransactionFeePackable(bigNumberAmount), 'check fee pack').eq(
          true
        );
      }
      expect(closestPackableTransactionFee('2048').toString()).equal(
        '2047',
        'fee packing'
      );
      expect(closestGreaterOrEqPackableTransactionFee('2048').toString()).equal(
        '2050',
        'fee packing up'
      );
    });
  });

  describe('Token cache resolve', function () {
    it('Test token cache resolve', function () {
      const tokens = {
        RBTC: {
          address: '0x0000000000000000000000000000000000000000',
          id: 0,
          symbol: 'RBTC',
          decimals: 18,
        },
        'ERC20-1': {
          address: '0xEEeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
          id: 1,
          symbol: 'ERC20-1',
          decimals: 6,
        },
      };
      const tokenCache = new TokenSet(tokens);

      expect(tokenCache.resolveTokenId('RBTC')).eq(0, 'RBTC by id resolve');
      expect(
        tokenCache.resolveTokenId('0x0000000000000000000000000000000000000000')
      ).eq(0, 'RBTC by addr resolve');
      expect(tokenCache.resolveTokenId('ERC20-1')).eq(1, 'ERC20 by id resolve');
      expect(
        tokenCache.resolveTokenId('0xEEeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee')
      ).eq(1, 'ERC20 by addr resolve');
      expect(
        tokenCache.resolveTokenId('0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee')
      ).eq(1, 'ERC20 by addr resolve');
      expect(() =>
        tokenCache.resolveTokenId('0xdddddddddddddddddddddddddddddddddddddddd')
      ).to.throw();
      expect(() => tokenCache.resolveTokenId('ERC20-2')).to.throw();
    });
  });

  describe('formatToken', () => {
    const TOKEN_SYMBOL = 'TEST';
    const DECIMALS = 18;

    const TOKENS = {
      RBTC: {
        address: '0x0000000000000000000000000000000000000000',
        id: 0,
        symbol: TOKEN_SYMBOL,
        decimals: DECIMALS,
      },
    };

    let tokenSet: TokenSet;

    before(() => {
      tokenSet = new TokenSet(TOKENS);
    });

    it('Should format a value passed as string', () => {
      const initialNumber = '12345';
      const expectedFormattedToken = `0.${'0'.repeat(
        DECIMALS - initialNumber.length
      )}${initialNumber}`;

      const formattedToken = tokenSet.formatToken(TOKEN_SYMBOL, initialNumber);

      expect(formattedToken).to.equals(expectedFormattedToken);
    });

    it('Should format a value passed as BigNumber', () => {
      const initialNumber = '12345';
      const initialNumberBN = BigNumber.from(initialNumber);
      const expectedFormattedToken = `0.${'0'.repeat(
        DECIMALS - initialNumber.length
      )}${initialNumber}`;

      const formattedToken = tokenSet.formatToken(TOKEN_SYMBOL, initialNumberBN);

      expect(formattedToken).to.equals(expectedFormattedToken);
    });

    it('Should format a value passed as number', () => {
      const initialNumberString = '12345';
      const initialNumber = parseInt(initialNumberString);
      const expectedFormattedToken = `0.${'0'.repeat(
        DECIMALS - initialNumberString.length
      )}${initialNumberString}`;

      const formattedToken = tokenSet.formatToken(TOKEN_SYMBOL, initialNumber);

      expect(formattedToken).to.equals(expectedFormattedToken);
    });

    it('Should format large values', () => {
      const initialNumber = '123456789012345678901';
      const dotPosition = initialNumber.length - DECIMALS;
      const expectedFormattedToken = `${initialNumber.slice(
        0,
        dotPosition
      )}.${initialNumber.slice(dotPosition)}`;

      const formattedToken = tokenSet.formatToken(TOKEN_SYMBOL, initialNumber);

      expect(formattedToken).to.equals(expectedFormattedToken);
    });

    it('Should fail to format a value if it is not a number', () => {
      const notANumber = 'q12345q';

      expect(() => tokenSet.formatToken(TOKEN_SYMBOL, notANumber)).to.throw(
        'invalid BigNumber string'
      );
    });

    it('Should fail to format a value if it is a negative', () => {
      const negativeNumber = '-12345';

      expect(() => tokenSet.formatToken(TOKEN_SYMBOL, negativeNumber)).to.throw(
        'The amount is invalid'
      );
    });
  });
});
