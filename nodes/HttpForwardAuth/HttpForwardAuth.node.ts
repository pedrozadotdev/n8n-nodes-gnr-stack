import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
//import { NodeConnectionType, /*NodeOperationError*/ } from 'n8n-workflow';

import {
	//setupRedisClient,
	redisConnectionTest,
	//getValue,
	//setValue,
} from './utils';

export class HttpForwardAuth implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'HTTP Forward Auth',
		name: 'httpForwardAuth',
		group: ['transform'],
		version: 1,
		description: 'It can be used as a HTTP forward auth middleware',
		defaults: {
			name: 'HTTP Forward Auth',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'redisApi',
				required: true,
				testedBy: 'redisConnectionTest',
			},
		],
		properties: [],
	};

	methods = {
		credentialTest: { redisConnectionTest },
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return []
	}
}
