[![codecov](https://codecov.io/gh/pedrozadotdev/n8n-nodes-gnr-stack/branch/main/graph/badge.svg)](https://codecov.io/gh/pedrozadotdev/n8n-nodes-gnr-stack)
![](https://github.com/pedrozadotdev/n8n-nodes-gnr-stack/workflows/Release%20CI/badge.svg)
[![Version][npm-version]][npm-link] [![NPM Downloads][npm-downloads]][npm-link] [![License][npm-license]](https://github.com/pedrozadotdev/n8n-nodes-gnr-stack/blob/main/LICENSE.md)

[npm-version]: https://img.shields.io/npm/v/n8n-nodes-gnr-stack.svg
[npm-downloads]: https://img.shields.io/npm/dt/n8n-nodes-gnr-stack.svg
[npm-license]: https://img.shields.io/npm/l/n8n-nodes-gnr-stack.svg
[npm-link]: https://www.npmjs.com/package/n8n-nodes-gnr-stack

# n8n-nodes-gnr-stack

This is a set of n8n community nodes. It may be used in GNR(Grist/N8n/Redis) Stack.

## HTTP Forward Auth Trigger/Response Node
It can be used as a HTTP forward auth middleware with reverse proxies like Traefik and Caddy.

## Redis Vector Store Node
This is a node that uses Redis Stack Vector database as a vector store for your AI Agents.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)  
[Operations](#operations)  
[Credentials](#credentials)  
[Compatibility](#compatibility)  
[Usage](#usage)  
[Resources](#resources)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

_List the operations supported by your node._

## Credentials

Use [Redis](https://docs.n8n.io/integrations/builtin/credentials/redis/) as data storage.

## Compatibility

N8N 1.76.1 and above.

## Usage

1. Run `cd examples`;
2. Run `docker compose up -d`;
3. Access [http://localhost:8081](http://localhost:8081) and setup N8N;
4. Create a **Redis Credential** and change **Host** field to **redis**;
5. Go to **Settings**, **Community nodes** and install **n8n-nodes-gnr-stack**;
6. Create a workflow and import the **Simple_Workflow.json** file;
7. Use that *Redis Credential* in **HTTP Forward Auth Trigger** and **HTTP Forward Auth** nodes;
8. Activate the workflow and access [http://localhost:8080](http://localhost:8080).


## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
* [A Better Way to Store Passwords](https://auth0.com/blog/adding-salt-to-hashing-a-better-way-to-store-passwords/)
* [Caddy Forward Auth](https://caddyserver.com/docs/caddyfile/directives/forward_auth)
* [RedisVectorStore](https://js.langchain.com/docs/integrations/vectorstores/redis/)
