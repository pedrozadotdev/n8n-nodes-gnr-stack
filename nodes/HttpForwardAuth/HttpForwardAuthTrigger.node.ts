import type {
	IWebhookFunctions,
	IWebhookResponseData,
	INodeExecutionData,
	INodeType,
	IDataObject,
} from 'n8n-workflow';

import { FORWARDED_USER_HEADER, REMOTE_IP_HEADER, SESSION_KEY } from '../common/constants';
import { cookieParse } from '../common/cookieParser';
import { triggerDescription } from './descriptions';
import { logoutPageHTMLTemplate } from './templates';
import { getRedisClient } from '../common/transport';
import type { RedisCredential } from '../common/types';
import {
	deleteSessionTokenCookie,
	rateLimitConsume,
	redisConnectionTest,
	setSessionTokenCookie,
	validateSessionToken,
} from '../common/utils';

export class HttpForwardAuthTrigger implements INodeType {
	description = triggerDescription;

	methods = {
		credentialTest: { redisConnectionTest },
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const [req, res] = [this.getRequestObject(), this.getResponseObject()];
		const addResHeader = (key: string, value: string) => res.setHeader(key, value);

		const credentials = (await this.getCredentials('redis')) as RedisCredential;
		const redis = await getRedisClient(credentials);

		const authURL = this.getNodeParameter('authURL', '') as string;
		const loginURL = `${authURL}/login`;
		const loginRedirectURL = this.getNodeParameter('loginRedirectURL', '') as string;
		const logoutRedirectURL = this.getNodeParameter('logoutRedirectURL', '') as string;
		const enableHTTP = this.getNodeParameter('enableHTTP', false) as boolean;
		const rateLimit = this.getNodeParameter('rateLimit', false) as boolean;
		const remoteIp = rateLimit ? (req.headers[REMOTE_IP_HEADER] as string) : undefined;
		const rateLimitErrorMessage = this.getNodeParameter('rateLimitErrorMessage', '') as string;
		const loginTemplate = this.getNodeParameter('loginTemplate', '') as string;

		const webhookName = this.getWebhookName();

		let workflowData: INodeExecutionData[][] | undefined;
		let noWebhookResponse = true;

		if (webhookName === 'check') {
			const token = cookieParse(req.headers.cookie)[SESSION_KEY] ?? null;
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
			const token = cookieParse(req.headers.cookie)[SESSION_KEY] ?? null;
			const session = token && (await validateSessionToken(redis, token));
			if (session) {
				// Extend the expire date if needed
				setSessionTokenCookie(addResHeader, token, session.expiresAt, enableHTTP);
				res.status(302).redirect(loginRedirectURL);
			} else {
				deleteSessionTokenCookie(addResHeader);
				const pageContent = loginTemplate
					.replaceAll('#ERROR_MESSAGE#', '')
					.replaceAll('#LOGIN_URL#', loginURL);
				res.status(200).send(pageContent).end();
			}
		} else if (webhookName === 'default') {
			// CSRF protection
			const { origin } = req.headers;
			if (!origin || origin !== new URL(authURL).origin) {
				res.status(403).send('Error 403 - Forbidden').end();
			} else if (rateLimit && remoteIp && !(await rateLimitConsume(redis, remoteIp))) {
				const pageContent = loginTemplate
					.replaceAll('#ERROR_MESSAGE#', rateLimitErrorMessage)
					.replaceAll('#LOGIN_URL#', loginURL);
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
		} else if (webhookName === 'logoutPage') {
			const pageContent = logoutPageHTMLTemplate.replace('#LOGOUT_URL#', `${authURL}/logout`);
			res.status(200).send(pageContent).end();
		} else if (webhookName === 'logout') {
			// CSRF protection
			const { origin } = req.headers;
			if (!origin || origin !== new URL(authURL).origin) {
				res.status(403).send('Error 403 - Forbidden').end();
			} else {
				deleteSessionTokenCookie(addResHeader);
				res.status(302).redirect(logoutRedirectURL);
			}
		}
		return {
			noWebhookResponse,
			workflowData,
		};
	}
}
