---
title: "useDApp 1.0 Released!"
date: "2022-04-14"
description: "Multichain support, WalletConnect new docs and more!"
heroImage: "https://cdn-images-1.medium.com/max/800/1*TS8vLpFSgBa8bqPeUgMVEQ.png"
---

### Multichain support, WalletConnect new docs and more!

We are excited to deliver useDApp version 1.0 with a bunch of major new features. It’s been a month of work for our [open-source team](/blog/introducing-truefi-engineering), so we are excited to finally move with the desired speed 🏎

### ⛓ Multichain support

We are starting with a big, long-awaited feature. useDApp now supports multiple chains at once. How does it work? Very simple.

Users can read from multiple networks at the same time. By default, hooks will use the “default network” or the one that the user is connected to for writing.

![Reading the balance of one account on multiple networks](https://cdn-images-1.medium.com/max/800/1*HiSQEoxufqBOmcszTOqwLg.png)
*Reading the balance of one account on multiple networks*

The user can only be connected to one chain for writing. This limitation comes from how wallets like MetaMask work and from the standard EIP1193. However, the user can switch networks easily and, as it’s always the case with useDApp, the UI will follow.

To start working with multi-chain, just specify URLs for different networks.

```js
const config: Config = {
  readOnlyChainId: Mainnet.chainId,
  readOnlyUrls: {
    [Mainnet.chainId]:  'https://mainnet.infura.io/v3/<INFURA_ID>',
    [Kovan.chainId]: 'https://kovan.infura.io/v3/<INFURA_ID>',
  },
}
```

To specify the chain, simply add a parameter to any read-hook, for example, read user balance from two different networks:

```js
const mainnetBalance = useEtherBalance(address, { chainId: Mainnet.chainId })
  const kovanBalance = useEtherBalance(address, { chainId: Kovan.chainId })
```

Check the full guide [here](https://usedapp-docs.netlify.app/docs/Guides/Connecting/Multi%20Chain).

### ⚡️ WalletConnect

It was supposed to be a big announcement that we integrated WalletConnect. The fun part is that in fact no integration was needed. It takes just a few lines of code to integrate WalletConnect, so instead we simply add a [guide](https://usedapp-docs.netlify.app/docs/Guides/Connecting/Wallet%20Connect) to our docs.

![](https://cdn-images-1.medium.com/max/800/1*XU4Q9Ro3qbvDQLZZP6VxeQ.gif)

```js
const { activate } = useEthers()
const provider = new WalletConnectProvider({
 infuraId: '<ChainId>',
})
await provider.enable()
activate(provider)
```

You can now integrate WalletConnect:

-   natively with just a few lines of code (see above)
-   use Web3Modal (if you have other wallets that you would like to support)
-   use Web3React connector (if you are migrating from older version).

### 🚎 Custom chains

It used to be that you need to fork and create a PR to useDApp to connect to a new chain. The reason was that the chainId was an _enum_ type. With the _chainId_ being now a _number_, adding a custom chain is just a few lines of code. First define all properties of the chain:

```js
export const TutorialChain: Chain = {
  chainId: 99999,
  chainName: 'TutorialChain',
  isTestChain: false,
  isLocalChain: false,
  multicallAddress: '0x0000000000000000000000000000000000000000',
  getExplorerAddressLink: (address: string) =>
    `https://tutorialchain.etherscan.io/address/${address}`,
  getExplorerTransactionLink: (transactionHash: string) =>
    `https://tutorialchain.etherscan.io/tx/${transactionHash}`,
}
```

And add it to the configuration:

```js
const config: Config = {
  readOnlyChainId: TutorialChain.chainId,
  readOnlyUrls: {
    [TutorialChain.chainId]: '<url of the custom chain>',
  },
  networks: […DEFAULT_SUPPORTED_CHAINS, TutorialChain],
}
```

And you are ready to use the new chain.   
Detailed description is available in the [documentation](https://usedapp-docs.netlify.app/docs/Guides/Connecting/Custom%20Chains).

### 📘Documentation

We redesigned the documentation, it is now better structured, with more guides and better focus on the user facing API. We also added live examples to play around with.

![](https://cdn-images-1.medium.com/max/800/1*RmhsplgTBm2mz08dPxYc3A.gif)

We also started working on a migration guide, which will be important in the future, as we will want to start deprecating stuff.

Checkout the new documentation 👉 [here](https://usedapp-docs.netlify.app/docs).

### 🗣 Discord

Another common request was to create a better place for communication, with Discord being the most common choice. And so we created a TrueFi open-source discord focused only on our open-source efforts:  
👇

[Join Discord now](https://discord.gg/ppFxC3E44X)

For that purpose, we migrated the previously existing 0xHack discord that included a useDApp channel. We are now much more responsive than we used to be!

### 👉 What’s next — useDApp 1.1

We feel that the useDApp core is feature complete, we will focus now on clean-up and optimizations. Especially, in version 1.1 and w we want to:

-   Reduce the amount of code required to create your very first application
-   Simplify configuration
-   Deprecate older methods/hooks and hide the internal API from the users
-   Work on optimisations

After that, we have a long list of ideas for new features, that we would like to add as plugins 🎶

As always, stay tuned 📻  
Follow us on [@truefieng](https://twitter.com/truefieng) to get updates
