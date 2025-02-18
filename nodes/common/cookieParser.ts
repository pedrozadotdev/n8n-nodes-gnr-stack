function startIndex(str: string, i: number, max: number) {
	let index = i;
	do {
		const code = str.charCodeAt(index);
		if (code !== 0x20 /*   */ && code !== 0x09 /* \t */) return index;
	} while (++index < max);
/* c8 ignore next 2 */
	return max;
}

function endIndex(str: string, i: number, min: number) {
	let index = i;
	while (index > min) {
		const code = str.charCodeAt(--index);
		if (code !== 0x20 /*   */ && code !== 0x09 /* \t */) return index + 1;
	}
/* c8 ignore next 2 */
	return min;
}

/**
 * URL-decode string value. Optimized to skip native call when no %.
 */
function decode(str: string): string {
	if (str.indexOf('%') === -1) return str;
/* c8 ignore start */
	try {
		return decodeURIComponent(str);
	} catch (e) {
		return str;
	}
/* c8 ignore stop */
}

export function cookieParse(str: string | undefined): Record<string, string | undefined> {
	const obj: Record<string, string | undefined> = {};
	if (!str) return obj;
	const len = str.length;
	// RFC 6265 sec 4.1.1, RFC 2616 2.2 defines a cookie name consists of one char minimum, plus '='.
	if (len < 2) return obj;

	let index = 0;

	do {
		const eqIdx = str.indexOf('=', index);
		if (eqIdx === -1) break; // No more cookie pairs.

		const colonIdx = str.indexOf(';', index);
		const endIdx = colonIdx === -1 ? len : colonIdx;
/* c8 ignore start */
		if (eqIdx > endIdx) {
			// backtrack on prior semicolon
			index = str.lastIndexOf(';', eqIdx - 1) + 1;
			continue;
		}
/* c8 ignore stop */
		const keyStartIdx = startIndex(str, index, eqIdx);
		const keyEndIdx = endIndex(str, eqIdx, keyStartIdx);
		const key = str.slice(keyStartIdx, keyEndIdx);

		// only assign once
		if (obj[key] === undefined) {
			const valStartIdx = startIndex(str, eqIdx + 1, endIdx);
			const valEndIdx = endIndex(str, endIdx, valStartIdx);

			const value = decode(str.slice(valStartIdx, valEndIdx));
			obj[key] = value;
		}

		index = endIdx + 1;
	} while (index < len);

	return obj;
}
