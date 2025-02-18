import { getRedisClient } from '../nodes/common/transport';
import { credentialsMock, setupRedis, resetRedis, resetJest } from './helpers';

jest.mock('redis', () => ({
	__esModule: true,
	createClient: jest.fn(),
}));

jest.useFakeTimers();

jest.spyOn(global, 'setInterval');
let onShutdown = () => {};
// @ts-ignore
jest.spyOn(process, 'on').mockImplementation((_, l) => {
	onShutdown = l;
});

describe('Transport Suite', () => {
	afterAll(resetJest);
	afterEach(resetRedis);

	it('Should return Redis Client and RATE_LIMIT_SHA correctly', async () => {
		setupRedis();
		const redis = await getRedisClient(credentialsMock);
		expect(await redis.client.connect()).toBe('CONNECTED');
		expect(redis.RATE_LIMIT_SHA).toBe('RATE_LIMIT_SHA');
	});

	it('Should test cleanupStaleConnections', async () => {
		setupRedis();
		await getRedisClient(credentialsMock);
		expect(setInterval).toHaveBeenCalledTimes(1);
		expect(setInterval).toHaveBeenLastCalledWith(expect.any(Function), 30 * 60 * 1000);
		jest.advanceTimersByTime(2 * 60 * 60 * 1000);
	});

	it('Should test onShutdown', async () => {
		setupRedis();
		await getRedisClient(credentialsMock);
		expect(process.on).toHaveBeenCalledTimes(1);
		expect(process.on).toHaveBeenLastCalledWith('exit', expect.any(Function));
		onShutdown();
	});
});
