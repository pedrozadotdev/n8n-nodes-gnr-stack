import { NodeConnectionType, Node } from 'n8n-workflow';
import type { IWebhookFunctions, IWebhookResponseData, INodeTypeDescription } from 'n8n-workflow';

import {
	//setupRedisClient,
	redisConnectionTest,
	//getValue,
	//setValue,
} from './utils';

export class HttpForwardAuthTrigger extends Node {
	description: INodeTypeDescription = {
		displayName: 'HTTP Forward Auth Trigger',
		name: 'httpForwardAuthTrigger',
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
				path: 'login',
			},
			{
				// @ts-ignore
				name: 'logout',
				httpMethod: 'GET',
				responseMode: 'onReceived',
				path: 'logout',
			},
			{
				// @ts-ignore
				name: 'check',
				httpMethod: 'GET',
				responseMode: 'onReceived',
				path: 'check',
			},
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'responseNode',
				path: 'login',
				ndvHideUrl: true,
			},
		],
		eventTriggerDescription: 'Waiting for you to login',
		activationMessage: 'You can now use it as an authentication middleware.',
		properties: [
			{
				displayName: 'Custom Login Page Header',
				name: 'customHeader',
				type: 'string',
				typeOptions: {
					editor: 'htmlEditor',
				},
				default: `<style>
  /* Add some custom CSS */
</style>`,
				placeholder: 'Custom HTML to add to Login Page Header',
				description: 'This will be append to the header of the Login Page',
			},
			{
				displayName: 'Logout Redirect URL',
				name: 'logoutURL',
				type: 'string',
				default: '',
				placeholder: 'https://example.com/logout',
				description: 'This is where the user will be sent when logout',
			},
			{
				displayName: 'Enable HTTP',
				name: 'secureCookie',
				type: 'boolean',
				default: false,
				description: 'Whether allow HTTP (Ex.: http://localhost)',
			},
		],
	};

	methods = {
		credentialTest: { redisConnectionTest },
	};

	async webhook(ctx: IWebhookFunctions): Promise<IWebhookResponseData> {
		const req = ctx.getRequestObject();
		const res = ctx.getResponseObject();

		res.status(200).send(req.url).end();
		return {
			noWebhookResponse: true,
		};
	}
}
