import { RedisVectorStore } from '@langchain/redis';
import { createVectorStoreNode } from '@n8n/n8n-nodes-langchain/dist/nodes/vector_store/shared/createVectorStoreNode';
import type { RedisCredential } from '../common/types';
import { getRedisClient } from '../common/transport';

export class VectorStoreRedis extends createVectorStoreNode({
	meta: {
		displayName: 'Redis Vector Store',
		name: 'vectorStoreRedis',
		description: 'Work with your data in Redis Vector Store',
		icon: 'file:redis.svg',
		docsUrl: 'https://github.com/pedrozadotdev/n8n-nodes-gnr-stack',
		credentials: [
			{
				// eslint-disable-next-line n8n-nodes-base/node-class-description-credentials-name-unsuffixed
				name: 'redis',
				// @ts-ignore
				displayName: 'Redis Credential',
				required: true,
				testedBy: 'redisConnectionTest',
			},
		],
	},
	sharedFields: [
		{
			displayName: 'Index Name',
			name: 'indexName',
			type: 'string',
			default: '',
			required: true,
			description: 'The index name that will be use in Redis',
		},
	],
	loadFields: [],
	retrieveFields: [],
	// @ts-ignore
	async getVectorStoreClient(context, _filter, embeddings, itemIndex) {
		const credentials = (await context.getCredentials('redis')) as RedisCredential;
		const { client } = await getRedisClient(credentials);
		const indexName = context.getNodeParameter('indexName', itemIndex) as string;

		return new RedisVectorStore(embeddings, {
			redisClient: client,
			indexName,
		});
	},

	async populateVectorStore(context, embeddings, documents, itemIndex) {
		const credentials = (await context.getCredentials('redis')) as RedisCredential;
		const { client } = await getRedisClient(credentials);
		const indexName = context.getNodeParameter('indexName', itemIndex) as string;

		const vectorStore = new RedisVectorStore(embeddings, {
			redisClient: client,
			indexName,
		});

		await vectorStore.addDocuments(documents);
	},
}) {}
