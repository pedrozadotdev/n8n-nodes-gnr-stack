import { NodeOperationError } from 'n8n-workflow';
import type {
	IDataObject,
	IN8nHttpFullResponse,
	IN8nHttpResponse,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
} from 'n8n-workflow';

import { FORWARDED_USER_HEADER, TRIGGER_NAME } from './constants';
import { responseDescription } from './descriptions';
import { getRedisClient } from './transport';
import type { RedisCredential } from './types';
import {
	createSession,
	generateSessionToken,
	rateLimitReset,
	redisConnectionTest,
	setSessionTokenCookie,
} from './utils';

export class HttpForwardAuth implements INodeType {
	description = responseDescription;

	methods = {
		credentialTest: { redisConnectionTest },
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		let returnData: INodeExecutionData[] = [];
		try {
			const credentials = await this.getCredentials<RedisCredential>('redis');
			const redis = await getRedisClient(credentials);

			const userID = this.getNodeParameter('userID', 0) as string | undefined;
			const validationErrorMessage = this.getNodeParameter('validationErrorMessage', 0) as string;

			let responseBody: IN8nHttpResponse;
			// Response Headers
			const headers = {} as IDataObject;
			const addResHeader = (key: string, value: string) => (headers[key] = value);

			let statusCode = 200;

			const connectedNodes = this.getParentNodes(this.getNode().name);
			const triggerNode = connectedNodes.find(({ name }) => name === TRIGGER_NAME);
			if (!triggerNode) {
				throw new NodeOperationError(
					this.getNode(),
					new Error('No HttpForwardAuthTrigger node found in the workflow'),
					{
						description: 'Insert a HttpForwardAuthTrigger node to your workflow',
					},
				);
			}

			const loginTemplate = triggerNode.parameters?.loginTemplate as string;
			const loginURL = triggerNode.parameters?.loginURL as string;
			const afterLoginURL = triggerNode.parameters?.afterLoginURL as string;
			const enableHTTP = triggerNode.parameters?.enableHTTP as boolean;
			const rateLimit = triggerNode.parameters?.rateLimit as boolean;

			if (!userID) {
				statusCode = 401;
				headers['content-type'] = 'text/html';
				headers[FORWARDED_USER_HEADER] = '';
				responseBody = loginTemplate
					.replaceAll('#ERROR_MESSAGE#', validationErrorMessage)
					.replaceAll('#LOGIN_URL#', loginURL);
			} else {
				statusCode = 307;
				headers.location = afterLoginURL;

				const token = await generateSessionToken();
				const session = await createSession(redis, token, userID);
				setSessionTokenCookie(addResHeader, token, session.expiresAt, enableHTTP);

				if (rateLimit) {
					const remoteIp = this.evaluateExpression(
						`{{ $(${triggerNode.name}).item.json.remoteIp }}`,
						0,
					) as string | undefined;
					if (remoteIp) {
						await rateLimitReset(redis, remoteIp);
					}
				}
			}

			const response: IN8nHttpFullResponse = {
				body: responseBody,
				headers,
				statusCode,
			};
			this.sendResponse(response);
		} catch (error) {
			if (this.continueOnFail()) {
				returnData = [{ json: { error: (error as { message: string }).message } }];
				return [returnData];
			}

			throw error;
		}

		return [returnData];
	}
}
