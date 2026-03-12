---
title: "Smart contract testing with ENS and Waffle"
date: "2020-08-05"
description: "With hundreds of applications using ENS, Ethereum-based decentralised naming system, we can all agree that it has become a widely…"
heroImage: "https://cdn-images-1.medium.com/max/800/1*PtLY0_AI0WnAjMXPXKYDew.png"
---

With hundreds of applications using ENS, an Ethereum-based decentralised naming system, we can all agree that it has become a widely recognised standard in the blockchain space.

Yet, when it comes to testing smart contracts, it’s difficult to test code that interacts with ENS. And for this exact reason, we’ve introduced an ENS module in Waffle.

The two most **common scenarios** involve:

-   **_testing smart contracts_** interaction with ENS,
-   **integration** or **end-to-end testing** of smart contracts together with a higher-level API/GUI.

We’ve already experienced this need on several occasions. In such situations, it’s useful to have ENS deployed in your test/development node. It’s somewhat complex to deploy a copy of ENS on your own, so we’ve added such an option to Waffle a while ago.

How does it work? It’s very simple.

### ENS attached to MockProvider

The most straightforward way to start using ENS is to use the built-in `MockProvider` singleton.

```js
import {MockProvider} from '@ethereum-waffle/provider';

const provider = new MockProvider();
await provider.setupENS();
const {ens} = provider;
```

### Creating domains

To create a top-level domain, use`createTopLevelDomain`function:

```js
await ens.createTopLevelDomain('test');
```

To create a subdomain, use `createSubDomain` function:

```js
await ens.createSubDomain('ethworks.test');
```

If you want to create a multi-level domain with a single call, use recursive option for `createSubDomain`:

```js
await ens.createSubDomain('waffle.ethworks.tld', {recursive: true});
```

### Setting address

To set an address for a given domain, use `setAddress` function:

```js
await ens.setAddress('vlad.ethworks.test', '0x001...03');
```

Option `{recursive: true}` is also available for setAddress.

And if you want to set address with reverse mapping, you can use:

```js
await ens.setAddressWithReverse('vlad.ethworks.tld', wallet);
```

Again, `reverse` option is available.

### Deploying ENS copy

If for some reason you need a stand-alone copy of ENS or you want to hook it up to another provider or deploy to another node/network, you can use `deployENS` function that will deploy a ready-to-work ENS copy (with top-level registrar and a resolver):

```js
const ens: ENS = await deployENS(wallet);
```

It’s a great pleasure to see ENS becoming a first-class citizen on Ethereum, and now that it’s so easy to test with it, we hope the adoption will accelerate even further.

We are [**Ethworks**](https://ethworks.io/). A truly remarkable team for your blockchain project.

Find us on [Twitter](https://twitter.com/ethworks), [GitHub](https://github.com/ethworks) and [Dribbble](https://dribbble.com/ethworks).
