import { getRedisClient } from "../../nodes/HttpForwardAuth/transport";
import { resetJest, resetRedis, setupRedis, credentialsMock } from "../helpers";

jest.mock('redis', () => ({
	__esModule: true,
	createClient: jest.fn(),
}));

jest.useFakeTimers();

describe('Response Suite', () => {
	afterAll(resetJest);
	afterEach(resetRedis);

	it('Test', async () => {
		setupRedis();
		await getRedisClient(credentialsMock);
		expect(true).toBe(true)
	})
});
