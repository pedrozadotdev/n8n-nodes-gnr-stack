import type {
	IWebhookFunctions,
	IWebhookResponseData,
	INodeExecutionData,
	INodeType,
} from 'n8n-workflow';

import { triggerDescription } from './descriptions';
import { redisConnectionTest } from './utils';

export class HttpForwardAuthTrigger implements INodeType {
	description = triggerDescription;

	methods = {
		credentialTest: { redisConnectionTest },
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const req = this.getRequestObject();
		const res = this.getResponseObject();

		const webhookName = this.getWebhookName();

		const mode = this.getMode() === 'manual' ? 'test' : 'production';
		const webhookUrlRaw = this.getNodeWebhookUrl('default') as string;
		const webhookUrl =
			mode === 'test' ? webhookUrlRaw.replace('/webhook', '/webhook-test') : webhookUrlRaw;
		let pageContent = req.url;
		let workflowData: INodeExecutionData[][] | undefined;

		if (webhookName === 'setup') {
			const loginTemplate = this.getNodeParameter('loginTemplate', '') as string;
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
