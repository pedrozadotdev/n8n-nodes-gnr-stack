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

type TriggerParamsType = {
	authURL: string;
	enableHTTP: boolean;
	loginRedirectURL: string;
	loginTemplate: string;
};

export class HttpForwardAuth implements INodeType {
	description = responseDescription;

	methods = {
		credentialTest: { redisConnectionTest },
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		let returnData: INodeExecutionData[] = [{ json: { status: 'fail' } }];
		try {
			const credentials = (await this.getCredentials('redis')) as RedisCredential;
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
			const {
				parameter: { authURL, enableHTTP, loginRedirectURL, loginTemplate },
				data: { remoteIp },
			} = this.getWorkflowDataProxy(0).$node[triggerInfo.name] as {
				parameter: TriggerParamsType;
				data: { remoteIp?: string };
			};
			const loginURL = `${authURL}/login`;

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
				headers.location = loginRedirectURL;

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
			this.sendResponse({
				body: '500 Internal Server Error',
				__bodyResolved: true,
				headers: {
					[FORWARDED_USER_HEADER]: '',
				},
				statusCode: 500,
			});

			if (this.continueOnFail()) {
				returnData = [{ json: { error: (error as { message: string }).message } }];
				return [returnData];
			}

			throw error;
		}

		return [returnData];
	}
}
