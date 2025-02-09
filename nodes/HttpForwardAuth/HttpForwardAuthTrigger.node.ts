import type {
	IWebhookFunctions,
	IWebhookResponseData,
	INodeExecutionData,
	INodeType,
	IDataObject,
} from 'n8n-workflow';

import {
	FORWARDED_HOST_HEADER,
	FORWARDED_USER_HEADER,
	REMOTE_IP_HEADER,
	SESSION_KEY,
} from './constants';
import { triggerDescription } from './descriptions';
import { getRedisClient } from './transport';
import type { RedisCredential } from './types';
import {
	deleteSessionTokenCookie,
	rateLimitConsume,
	redisConnectionTest,
	setSessionTokenCookie,
	validateSessionToken,
} from './utils';

export class HttpForwardAuthTrigger implements INodeType {
	description = triggerDescription;

	methods = {
		credentialTest: { redisConnectionTest },
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const req = this.getRequestObject();
		const res = this.getResponseObject();
		const addResHeader = (key: string, value: string) => res.setHeader(key, value);

		const credentials = await this.getCredentials<RedisCredential>('redis');
		const redis = await getRedisClient(credentials);

		const loginURL = this.getNodeParameter('loginURL', '') as string;
		const afterLoginURL = this.getNodeParameter('afterLoginURL', '') as string;
		const logoutURL = this.getNodeParameter('logoutURL', '') as string;
		const enableHTTP = this.getNodeParameter('enableHTTP', false) as boolean;
		const rateLimit = this.getNodeParameter('rateLimit', false) as boolean;
		const remoteIp = rateLimit ? req.header(REMOTE_IP_HEADER) : undefined;
		const rateLimitErrorMessage = this.getNodeParameter('rateLimitErrorMessage', '') as string;
		const loginTemplate = this.getNodeParameter('loginTemplate', '') as string;

		const webhookName = this.getWebhookName();

		let workflowData: INodeExecutionData[][] | undefined;
		let noWebhookResponse = true;

		if (webhookName === 'check') {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			const token = (req.cookies[SESSION_KEY] as string | undefined) ?? null;
			if (token === null) {
				res.status(401).redirect(loginURL);
			} else {
				const session = await validateSessionToken(redis, token);
				if (session === null) {
					deleteSessionTokenCookie(addResHeader);
					res.status(401).redirect(loginURL);
				} else {
					// Extend the expire date if needed
					setSessionTokenCookie(addResHeader, token, session.expiresAt, enableHTTP);

					res.setHeader(FORWARDED_USER_HEADER, session.user);
					res.status(200).end();
				}
			}
		} else if (webhookName === 'setup') {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			const token = (req.cookies[SESSION_KEY] as string | undefined) ?? null;
			const session = token && (await validateSessionToken(redis, token));
			if (session) {
				// Extend the expire date if needed
				setSessionTokenCookie(addResHeader, token, session.expiresAt, enableHTTP);
				res.status(307).redirect(afterLoginURL);
			} else {
				deleteSessionTokenCookie(addResHeader);
				const pageContent = loginTemplate
					.replaceAll('#ERROR_MESSAGE#', '')
					.replaceAll('#ACTION#', loginURL);
				res.status(200).send(pageContent).end();
			}
		} else if (webhookName === 'default') {
			const origin = req.header(FORWARDED_HOST_HEADER);
			// CSRF protection
			if (!origin || origin !== loginURL) {
				res.status(403).send('Error 403 - Forbidden').end();
			} else if (rateLimit && remoteIp && !(await rateLimitConsume(redis, remoteIp))) {
				const pageContent = loginTemplate
					.replaceAll('#ERROR_MESSAGE#', rateLimitErrorMessage)
					.replaceAll('#ACTION#', loginURL);
				res.status(429).send(pageContent).end();
			} else {
				workflowData = [
					[
						{
							json: {
								...(req.body as IDataObject),
								...(rateLimit ? { remoteIp } : {}),
							},
						},
					],
				];
				noWebhookResponse = false;
			}
		} else if (webhookName === 'logout') {
			deleteSessionTokenCookie(addResHeader);
			res.redirect(logoutURL);
		}
		return {
			noWebhookResponse,
			workflowData,
		};
	}
}
