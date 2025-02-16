import { resetJest, resetRedis, setupResponse } from '../helpers';
import { HttpForwardAuth } from '../../nodes/HttpForwardAuth/HttpForwardAuth.node';

jest.mock('redis', () => ({
	__esModule: true,
	createClient: jest.fn(),
}));

jest.useFakeTimers();

describe('Response Suite', () => {
	afterAll(resetJest);
	afterEach(resetRedis);

	it('Should fail if no HttpForwardAuthTrigger is found on workflow', async () => {
		const { context } = setupResponse();
		const node = new HttpForwardAuth();

		const bindExecute = node.execute.bind(context);
		expect(() => bindExecute()).rejects.toThrow('No HttpForwardAuthTrigger node found in the workflow')
	});
})
