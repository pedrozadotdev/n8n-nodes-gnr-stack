import { mock } from 'jest-mock-extended';
import { SESSION_KEY, RATE_LIMIT_STORAGE_KEY } from '../nodes/HttpForwardAuth/constants';
import {
	redisConnectionTest,
	generateSessionToken,
	createSession,
	validateSessionToken,
	invalidateSession,
	rateLimitConsume,
	rateLimitReset,
	setSessionTokenCookie,
	deleteSessionTokenCookie
} from '../nodes/HttpForwardAuth/utils';
import type { ICredentialTestFunctions } from 'n8n-workflow';
import { getRedisClient } from '../nodes/HttpForwardAuth/transport';
import { credentialsMock, setupRedis, resetRedis, resetJest } from './helpers';

jest.mock('redis', () => ({
	__esModule: true,
	createClient: jest.fn(),
}));

jest.useFakeTimers();

describe('Utils Suite', () => {
	afterAll(resetJest);

	describe('redisConnectionTest', () => {
		const self = mock<ICredentialTestFunctions>({});

		it('Should test connection to Redis successfully', async () => {
			setupRedis();
			expect(
				await redisConnectionTest.bind(self)({ id: '', name: '', type: '', data: credentialsMock }),
			).toStrictEqual({
				status: 'OK',
				message: 'Connection successful!',
			});
		});

		it('Should test connection to Redis with fail', async () => {
			setupRedis({
				ping: async () => {
					throw new Error('Some Error!');
				},
			});
			expect(
				await redisConnectionTest.bind(self)({ id: '', name: '', type: '', data: credentialsMock }),
			).toStrictEqual({
				status: 'Error',
				message: 'Some Error!',
			});
		});
	});

	describe('generateSessionToken', () => {
		it('Should generate a valid Session Token', async () => {
			expect((await generateSessionToken()).length).toBe(32);
		});
	});

	describe('Session Utils', () => {
		afterEach(resetRedis);

		it('Should create session successfully', async () => {
			setupRedis();
			const redis = await getRedisClient(credentialsMock);
			expect(await createSession(redis, 'token', 'user')).toEqual(
				expect.objectContaining({
					id: '3c469e9d6c5875d37a43f353d4f88e61fcf812c66eee3457465a40b0da4153e0',
					user: 'user',
				}),
			);
		});

		it('Should validate session successfully', async () => {
			const expires_at = Math.floor((new Date().getTime() + 1000 * 60 * 60 * 24 * 4) / 1000);
			setupRedis({
				get: async () => JSON.stringify({ id: 'id', user: 'user', expires_at }),
			});
			const redis = await getRedisClient(credentialsMock);
			expect(await validateSessionToken(redis, 'token')).toEqual({
				id: 'id',
				user: 'user',
				expiresAt: new Date(expires_at * 1000),
			});
		});

		it('Should validate null session', async () => {
			setupRedis({ get: async () => null });
			const redis = await getRedisClient(credentialsMock);
			expect(await validateSessionToken(redis, 'token')).toEqual(null);
		});

		it('Should remove expired session', async () => {
			const expires_at = Math.floor((new Date().getTime() - 1000 * 60 * 60 * 24) / 1000);
			setupRedis({
				get: async () => JSON.stringify({ id: 'id', user: 'user', expires_at }),
			});
			const redis = await getRedisClient(credentialsMock);
			expect(await validateSessionToken(redis, 'token')).toEqual(null);
		});

		it('Should renew session successfully', async () => {
			const expires_at = Math.floor((new Date().getTime() + 1000 * 60 * 60 * 24 * 3) / 1000);
			setupRedis({
				get: async () => JSON.stringify({ id: 'id', user: 'user', expires_at }),
			});
			const redis = await getRedisClient(credentialsMock);
			const session = await validateSessionToken(redis, 'token');
			expect(session?.expiresAt.getTime()).toBeGreaterThanOrEqual(expires_at * 1000 + 1000 * 60 * 60 * 24 * 4)
			expect(session).toEqual(expect.objectContaining({
				id: 'id',
				user: 'user',
			}))
		});

		it('Should invalidate session', async () => {
			const del = jest.fn().mockImplementation()
			setupRedis({ del });
			const redis = await getRedisClient(credentialsMock);
			expect(await invalidateSession(redis, 'token')).toBeUndefined();
			expect(del).toHaveBeenCalledWith(`${SESSION_KEY}:token`);
		});
	});

	describe('Rate Limit Utils', () => {
		afterEach(resetRedis);

		it('Should consume rateLimit', async () => {
			setupRedis({
				evalSha: async () => [true]
			});
			const redis = await getRedisClient(credentialsMock);
			expect(await rateLimitConsume(redis, 'key')).toBe(true);
		});

		it('Should reset rateLimit', async () => {
			const del = jest.fn().mockImplementation()
			setupRedis({ del });
			const redis = await getRedisClient(credentialsMock);
			expect(await rateLimitReset(redis, 'key')).toBeUndefined();
			expect(del).toHaveBeenCalledWith(`${RATE_LIMIT_STORAGE_KEY}:key`);
		});
	})

	describe('Cookie Utils', () => {
		it('Should set session token cookie', async () => {
			const addResHeader = jest.fn().mockImplementation()
			const expires = new Date()
			expect(setSessionTokenCookie(addResHeader, 'token', expires)).toBeUndefined();
			expect(addResHeader).toHaveBeenCalledWith('Set-Cookie', `${SESSION_KEY}=token; HttpOnly; SameSite=Lax; Expires=${expires.toUTCString()}; Path=/; Secure`);
			expect(setSessionTokenCookie(addResHeader, 'token', expires, true)).toBeUndefined();
			expect(addResHeader).toHaveBeenCalledWith('Set-Cookie', `${SESSION_KEY}=token; HttpOnly; SameSite=Lax; Expires=${expires.toUTCString()}; Path=/`);

		});

		it('Should delete session token cookie', async () => {
			const addResHeader = jest.fn().mockImplementation()
			expect(deleteSessionTokenCookie(addResHeader)).toBeUndefined();
			expect(addResHeader).toHaveBeenCalledWith('Set-Cookie', `${SESSION_KEY}=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/; Secure`);
			expect(deleteSessionTokenCookie(addResHeader, true)).toBeUndefined();
			expect(addResHeader).toHaveBeenCalledWith('Set-Cookie', `${SESSION_KEY}=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/`);
		});
	})
});
