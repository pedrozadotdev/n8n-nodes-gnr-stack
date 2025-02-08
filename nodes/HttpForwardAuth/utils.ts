import type {
	ICredentialTestFunctions,
	ICredentialsDecrypted,
	INodeCredentialTestResult,
	IWebhookFunctions,
} from 'n8n-workflow';
import crypto from 'node:crypto';
import { createClient } from 'redis';

import { RATE_LIMIT_STORAGE_KEY, SESSION_KEY } from './constants';
import { sha256, encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from './oslojs';
import { redisRLScript } from './templates';
import type { RedisCredential, Redis, Session } from './types';

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
		`session:${session.id}`,
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
	const item = await client.get(`session:${sessionId}`);
	if (item === null) {
		return null;
	}
	// eslint-disable-next-line n8n-local-rules/no-uncaught-json-parse
	const result = JSON.parse(item) as { id: string; user: string; expires_at: number };
	const session: Session = {
		id: result.id,
		user: result.user,
		expiresAt: new Date(result.expires_at * 1000),
	};
	if (Date.now() >= session.expiresAt.getTime()) {
		await client.del(`session:${sessionId}`);
		return null;
	}
	if (Date.now() >= session.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 3.5) {
		session.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
		await client.set(
			`session:${session.id}`,
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
	await client.del(`session:${sessionId}`);
}

export function setSessionTokenCookie(
	res: ReturnType<IWebhookFunctions['getResponseObject']>,
	token: string,
	expiresAt: Date,
	enableHTTP?: boolean,
): void {
	res.cookie(SESSION_KEY, token, {
		httpOnly: true,
		sameSite: 'lax',
		path: '/',
		expires: expiresAt,
		secure: !enableHTTP,
	});
}

export function deleteSessionTokenCookie(
	res: ReturnType<IWebhookFunctions['getResponseObject']>,
	enableHTTP?: boolean,
): void {
	res.cookie(SESSION_KEY, '', {
		httpOnly: true,
		sameSite: 'lax',
		maxAge: 0,
		path: '/',
		secure: !enableHTTP,
	});
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
