/* eslint-disable n8n-nodes-base/node-filename-against-convention */
import type { INodeTypeDescription } from 'n8n-workflow';
import { NodeConnectionType } from 'n8n-workflow';

import { TRIGGER_NAME } from '../common/constants';
import { loginPageHTMLTemplate } from './templates';

export const responseDescription: INodeTypeDescription = {
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
	inputs: [
		{
			type: NodeConnectionType.Main,
			maxConnections: 1,
		},
	],
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
			displayName: 'Validation Error Message',
			name: 'validationErrorMessage',
			type: 'string',
			default: '',
			required: true,
			placeholder: 'Ex: Incorrect user or password!',
			description: 'If User ID is empty this message will appear in the response',
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

export const triggerDescription: INodeTypeDescription = {
	displayName: 'HTTP Forward Auth Trigger',
	name: TRIGGER_NAME,
	icon: { light: 'file:httpForwardAuth.svg', dark: 'file:httpForwardAuth.dark.svg' },
	group: ['trigger'],
	version: 1,
	description: 'It can be used as a HTTP forward authentication middleware',
	defaults: {
		name: 'HTTP Forward Auth Trigger',
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
	inputs: [],
	// eslint-disable-next-line n8n-nodes-base/node-class-description-outputs-wrong
	outputs: [
		{
			displayName: 'LOGIN',
			type: NodeConnectionType.Main,
			maxConnections: 1,
		},
	],
	credentials: [
		{
			// eslint-disable-next-line n8n-nodes-base/node-class-description-credentials-name-unsuffixed
			name: 'redis',
			displayName: 'Redis Credential',
			required: true,
			testedBy: 'redisConnectionTest',
		},
	],
	webhooks: [
		{
			name: 'setup',
			httpMethod: 'GET',
			responseMode: 'onReceived',
			path: '/login',
		},
		{
			// @ts-expect-error Add more endpoints
			name: 'logoutPage',
			httpMethod: 'GET',
			responseMode: 'onReceived',
			path: '/logout',
		},
		{
			// @ts-expect-error Add more endpoints
			name: 'logout',
			httpMethod: 'POST',
			responseMode: 'onReceived',
			path: '/logout',
		},
		{
			// @ts-expect-error Add more endpoints
			name: 'check',
			httpMethod: 'GET',
			responseMode: 'onReceived',
			path: '/check',
		},
		{
			name: 'default',
			httpMethod: 'POST',
			responseMode: 'responseNode',
			path: '/login',
			ndvHideUrl: true,
		},
	],
	eventTriggerDescription: 'Waiting for you to login',
	activationMessage: 'You can now use it as an authentication middleware.',
	properties: [
		{
			displayName: 'Auth URL',
			name: 'authURL',
			type: 'string',
			required: true,
			default: '',
			placeholder: 'https://auth.e.io or https://e.io/auth',
			description: 'This is where this middleware will be hosted',
		},
		{
			displayName: 'Login Redirect URL',
			name: 'loginRedirectURL',
			type: 'string',
			required: true,
			default: '',
			placeholder: 'https://e.io/dashboard',
			description: 'This is where the user will be sent when login successfully',
		},
		{
			displayName: 'Logout Redirect URL',
			name: 'logoutRedirectURL',
			type: 'string',
			required: true,
			default: '',
			placeholder: 'https://e.io/login',
			description: 'This is where the user will be sent when logout',
		},
		{
			displayName: 'Enable HTTP',
			name: 'enableHTTP',
			type: 'boolean',
			default: false,
			description: 'Whether allow HTTP (Ex.: http://localhost)',
		},
		{
			displayName: 'Enable Rate Limit',
			name: 'rateLimit',
			type: 'boolean',
			default: false,
		},
		{
			displayName: 'Rate Limit Error Message',
			name: 'rateLimitErrorMessage',
			type: 'string',
			default: 'Too many requests!',
			required: true,
			placeholder: 'Ex: Too many requests!',
			displayOptions: {
				show: {
					rateLimit: [true],
				},
			},
		},
		{
			displayName: 'Login Page Template',
			name: 'loginTemplate',
			type: 'string',
			required: true,
			typeOptions: {
				editor: 'htmlEditor',
			},
			default: loginPageHTMLTemplate,
		},
	],
};
