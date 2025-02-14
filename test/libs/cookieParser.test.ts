import { cookieParse } from '../../nodes/HttpForwardAuth/cookieParser';

const cookies = [
	'AAA-Aaaa-Aaaaaa=00-Aaa-0000; BBB-Bbbb-Bbbbbb-Bbbbbb=11-Bbb-1111; CCC-CC=222; DddDD=DD:DD:Ddd_Ddddddddd:33.33:-333.33:d3; EeeeeeeEeeeeEeeee=4.444',
	'fffffffff=5555555555_fFfFffFfffFF55FF5ffffF5ffFFfff5f5F55FfF5fFF; ggggggg=-6%22-6%22-6%226666666666; hhhhhhh=7; iiiiiii=-8%22-8%22-8%228888888888',
	'asd=%E0%A4%A;; asd-b=123;asd_as=as-ds-da',
	'asd=asd; ==',
	'',
	'a',
	'asd-asd-asd',
];

describe('CookieParse', () => {
	it('Should parse cookies correctly', () => {
		expect(cookieParse(cookies[0])['AAA-Aaaa-Aaaaaa']).toBe('00-Aaa-0000');
		expect(cookieParse(cookies[0]).DddDD).toBe('DD:DD:Ddd_Ddddddddd:33.33:-333.33:d3');
		expect(cookieParse(cookies[1]).ggggggg).toBe('-6\"-6\"-6\"6666666666');
		expect(cookieParse(cookies[1]).hhhhhhh).toBe('7');
		expect(cookieParse(cookies[2]).asd).toBe('%E0%A4%A');
		expect(cookieParse(cookies[3]).asd).toBe('asd');
		expect(cookieParse(cookies[4])).toEqual({});
		expect(cookieParse(cookies[5])).toEqual({});
		expect(cookieParse(cookies[6])).toEqual({});
	});
});
