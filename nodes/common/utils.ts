import type {
	ICredentialTestFunctions,
	ICredentialsDecrypted,
	INodeCredentialTestResult,
} from 'n8n-workflow';
import crypto from 'node:crypto';
import { createClient } from 'redis';

import { RATE_LIMIT_STORAGE_KEY, SESSION_KEY } from './constants';
import { sha256, encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from './oslojs';
import type { RedisCredential, Redis, Session } from './types';

const redisRLScript = `
-- Returns 1 if allowed, 0 if not
local key                   = KEYS[1]
local now                   = tonumber(ARGV[1])

local timeoutSeconds = {1, 2, 4, 8, 16, 30, 60, 180, 300}

local fields = redis.call("HGETALL", key)
if #fields == 0 then
    redis.call("HSET", key, "index", 1, "updated_at", now)
    return {1}
end
local index = 0
local updatedAt = 0
for i = 1, #fields, 2 do
	if fields[i] == "index" then
        index = tonumber(fields[i+1])
    elseif fields[i] == "updated_at" then
        updatedAt = tonumber(fields[i+1])
    end
end
local allowed = now - updatedAt >= timeoutSeconds[index]
if not allowed then
    return {0}
end
index = math.min(index + 1, #timeoutSeconds)
redis.call("HSET", key, "index", index, "updated_at", now)
return {1}
`;

export async function setupRedisClient(credentials: RedisCredential): Promise<Redis> {
	const client = createClient({
		socket: {
			host: credentials.host,
			port: credentials.port,
			tls: credentials.ssl === true,
		},
		database: credentials.database,
		username: credentials.user ?? undefined,
		password: credentials.password ?? undefined,
	});

	await client.connect();
	const RATE_LIMIT_SHA = await client.scriptLoad(redisRLScript);

	return { client, RATE_LIMIT_SHA };
}

export async function redisConnectionTest(
	this: ICredentialTestFunctions,
	credential: ICredentialsDecrypted,
): Promise<INodeCredentialTestResult> {
	const credentials = credential.data as RedisCredential;

	try {
		const { client } = await setupRedisClient(credentials);
		await client.ping();
		await client.disconnect();
		return {
			status: 'OK',
			message: 'Connection successful!',
		};
	} catch (error) {
		return {
			status: 'Error',
			message: (error as { message: string }).message,
		};
	}
}

export async function generateSessionToken(): Promise<string> {
	const bytes = new Uint8Array(20);
	crypto.getRandomValues(bytes);
	const token = encodeBase32LowerCaseNoPadding(bytes);
	return token;
}

export async function createSession(
	{ client }: Redis,
	token: string,
	user: string,
): Promise<Session> {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const session: Session = {
		id: sessionId,
		user,
		// 07 days
		expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
	};
	await client.set(
		`${SESSION_KEY}:${session.id}`,
		JSON.stringify({
			id: session.id,
			user: session.user,
			expires_at: Math.floor(session.expiresAt.getTime() / 1000),
		}),
		{
			EXAT: Math.floor(session.expiresAt.getTime() / 1000),
		},
	);
	return session;
}

export async function validateSessionToken(
	{ client }: Redis,
	token: string,
): Promise<Session | null> {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const item = await client.get(`${SESSION_KEY}:${sessionId}`);
	if (item === null) {
		return null;
	}
	const result = JSON.parse(item) as { id: string; user: string; expires_at: number };
	const session: Session = {
		id: result.id,
		user: result.user,
		expiresAt: new Date(result.expires_at * 1000),
	};
	if (Date.now() >= session.expiresAt.getTime()) {
		await client.del(`${SESSION_KEY}:${sessionId}`);
		return null;
	}
	if (Date.now() >= session.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 3.5) {
		session.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
		await client.set(
			`${SESSION_KEY}:${session.id}`,
			JSON.stringify({
				id: session.id,
				user: session.user,
				expires_at: Math.floor(session.expiresAt.getTime() / 1000),
			}),
			{
				EXAT: Math.floor(session.expiresAt.getTime() / 1000),
			},
		);
	}
	return session;
}

export async function invalidateSession({ client }: Redis, sessionId: string): Promise<void> {
	await client.del(`${SESSION_KEY}:${sessionId}`);
}

export function setSessionTokenCookie(
	addResHeader: (key: string, value: string) => void,
	token: string,
	expiresAt: Date,
	enableHTTP?: boolean,
): void {
	addResHeader(
		'Set-Cookie',
		`${SESSION_KEY}=${token}; HttpOnly; SameSite=Lax; Expires=${expiresAt.toUTCString()}; Path=/${enableHTTP ? '' : '; Secure'}`,
	);
}

export function deleteSessionTokenCookie(
	addResHeader: (key: string, value: string) => void,
	enableHTTP?: boolean,
): void {
	addResHeader(
		'Set-Cookie',
		`${SESSION_KEY}=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/${enableHTTP ? '' : '; Secure'}`,
	);
}

export async function rateLimitConsume(
	{ client, RATE_LIMIT_SHA }: Redis,
	key: string,
): Promise<boolean> {
	const result = (await client.evalSha(RATE_LIMIT_SHA, {
		keys: [`${RATE_LIMIT_STORAGE_KEY}:${key}`],
		arguments: [Math.floor(Date.now() / 1000).toString()],
	})) as [number];
	return Boolean(result[0]);
}

export async function rateLimitReset({ client }: Redis, key: string): Promise<void> {
	await client.del(`${RATE_LIMIT_STORAGE_KEY}:${key}`);
}
