import type { Request, Response } from 'express';
import type { IWebhookFunctions } from 'n8n-workflow';
import { mock } from 'jest-mock-extended';
import { resetJest, resetRedis, setupRedis, credentialsMock } from "../helpers";
import { HttpForwardAuthTrigger } from "../../nodes/HttpForwardAuth/HttpForwardAuthTrigger.node";

jest.mock('redis', () => ({
	__esModule: true,
	createClient: jest.fn(),
}));

jest.useFakeTimers();

describe('Trigger Suite', () => {
	afterAll(resetJest);
	afterEach(resetRedis);

	it('Should return a Login Page when access GET /login', async () => {
		setupRedis();
		const node = new HttpForwardAuthTrigger();
		const context = mock<IWebhookFunctions>({
			getRequestObject: () => mock<Request>({
				// biome-ignore lint/suspicious/noExplicitAny: remove error for test
				headers: mock<any>({
					cookie: []
				}),
				header: () => undefined,
				body: {}
			}),
			getResponseObject: () => mock<Response>({
				// biome-ignore lint/suspicious/noExplicitAny: remove error for test
				setHeader: () => (mock<any>()),
				status: () => mock<Response>({
					redirect: () => {},
					end: () => mock<Response>(),
					send: () => mock<Response>({
						end: () => mock<Response>()
					})
				}),
			}),
			getCredentials: async <ICredentialsDecrypted>() => credentialsMock as unknown as ICredentialsDecrypted,
			getNodeParameter: name => {
				switch (name) {
					case 'authURL':
					case 'loginURL':
					case 'loginRedirectURL':
					case 'logoutRedirectURL':
						return 'http://localhost:8080';
					case 'rateLimit':
						return false;
					case 'enableHTTP':
						return true;
					case 'rateLimitErrorMessage':
						return 'Error Message';
					case 'loginTemplate':
						return '#LOGIN_URL#|#ERROR_MESSAGE#'
					default:
						return '';
				}
			},
			getWebhookName: () => 'setup',
		})

		const returnData = await node.webhook.bind(context)()
		expect(returnData).toStrictEqual({
			noWebhookResponse: true,
			workflowData: undefined
		})
	})
});
