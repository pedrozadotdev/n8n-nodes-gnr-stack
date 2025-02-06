import {
	NodeConnectionType,
	type IExecuteFunctions,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
} from 'n8n-workflow';

import {
	//setupRedisClient,
	redisConnectionTest,
	//getValue,
	//setValue,
} from './utils';

export class HttpForwardAuth implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'HTTP Forward Auth',
		name: 'httpForwardAuth',
		icon: { light: 'file:httpForwardAuth.svg', dark: 'file:httpForwardAuth.dark.svg' },
		group: ['transform'],
		version: 1,
		description: 'It can be used as a HTTP forward auth middleware',
		defaults: {
			name: 'HTTP Forward Auth',
		},
		codex: {
			categories: ['Development'],
			resources: {
				primaryDocumentation: [
					{
						url: 'https://github.com/pedrozadotdev/n8n-nodes-http-forward-auth',
					},
				],
			},
		},
		// eslint-disable-next-line n8n-nodes-base/node-class-description-inputs-wrong-regular-node
		inputs: [NodeConnectionType.Main],
		// eslint-disable-next-line n8n-nodes-base/node-class-description-outputs-wrong
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				// eslint-disable-next-line n8n-nodes-base/node-class-description-credentials-name-unsuffixed
				name: 'redis',
				displayName: 'Redis Credential',
				required: true,
				testedBy: 'redisConnectionTest',
			},
		],
		properties: [
			{
				displayName: 'User ID',
				name: 'userID',
				type: 'string',
				default: '',
				placeholder: 'Ex.: Current Email',
				description: 'If empty, it will be considered as a failed login attempt',
			},
			{
				displayName: 'Forward Auth Header',
				name: 'authHeader',
				type: 'string',
				default: '',
				required: true,
				placeholder: 'Ex: X-Forwarded-User',
			},
			{
				displayName: 'Enable Rate Limit',
				name: 'rateLimit',
				type: 'boolean',
				default: false,
			},
			{
				displayName: 'Remote IP Header',
				name: 'remoteIpHeader',
				type: 'string',
				default: '',
				placeholder: 'Ex: X-Real-IP',
				description: 'Restrict login attempts by this header',
				required: true,
				displayOptions: {
					show: {
						rateLimit: [true],
					},
				},
			},
			{
				displayName: 'Time to Wait List',
				name: 'timeoutList',
				type: 'json',
				default: '[1, 2, 4, 8, 16, 30, 60, 180, 300]',
				required: true,
				placeholder: 'Ex: [1, 2, 3...]',
				description: 'Seconds to wait for each subsequent failed login attempt',
				validateType: 'array',
				displayOptions: {
					show: {
						rateLimit: [true],
					},
				},
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'hidden',
				noDataExpression: true,
				options: [
					{
						name: 'Login Response',
						value: 'response',
						action: 'Authenticate the user',
					},
				],
				default: 'response',
			},
		],
	};

	methods = {
		credentialTest: { redisConnectionTest },
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return [[]];
	}
}
