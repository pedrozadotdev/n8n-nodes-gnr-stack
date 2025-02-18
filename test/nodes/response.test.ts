import { resetJest, resetRedis, setupResponse } from '../helpers';
import { HttpForwardAuth } from '../../nodes/HttpForwardAuth/HttpForwardAuth.node';
import { FORWARDED_USER_HEADER } from '../../nodes/common/constants';

jest.mock('redis', () => ({
	__esModule: true,
	createClient: jest.fn(),
}));

jest.useFakeTimers();

describe('Response Suite', () => {
	afterAll(resetJest);
	afterEach(resetRedis);

	it('Should fail if no HttpForwardAuthTrigger is found on workflow', async () => {
		const { context, mocks } = setupResponse({ parentNodes: [] });
		const node = new HttpForwardAuth();

		try {
			await node.execute.bind(context)();
		} catch (error) {
			expect(error.message).toBe('No HttpForwardAuthTrigger node found in the workflow');
			expect(mocks.sendResponseMock).toHaveBeenCalledWith({
				body: '500 Internal Server Error',
				__bodyResolved: true,
				headers: {
					[FORWARDED_USER_HEADER]: '',
				},
				statusCode: 500,
			});
		}
		expect.assertions(2);
	});

	it('Should not fail if continueOnFail is true', async () => {
		const { context, mocks } = setupResponse({ parentNodes: [], continueOnFail: true });
		const node = new HttpForwardAuth();

		expect(await node.execute.bind(context)()).toStrictEqual([
			[{ json: { error: 'No HttpForwardAuthTrigger node found in the workflow' } }],
		]);
		expect(mocks.sendResponseMock).toHaveBeenCalledWith({
			body: '500 Internal Server Error',
			__bodyResolved: true,
			headers: {
				[FORWARDED_USER_HEADER]: '',
			},
			statusCode: 500,
		});
	});

	it('Should authenticate user successfully', async () => {
		const { context, mocks } = setupResponse({ params: { userID: 'user' } });
		const node = new HttpForwardAuth();

		expect(await node.execute.bind(context)()).toStrictEqual([
			[{ json: { remoteIp: 'REMOTE_IP', status: 'success', user: 'user' } }],
		]);
		expect(mocks.sendResponseMock).toHaveBeenCalledWith({
			__bodyResolved: true,
			body: undefined,
			headers: {
				'Set-Cookie': expect.stringMatching(
					/n8n_hfa_session=[A-Za-z0-9]{32}; HttpOnly; SameSite=Lax; Expires=Mon, \d{1,2} \w{3} \d{4} \d{2}:\d{2}:\d{2} GMT; Path=\/; Secure/g,
				),
				location: 'http://localhost:8080/protected',
			},
			statusCode: 302,
		});
	});

	it('Should fail to authenticate the user', async () => {
		const { context, mocks } = setupResponse();
		const node = new HttpForwardAuth();

		expect(await node.execute.bind(context)()).toStrictEqual([
			[{ json: { remoteIp: 'REMOTE_IP', status: 'fail' } }],
		]);
		expect(mocks.sendResponseMock).toHaveBeenCalledWith({
			__bodyResolved: true,
			body: 'http://localhost:8080/login|Validation Error',
			headers: {
				'X-Forwarded-User': '',
				'content-type': 'text/html',
			},
			statusCode: 401,
		});
	});
});
