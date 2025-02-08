const alphabetLowerCase = '0123456789abcdef';

export function encodeHexLowerCase(data: Uint8Array): string {
	let result = '';
	for (let i = 0; i < data.length; i++) {
		result += alphabetLowerCase[data[i] >> 4];
		result += alphabetLowerCase[data[i] & 0x0f];
	}
	return result;
}
