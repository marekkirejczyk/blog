---
title: "Testing contracts that use ENS with ENSBuilder"
date: "2018-09-28"
description: "When it comes to testing contracts and functionality that uses Ethereum Naming System (ENS), it is a bit tricky. It is difficult to test in…"
heroImage: "https://cdn-images-1.medium.com/max/800/1*tX6TatfVqjtOHuMDm0kakA.png"
---

> When it comes to testing contracts and functionality that uses [Ethereum Naming System](https://ens.domains/) (ENS), it is a bit tricky. It is difficult to test in isolation from ENS, and it is hard to stub ENS.

We stumble upon that challenge when working on [Universal Login SDK](https://github.com/EthWorks/ENSBuilder).

To solve that problem we created a simple library called [ENSBuilder](https://github.com/ethworks), which allows one to quickly set up and configure a standalone instance of ENS, on a local environment, in tests or on a test chain.

With ENSBuilder setup is as easy as a single method call:

```js
const ensAddress = await builder.bootstrapWith('example', 'eth');
```

And you already have a copy of ENS, up and running, as well as two domains registered: ‘ens’ and ‘example.ens’.

You can now register an address:

```js
await builder.registerAddress('marek', 'example.eth', '0x…');
```

### Ethers.js

The builder uses [ethers.js](https://github.com/ethers-io/ethers.js/) as a contract abstraction. W[eb3js](https://github.com/ethereum/web3.js/y) is also supported but will require you to pass a private key. We plan to add better web3js support if we see requests from people to do it. We would also happily accept PRs :)

Why Ethers.js you may ask?  
We find ethers.js to be a stable, light, feature complete and production ready alternative to web3js. Therefore we are using it both for tests as well as application code.

### Getting Started

For in-depth information as well as a quick tutorial **go to** [**EnsBuilder GitHub**](https://github.com/ethworks/ensbuilder)**.**

If you enjoyed this post, please hit the 👏 button and if you would like to get notified when new story shows up, click follow button below.

You can also follow us on [Facebook](https://www.facebook.com/ethworks) and [Twitter](https://twitter.com/ethworks).
