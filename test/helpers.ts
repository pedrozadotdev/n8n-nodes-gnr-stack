import type { Request, Response } from 'express';
import type { RedisCredential } from '../nodes/common/types';
import type {
	IExecuteFunctions,
	INode,
	IWebhookFunctions,
	IWorkflowDataProxyData,
	NodeTypeAndVersion,
} from 'n8n-workflow';

import { createClient } from 'redis';
import { mock } from 'jest-mock-extended';
import { getPoolManagerInstance } from '../nodes/common/transport';
import { TRIGGER_NAME } from '../nodes/common/constants';

type TriggerOpts = {
	request: {
		headers?: Record<string, unknown>;
		body?: Record<string, unknown>;
	};
	params: {
		authURL?: string;
		loginRedirectURL?: string;
		logoutRedirectURL?: string;
		rateLimit?: boolean;
		enableHTTP?: boolean;
		rateLimitErrorMessage?: string;
		loginTemplate?: string;
	};
	webhookName: 'setup' | 'logoutPage' | 'logout' | 'check' | 'default';
	redisStore: Record<string, string | null>;
	redisEvalShaFunc?: () => [0 | 1];
};

type ResponseOpts = {
	params: {
		userID?: string;
		validationErrorMessage?: string;
	};
	parentNodes: NodeTypeAndVersion[];
	triggerData: {
		data?: Record<string, unknown>,
		params?: TriggerOpts['params']
	}
	continueOnFail: boolean;
};

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
};

export const credentialsMock: RedisCredential = { host: 'redis', port: 6379, database: 0 };

const defaultTriggerOpts: TriggerOpts = {
	request: {
		headers: {
			cookie: [],
		},
		body: {},
	},
	params: {
		authURL: 'http://localhost:8080',
		loginRedirectURL: 'http://localhost:8080/protected',
		logoutRedirectURL: 'http://localhost:8080/login',
		rateLimit: false,
		enableHTTP: false,
		rateLimitErrorMessage: 'Rate Limit Error',
		loginTemplate: '#LOGIN_URL#|#ERROR_MESSAGE#',
	},
	webhookName: 'setup',
	redisStore: {},
	redisEvalShaFunc: () => [1],
};

export const setupTrigger = (opts?: Partial<TriggerOpts>) => {
	const store: TriggerOpts = {
		request: {
			headers: {
				...defaultTriggerOpts.request.headers,
				...(opts?.request?.headers ?? {}),
			},
			body: opts?.request?.body ?? {},
		},
		params: {
			...defaultTriggerOpts.params,
			...(opts?.params ?? {}),
		},
		webhookName: opts?.webhookName ?? defaultTriggerOpts.webhookName,
		redisStore: opts?.redisStore ?? {},
	};
	const redisEvalShaMock = jest.fn(opts?.redisEvalShaFunc ?? defaultTriggerOpts.redisEvalShaFunc);
	setupRedis({
		get: async (key: string) => store.redisStore[key],
		set: async (key: string, value: string) => {
			store.redisStore[key] = value;
		},
		evalSha: redisEvalShaMock,
	});

	const resEndMock = jest.fn();
	const [resSetHeaderMock, resRedirectMock, resSendMock] = [
		jest.fn(),
		jest.fn(),
		jest.fn(() =>
			mock<Response>({
				end: resEndMock,
			}),
		),
	];
	const resStatusMock = jest.fn(() =>
		mock<Response>({
			redirect: resRedirectMock,
			end: resEndMock,
			send: resSendMock,
		}),
	);

	const mocks = {
		redisEvalShaMock,
		resSetHeaderMock,
		resRedirectMock,
		resSendMock,
		resStatusMock,
		resEndMock,
	};

	const context = mock<IWebhookFunctions>({
		getRequestObject: () =>
			mock<Request>({
				// biome-ignore lint/suspicious/noExplicitAny: remove error for test
				headers: store.request.headers as any,
				body: store.request.body,
			}),
		getResponseObject: () =>
			mock<Response>({
				setHeader: resSetHeaderMock,
				status: resStatusMock,
			}),
		getCredentials: async <ICredentialsDecrypted>() =>
			credentialsMock as unknown as ICredentialsDecrypted,
		// @ts-ignore
		getNodeParameter: (name: string) => store.params[name],
		getWebhookName: () => store.webhookName,
	});

	return { context, mocks };
};

const defaultResponseOpts: ResponseOpts = {
	params: {
		userID: '',
		validationErrorMessage: 'Validation Error',
	},
	parentNodes: [{
		type: `custom.${TRIGGER_NAME}`,
		name: 'Trigger Node',
		typeVersion: 1
	}],
	triggerData: {
		params: {
			authURL: 'http://localhost:8080',
			enableHTTP: false,
			loginRedirectURL: 'http://localhost:8080/protected',
			loginTemplate: '#LOGIN_URL#|#ERROR_MESSAGE#'
		},
		data: { remoteIp: 'REMOTE_IP' }
	},
	continueOnFail: false
};

export const setupResponse = (opts?: Partial<ResponseOpts>) => {
	setupRedis();
	const sendResponseMock = jest.fn();
	const store: ResponseOpts = {
		params: {
			...defaultResponseOpts.params,
			...(opts?.params ?? {}),
		},
		parentNodes: [...(opts?.parentNodes ?? defaultResponseOpts.parentNodes)],
		triggerData: {
			params: {
				...defaultResponseOpts.triggerData.params,
				...(opts?.triggerData?.params ?? {})
			},
			data: {
				...defaultResponseOpts.triggerData.data,
				...(opts?.triggerData?.data ?? {})
			}
		},
		continueOnFail: opts?.continueOnFail ?? defaultResponseOpts.continueOnFail
	};

	const mocks = {
		sendResponseMock,
	};

	const context = mock<IExecuteFunctions>({
		getCredentials: async <ICredentialsDecrypted>() =>
			credentialsMock as unknown as ICredentialsDecrypted,
		// @ts-ignore
		getNodeParameter: jest.fn((name: string) => store.params[name]),
		getNode: () => mock<INode>(),
		getParentNodes: () => store.parentNodes,
		getWorkflowDataProxy: () => mock<IWorkflowDataProxyData>({
			$node: {
				'Trigger Node': {
					parameter: store.triggerData.params,
					data: store.triggerData.data
				}
			}
		}),
		sendResponse: sendResponseMock,
		continueOnFail: () => store.continueOnFail,
	});

	return { context, mocks };
};
