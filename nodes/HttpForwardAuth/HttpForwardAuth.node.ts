import { NodeOperationError } from 'n8n-workflow';
import type {
	IDataObject,
	IN8nHttpFullResponse,
	IN8nHttpResponse,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeParameters,
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
		let returnData: INodeExecutionData[] = [{ json: { status: 'fail' } }];
		try {
			const credentials = await this.getCredentials('redis') as RedisCredential;
			const redis = await getRedisClient(credentials);

			const userID = this.getNodeParameter('userID', 0) as string | undefined;
			const validationErrorMessage = this.getNodeParameter('validationErrorMessage', 0) as string;

			let responseBody: IN8nHttpResponse;
			// Response Headers
			const headers = {} as IDataObject;
			const addResHeader = (key: string, value: string) => {
				headers[key] = value;
			};

			let statusCode = 200;

			const connectedNodes = this.getParentNodes(this.getNode().name);
			const triggerInfo = connectedNodes.find(({ type }) => type.includes(TRIGGER_NAME));
			if (!triggerInfo) {
				throw new NodeOperationError(
					this.getNode(),
					new Error('No HttpForwardAuthTrigger node found in the workflow'),
					{
						description: 'Insert a HttpForwardAuthTrigger node to your workflow',
					},
				);
			}
			const { parameter: triggerParams, item: triggerOutput } = this.getWorkflowDataProxy(0).$node[
				triggerInfo.name
			] as {
				parameter: INodeParameters;
				item: INodeExecutionData;
			};

			const loginTemplate = triggerParams.loginTemplate as string;
			const loginURL = triggerParams.loginURL as string;
			const afterLoginURL = triggerParams.afterLoginURL as string;
			const enableHTTP = triggerParams.enableHTTP as boolean;
			const rateLimit = triggerParams.rateLimit as boolean;
			const remoteIp = rateLimit ? (triggerOutput.json.remoteIp as string) : undefined;
			if (remoteIp) {
				returnData[0].json.remoteIp = remoteIp;
			}

			if (!userID) {
				statusCode = 401;
				headers['content-type'] = 'text/html';
				headers[FORWARDED_USER_HEADER] = '';
				responseBody = loginTemplate
					.replaceAll('#ERROR_MESSAGE#', validationErrorMessage)
					.replaceAll('#LOGIN_URL#', loginURL);
			} else {
				statusCode = 302;
				headers.location = afterLoginURL;

				const token = await generateSessionToken();
				const session = await createSession(redis, token, userID);
				setSessionTokenCookie(addResHeader, token, session.expiresAt, enableHTTP);

				if (remoteIp) {
					await rateLimitReset(redis, remoteIp);
				}

				returnData[0].json.status = 'success';
				returnData[0].json.user = userID;
			}

			const response: IN8nHttpFullResponse = {
				body: responseBody,
				__bodyResolved: true,
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
