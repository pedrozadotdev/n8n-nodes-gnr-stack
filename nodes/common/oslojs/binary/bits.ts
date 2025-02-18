export function rotr32(x: number, n: number): number {
	return ((x << (32 - n)) | (x >>> n)) >>> 0;
}
