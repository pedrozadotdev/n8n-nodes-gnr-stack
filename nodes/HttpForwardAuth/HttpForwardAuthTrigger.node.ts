import { Node } from 'n8n-workflow';
import type { IWebhookFunctions, IWebhookResponseData, INodeExecutionData } from 'n8n-workflow';

import { triggerDescription } from './descriptions';
import {
	//setupRedisClient,
	redisConnectionTest,
	//getValue,
	//setValue,
} from './utils';

export class HttpForwardAuthTrigger extends Node {
	description = triggerDescription;

	methods = {
		credentialTest: { redisConnectionTest },
	};

	async webhook(ctx: IWebhookFunctions): Promise<IWebhookResponseData> {
		const req = ctx.getRequestObject();
		const res = ctx.getResponseObject();

		const webhookName = ctx.getWebhookName();

		const mode = ctx.getMode() === 'manual' ? 'test' : 'production';
		const webhookUrlRaw = ctx.getNodeWebhookUrl('default') as string;
		const webhookUrl =
			mode === 'test' ? webhookUrlRaw.replace('/webhook', '/webhook-test') : webhookUrlRaw;
		let pageContent = req.url;
		let workflowData: INodeExecutionData[][] | undefined;

		if (webhookName === 'setup') {
			const loginTemplate = ctx.getNodeParameter('loginTemplate', '') as string;
			pageContent = loginTemplate
				.replaceAll('#ACTION#', webhookUrl)
				.replaceAll('#ERROR_MESSAGE#', '');
		}

		if (webhookName === 'default') {
			pageContent = JSON.stringify(req.body);
			workflowData = [[]];
		}

		res.status(200).send(pageContent).end();
		return {
			noWebhookResponse: true,
			workflowData,
		};
	}
}
