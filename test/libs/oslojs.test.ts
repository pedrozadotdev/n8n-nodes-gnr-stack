import { base32 as base32Reference } from '@scure/base';
import {
	encodeHexLowerCase,
	encodeBase32LowerCaseNoPadding,
	sha256,
} from '../../nodes/HttpForwardAuth/oslojs';
import { SHA256 } from '../../nodes/HttpForwardAuth/oslojs/sha2/sha256';
import { bigEndian, rotr32 } from '../../nodes/HttpForwardAuth/oslojs/binary';

describe('Oslojs', () => {
	it('Should encode to HexLowerCase', () => {
		const cases = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
		for (const length of cases) {
			const data = crypto.getRandomValues(new Uint8Array(length));
			expect(encodeHexLowerCase(data)).toBe(Buffer.from(data).toString('hex'));
		}
	});

	it('Should encode to Base32LowerCaseNoPadding', () => {
		for (let i = 1; i <= 100; i++) {
			const bytes = new Uint8Array(i);
			crypto.getRandomValues(bytes);
			expect(encodeBase32LowerCaseNoPadding(bytes)).toBe(
				base32Reference.encode(bytes).toLowerCase().replaceAll('=', ''),
			);
		}
	});

	it('Should hash to SHA256', () => {
		const randomValues = crypto.getRandomValues(new Uint8Array(5 * 100));
		for (let i = 0; i < randomValues.byteLength / 5; i++) {
			const expected = sha256(randomValues.slice(0, i * 5));
			const hash = new SHA256();
			for (let j = 0; j < i; j++) {
				hash.update(randomValues.slice(j * 5, (j + 1) * 5));
			}
			expect(hash.digest()).toStrictEqual(expected);
		}
	});

	it('Should use rotr32', () => {
		expect(rotr32(0b00000000000000000000000000001111, 2)).toBe(0b11000000000000000000000000000011);
	});

	describe('Should use bigEndian.putUint32', () => {
		it('sets correct value', () => {
			const data = new Uint8Array(4);
			bigEndian.putUint32(data, 16909060, 0);
			expect(data).toStrictEqual(new Uint8Array([1, 2, 3, 4]));
		});
		it('excessive bytes', () => {
			const data = new Uint8Array(5);
			bigEndian.putUint32(data, 16909060, 0);
			expect(data).toStrictEqual(new Uint8Array([1, 2, 3, 4, 0]));
		});
		it('offset', () => {
			const data = new Uint8Array(5);
			bigEndian.putUint32(data, 16909060, 1);
			expect(data).toStrictEqual(new Uint8Array([0, 1, 2, 3, 4]));
		});
		it('insufficient space', () => {
			const data = new Uint8Array(0);
			expect(() => bigEndian.putUint32(data, 1, 0)).toThrow();
		});
		it('insufficient space with offset', () => {
			const data = new Uint8Array(4);
			expect(() => bigEndian.putUint32(data, 16909060, 1)).toThrow();
		});
		it('sets incorrect value', () => {
			const data = new Uint8Array(4);
			const t = () => bigEndian.putUint32(data, 4294967296, 0);
			expect(t).toThrow('Invalid uint32 value');
		});
	});

	describe('Should use bigEndian.putUint64', () => {
		it('sets correct value', () => {
			const data = new Uint8Array(8);
			bigEndian.putUint64(data, 72623859790382856n, 0);
			expect(data).toStrictEqual(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]));
		});
		it('excessive bytes', () => {
			const data = new Uint8Array(9);
			bigEndian.putUint64(data, 72623859790382856n, 0);
			expect(data).toStrictEqual(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 0]));
		});
		it('offset', () => {
			const data = new Uint8Array(9);
			bigEndian.putUint64(data, 72623859790382856n, 1);
			expect(data).toStrictEqual(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8]));
		});
		it('insufficient space', () => {
			const data = new Uint8Array(0);
			expect(() => bigEndian.putUint64(data, 72623859790382856n, 0)).toThrow();
		});
		it('insufficient space with offset', () => {
			const data = new Uint8Array(8);
			expect(() => bigEndian.putUint64(data, 72623859790382856n, 1)).toThrow();
		});
		it('sets incorrect value', () => {
			const data = new Uint8Array(8);
			const t = () => bigEndian.putUint64(data, 18446744073709551616n, 0);
			expect(t).toThrow('Invalid uint64 value');
		});
	});
});
