import { createClient } from 'redis';
import { getPoolManagerInstance } from '../nodes/HttpForwardAuth/transport';
import type { RedisCredential } from '../nodes/HttpForwardAuth/types';

export const setupRedis = (mockOverrides?: Record<string, unknown>) => {
	(createClient as jest.Mock).mockImplementation(() => ({
		connect: async () => 'CONNECTED',
		disconnect: async () => 'DISCONNECTED',
		scriptLoad: async () => 'RATE_LIMIT_SHA',
		ping: async () => 'PONG',
		get: async () => 'GET',
		set: async () => 'SET',
		del: async () => 'DEL',
		evalSha: async () => 'EVALSHA',
		...mockOverrides,
	}));
};

export const resetRedis = async () => {
	const poolManager = getPoolManagerInstance();
	await poolManager.purgeConnections();
};

export const resetJest = () => {
	jest.resetAllMocks();
	jest.useRealTimers();
}

export const credentialsMock: RedisCredential = { host: 'redis', port: 6379, database: 0 };
