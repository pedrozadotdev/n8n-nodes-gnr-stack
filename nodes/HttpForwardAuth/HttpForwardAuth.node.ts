import type { IExecuteFunctions, INodeExecutionData, INodeType } from 'n8n-workflow';

import { responseDescription } from './descriptions';
import { redisConnectionTest } from './utils';

export class HttpForwardAuth implements INodeType {
	description = responseDescription;

	methods = {
		credentialTest: { redisConnectionTest },
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return [[]];
	}
}
