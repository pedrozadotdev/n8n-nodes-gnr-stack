/* c8 ignore start */
import type { createClient } from 'redis';

export type RedisCredential = {
	host: string;
	port: number;
	ssl?: boolean;
	database: number;
	user?: string;
	password?: string;
};

export type Session = {
	id: string;
	user: string;
	expiresAt: Date;
};

export type Redis = {
	client: ReturnType<typeof createClient>;
	RATE_LIMIT_SHA: string;
};
/* c8 ignore stop */
