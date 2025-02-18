class BigEndian {
	putUint32(target: Uint8Array, value: number, offset: number): void {
		if (target.length < offset + 4) {
			throw new TypeError('Not enough space');
		}
		if (value < 0 || value > 4294967295) {
			throw new TypeError('Invalid uint32 value');
		}
		for (let i = 0; i < 4; i++) {
			target[offset + i] = (value >> ((3 - i) * 8)) & 0xff;
		}
	}

	putUint64(target: Uint8Array, value: bigint, offset: number): void {
		if (target.length < offset + 8) {
			throw new TypeError('Not enough space');
		}
		if (value < 0 || value > 18446744073709551615n) {
			throw new TypeError('Invalid uint64 value');
		}
		for (let i = 0; i < 8; i++) {
			target[offset + i] = Number((value >> BigInt((7 - i) * 8)) & 0xffn);
		}
	}
}

export const bigEndian = new BigEndian();
