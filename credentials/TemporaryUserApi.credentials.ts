import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class TemporaryUserApi implements ICredentialType {
	name = 'temporaryUserApi';

	displayName = 'Fallback User API';

	documentationUrl = 'https://github.com/pedrozadotdev/n8n-nodes-http-forward-auth?tab=readme-ov-file#credentials';

	properties: INodeProperties[] = [
		{
			displayName: 'Password',
			name: 'password',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true
		},
		{
			displayName: 'User',
			name: 'user',
			type: 'string',
			default: '',
			required: true
		}
	];
}
