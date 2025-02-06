import type {
	ICredentialTestFunctions,
	ICredentialsDecrypted,
	IDataObject,
	IExecuteFunctions,
	INodeCredentialTestResult,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { createClient } from 'redis';

import type { RedisCredential, RedisClient } from './types';

export function setupRedisClient(credentials: RedisCredential): RedisClient {
	return createClient({
		socket: {
			host: credentials.host,
			port: credentials.port,
			tls: credentials.ssl === true,
		},
		database: credentials.database,
		username: credentials.user || undefined,
		password: credentials.password || undefined,
	});
}

export async function redisConnectionTest(
	this: ICredentialTestFunctions,
	credential: ICredentialsDecrypted,
): Promise<INodeCredentialTestResult> {
	const credentials = credential.data as RedisCredential;

	try {
		const client = setupRedisClient(credentials);
		await client.connect();
		await client.ping();
		return {
			status: 'OK',
			message: 'Connection successful!',
		};
	} catch (error) {
		return {
			status: 'Error',
			message: error.message,
		};
	}
}

export async function getValue(client: RedisClient, keyName: string, type?: string) {
	if (type === undefined || type === 'automatic') {
		// Request the type first
		type = await client.type(keyName);
	}

	if (type === 'string') {
		return await client.get(keyName);
	} else if (type === 'hash') {
		return await client.hGetAll(keyName);
	} else if (type === 'list') {
		return await client.lRange(keyName, 0, -1);
	} else if (type === 'sets') {
		return await client.sMembers(keyName);
	}
}

export async function setValue(
	this: IExecuteFunctions,
	client: RedisClient,
	keyName: string,
	value: string | number | object | string[] | number[],
	expire: boolean,
	ttl: number,
	type?: string,
	valueIsJSON?: boolean,
) {
	if (type === undefined || type === 'automatic') {
		// Request the type first
		if (typeof value === 'string') {
			type = 'string';
		} else if (Array.isArray(value)) {
			type = 'list';
		} else if (typeof value === 'object') {
			type = 'hash';
		} else {
			throw new NodeOperationError(
				this.getNode(),
				'Could not identify the type to set. Please set it manually!',
			);
		}
	}

	if (type === 'string') {
		await client.set(keyName, value.toString());
	} else if (type === 'hash') {
		if (valueIsJSON) {
			let values: unknown;
			if (typeof value === 'string') {
				try {
					values = JSON.parse(value);
				} catch {
					// This is how we originally worked and prevents a breaking change
					values = value;
				}
			} else {
				values = value;
			}
			for (const key of Object.keys(values as object)) {
				await client.hSet(keyName, key, (values as IDataObject)[key]!.toString());
			}
		} else {
			const values = value.toString().split(' ');
			await client.hSet(keyName, values);
		}
	} else if (type === 'list') {
		for (let index = 0; index < (value as string[]).length; index++) {
			await client.lSet(keyName, index, (value as IDataObject)[index]!.toString());
		}
	} else if (type === 'sets') {
		//@ts-ignore
		await client.sAdd(keyName, value);
	}

	if (expire) {
		await client.expire(keyName, ttl);
	}
	return;
}
