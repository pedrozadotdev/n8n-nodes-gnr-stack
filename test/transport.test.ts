import { getRedisClient, getPoolManagerInstance } from '../nodes/HttpForwardAuth/transport';
import type { RedisCredential } from '../nodes/HttpForwardAuth/types';

jest.mock('redis', () => {
	return {
		__esModule: true,
		createClient: () => ({
			connect: async () => 'CONNECTED',
			disconnect: async () => 'DISCONNECTED',
			scriptLoad: async () => 'RATE_LIMIT_SHA'
		})
	}
});

describe('Transport', () => {

	it('Should return Redis Client and RATE_LIMIT_SHA correctly', async () => {
		const credentialsMock: RedisCredential = { host: 'redis', port: 6379, database: 0 }
		const redis = await getRedisClient(credentialsMock)

		expect(await redis.client.connect()).toBe('CONNECTED')
		expect(redis.RATE_LIMIT_SHA).toBe('RATE_LIMIT_SHA')
	})

	it('Should call onShutdown in PoolManager', async () => {
		const poolManager = getPoolManagerInstance()
		poolManager.onShutdown();
		await poolManager.purgeConnections();
	})
})
