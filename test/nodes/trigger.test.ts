import { resetJest, resetRedis, setupTrigger } from '../helpers';
import { HttpForwardAuthTrigger } from '../../nodes/HttpForwardAuth/HttpForwardAuthTrigger.node';
import { logoutPageHTMLTemplate } from '../../nodes/HttpForwardAuth/templates';
import {
	FORWARDED_USER_HEADER,
	RATE_LIMIT_STORAGE_KEY,
	REMOTE_IP_HEADER,
	SESSION_KEY,
} from '../../nodes/HttpForwardAuth/constants';

jest.mock('redis', () => ({
	__esModule: true,
	createClient: jest.fn(),
}));

jest.useFakeTimers();

describe('Trigger Suite', () => {
	afterAll(resetJest);
	afterEach(resetRedis);

	it('Should return a Login Page when access GET /login', async () => {
		const { context, mocks } = setupTrigger();
		const node = new HttpForwardAuthTrigger();

		const returnData = await node.webhook.bind(context)();
		expect(returnData).toStrictEqual({
			noWebhookResponse: true,
			workflowData: undefined,
		});
		expect(mocks.resStatusMock).toHaveBeenCalledWith(200);
		expect(mocks.resSendMock).toHaveBeenCalledWith('http://localhost:8080/login|');
		expect(mocks.resEndMock).toHaveBeenCalled();
	});

	it('Should redirect to loginRedirectURL when a authenticated user access GET /login', async () => {
		const sessionId = '3c469e9d6c5875d37a43f353d4f88e61fcf812c66eee3457465a40b0da4153e0';
		const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
		const { context, mocks } = setupTrigger({
			request: {
				headers: {
					cookie: `${SESSION_KEY}=token`,
				},
			},
			redisStore: {
				[`${SESSION_KEY}:${sessionId}`]: JSON.stringify({
					id: sessionId,
					user: 'user',
					expires_at: Math.floor(expiresAt.getTime() / 1000),
				}),
			},
		});
		const node = new HttpForwardAuthTrigger();

		const returnData = await node.webhook.bind(context)();
		expect(returnData).toStrictEqual({
			noWebhookResponse: true,
			workflowData: undefined,
		});
		expect(mocks.resStatusMock).toHaveBeenCalledWith(302);
		expect(mocks.resRedirectMock).toHaveBeenCalledWith('http://localhost:8080/protected');
	});

	it('Should return a Logout Page when access GET /logout', async () => {
		const { context, mocks } = setupTrigger({
			webhookName: 'logoutPage',
		});
		const node = new HttpForwardAuthTrigger();

		const returnData = await node.webhook.bind(context)();
		expect(returnData).toStrictEqual({
			noWebhookResponse: true,
			workflowData: undefined,
		});
		expect(mocks.resStatusMock).toHaveBeenCalledWith(200);
		expect(mocks.resSendMock).toHaveBeenCalledWith(
			logoutPageHTMLTemplate.replace('#LOGOUT_URL#', 'http://localhost:8080/logout'),
		);
		expect(mocks.resEndMock).toHaveBeenCalled();
	});

	it('Should logout user when access POST /logout', async () => {
		const { context, mocks } = setupTrigger({
			webhookName: 'logout',
			request: {
				headers: {
					Origin: 'http://localhost:8080',
				},
			},
		});
		const node = new HttpForwardAuthTrigger();

		const returnData = await node.webhook.bind(context)();
		expect(returnData).toStrictEqual({
			noWebhookResponse: true,
			workflowData: undefined,
		});
		expect(mocks.resStatusMock).toHaveBeenCalledWith(302);
		expect(mocks.resRedirectMock).toHaveBeenCalledWith('http://localhost:8080/login');
	});
	it('Should test CSRF Protection on POST /logout', async () => {
		const { context, mocks } = setupTrigger({
			webhookName: 'logout',
		});
		const node = new HttpForwardAuthTrigger();

		const returnData = await node.webhook.bind(context)();
		expect(returnData).toStrictEqual({
			noWebhookResponse: true,
			workflowData: undefined,
		});
		expect(mocks.resStatusMock).toHaveBeenCalledWith(403);
		expect(mocks.resSendMock).toHaveBeenCalledWith('Error 403 - Forbidden');
		expect(mocks.resEndMock).toHaveBeenCalled();
	});

	it('Should check request without token on GET /check', async () => {
		const { context, mocks } = setupTrigger({
			webhookName: 'check',
		});
		const node = new HttpForwardAuthTrigger();

		const returnData = await node.webhook.bind(context)();
		expect(returnData).toStrictEqual({
			noWebhookResponse: true,
			workflowData: undefined,
		});
		expect(mocks.resStatusMock).toHaveBeenCalledWith(401);
		expect(mocks.resRedirectMock).toHaveBeenCalledWith('http://localhost:8080/login');
	});

	it('Should check request with valid token on GET /check', async () => {
		const sessionId = '3c469e9d6c5875d37a43f353d4f88e61fcf812c66eee3457465a40b0da4153e0';
		const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
		const { context, mocks } = setupTrigger({
			request: {
				headers: {
					cookie: `${SESSION_KEY}=token`,
				},
			},
			redisStore: {
				[`${SESSION_KEY}:${sessionId}`]: JSON.stringify({
					id: sessionId,
					user: 'user',
					expires_at: Math.floor(expiresAt.getTime() / 1000),
				}),
			},
			webhookName: 'check',
		});
		const node = new HttpForwardAuthTrigger();

		const returnData = await node.webhook.bind(context)();
		expect(returnData).toStrictEqual({
			noWebhookResponse: true,
			workflowData: undefined,
		});
		expect(mocks.resStatusMock).toHaveBeenCalledWith(200);
		expect(mocks.resSetHeaderMock).toHaveBeenCalledWith(FORWARDED_USER_HEADER, 'user');
		expect(mocks.resEndMock).toHaveBeenCalled();
	});

	it('Should check request with invalid token on GET /check', async () => {
		const sessionId = '3c469e9d6c5875d37a43f353d4f88e61fcf812c66eee3457465a40b0da4153e0';
		const { context, mocks } = setupTrigger({
			request: {
				headers: {
					cookie: `${SESSION_KEY}=token`,
				},
			},
			redisStore: {
				[`${SESSION_KEY}:${sessionId}`]: null,
			},
			webhookName: 'check',
		});
		const node = new HttpForwardAuthTrigger();

		const returnData = await node.webhook.bind(context)();
		expect(returnData).toStrictEqual({
			noWebhookResponse: true,
			workflowData: undefined,
		});
		expect(mocks.resStatusMock).toHaveBeenCalledWith(401);
		expect(mocks.resRedirectMock).toHaveBeenCalledWith('http://localhost:8080/login');
	});

	it('Should test CSRF Protection on POST /login', async () => {
		const { context, mocks } = setupTrigger({
			webhookName: 'default',
		});
		const node = new HttpForwardAuthTrigger();

		const returnData = await node.webhook.bind(context)();
		expect(returnData).toStrictEqual({
			noWebhookResponse: true,
			workflowData: undefined,
		});
		expect(mocks.resStatusMock).toHaveBeenCalledWith(403);
		expect(mocks.resSendMock).toHaveBeenCalledWith('Error 403 - Forbidden');
		expect(mocks.resEndMock).toHaveBeenCalled();
	});

	it('Should initiate authentication when access POST /login', async () => {
		const body = { user: 'user', password: 'password' };
		const { context } = setupTrigger({
			webhookName: 'default',
			request: {
				headers: {
					Origin: 'http://localhost:8080',
				},
				body,
			},
		});
		const node = new HttpForwardAuthTrigger();

		const returnData = await node.webhook.bind(context)();
		expect(returnData).toStrictEqual({
			noWebhookResponse: false,
			workflowData: [[{ json: body }]],
		});
	});

	it('Should initiate authentication when access POST /login with rate limit', async () => {
		const body = { user: 'user', password: 'password' };
		const { context, mocks } = setupTrigger({
			webhookName: 'default',
			request: {
				headers: {
					Origin: 'http://localhost:8080',
					[REMOTE_IP_HEADER]: 'REMOTE_IP',
				},
				body,
			},
			params: {
				rateLimit: true,
			},
		});
		const node = new HttpForwardAuthTrigger();

		const returnData = await node.webhook.bind(context)();
		expect(returnData).toStrictEqual({
			noWebhookResponse: false,
			workflowData: [[{ json: { ...body, remoteIp: 'REMOTE_IP' } }]],
		});
		expect(mocks.redisEvalShaMock).toHaveBeenCalledWith('RATE_LIMIT_SHA', {
			keys: [`${RATE_LIMIT_STORAGE_KEY}:REMOTE_IP`],
			arguments: [expect.any(String)],
		});
	});

	it('Should stop authentication when access POST /login and hit rate limit', async () => {
		const body = { user: 'user', password: 'password' };
		const { context, mocks } = setupTrigger({
			webhookName: 'default',
			request: {
				headers: {
					Origin: 'http://localhost:8080',
					[REMOTE_IP_HEADER]: 'REMOTE_IP',
				},
				body,
			},
			params: {
				rateLimit: true,
			},
			redisEvalShaFunc: () => [0]
		});
		const node = new HttpForwardAuthTrigger();

		const returnData = await node.webhook.bind(context)();
		expect(returnData).toStrictEqual({
			noWebhookResponse: true,
			workflowData: undefined,
		});
		expect(mocks.resStatusMock).toHaveBeenCalledWith(429);
		expect(mocks.resSendMock).toHaveBeenCalledWith('http://localhost:8080/login|Rate Limit Error');
		expect(mocks.resEndMock).toHaveBeenCalled();
	});
});
