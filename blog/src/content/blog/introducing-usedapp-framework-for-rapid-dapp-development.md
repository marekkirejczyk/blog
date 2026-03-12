---
title: "Introducing  useDApp - framework for rapid DApp development"
date: "2021-03-23"
description: "🐅 DApp - a new animal in the jungle"
heroImage: "https://cdn-images-1.medium.com/max/800/1*fEPkJS_jJp3cb9rU92uS3A.png"
---

This is the first post of our series on new useDApp features:  
1\. Introducing useDApp  
2\. [Deep dive into custom hooks and testing](/blog/usedapp-deep-dive-into-custom-hooks-and-testing)  
_3\. Coming soon: sending transactions and notifications_

### 🦁 useDApp - the new king of the jungle

If you are a DApp developer, you probably found out by now that DApps are quite a different animal than a typical web application. They come with their own set of constraints and good practices on both UX and engineering side.

A DApp designed with **user experience** in mind will:  
🔄 refresh after a new block arrives  
📺 work in a read-only mode before connecting a wallet  
✅ show the status of the current transactions  
… and much more.

A Dapp designed with **developer experience** in mind will:  
🧪 work on both Mainnet and testnets  
🍼 be easy to develop and extend  
🛡️ be error proof and easy to test  
… and much much more.

These requirements used to make writing quality DApps somewhat challenging. The tables are turning with useDApp. Time for the new king to establish a new order.

> **Pragmatic approach**  
> Over the last four years we tried half a dozen of different approaches (including **React, Redux, Rx, Bonds and DDD** architecture) and we found no perfect solution. We consider using **React hooks** to be the most pragmatic approach.

useDApp standardises common routines, abstracts a lot of complexity and encourages using good practices that were developed by the community.

> **Good design is opinionated**  
> useDApp builds on top of modern Dapp stack developed by the community, including libraries like [**ethers.js**](https://github.com/ethers-io/ethers.js/)**,** [**web3-react**](https://github.com/NoahZinsmeister/web3-react), [**multicall**](https://github.com/makerdao/multicall) pattern developed by Maker and [**Waffle**](https://getwaffle.io/) — used by useDApp for integration testing.

### 🚦Network connection

Let’s start with a simple example application that shows total ether committed to Ethereum 2.0 staking contract as well as the user ether balance. See the code below:

The example code will display the following interface, with Ethereum 2 staking contract balance.

![](https://cdn-images-1.medium.com/max/800/1*8U399MTOS1aQP9aEZvfTJg.gif)

Once you click _“Connect”_ button and connect your wallet (e.g. MetaMask), your account address and balance will show up.

If you go back to the Metamask and **switch to another wallet** of yours or **change the network** to _Görli (or any other testnet)_ **the interface will update** to show relevant information.

_Fun fact: even though ETH2 staking contract is not deployed to Görli, someone did transfer ETH to the same address on Görli network._

The example is available [here](https://example.usedapp.io/balance) and the code [here](https://github.com/EthWorks/useDApp/blob/master/packages/example/src/pages/Balance.tsx).

#### 👩‍🏫 Below is a quick explanation of key code features:

**Config —** (In lines 1–6) is a single object containing configuration for the whole application. In our example we set up the connection to read-only chain by specifying `readOnlyChain` and `readOnlyUrls`fields.

**DAppProvider** —(line 9) is a single component that you need to wrap your application in to manage the connection with blockchain.

**useEthers** — is a handy hook, that will provide all connection-related miscellanies: current **_chainId_,** current **_account_** and access to **_ethers_** instance connected to blockchain. And also a function that allows to manipulate connection like **_activateBrowser_.**

**activateBrowser()** —is a function that requests the user to connect to his browser wallet like MetaMask.

**useEtherBalance()** —is a hook that fetches ether balance.

Let’s look at all the work around connection management that you no longer need to worry about.

📡 **Connection management**

-   Application will connect to a preconfigured node in **read-only** mode at the page load.
-   `activateBrowser` method requests connection to MetaMask — no providers, no web3, no hustle.
-   If a user **changes the network** (e.g. Mainnet to Görli Testnet) from his wallet, all interested components will **automatically refresh** and display the state for the current network.

### 🔮 Tokens, Multicall and Magic

Let’s take another example. It displays all the tokens from [Uniswap default list](https://uniswap.org/blog/token-lists/) along with the user’s balance for each of them. See the code below.

The code will display the following interface. Note that you can connect and disconnect like in the previous example, as well as switch networks. The list of tokens on different networks will vary.

![](https://cdn-images-1.medium.com/max/800/1*ZUDoqVtcgYG8el2LoFFcNg.gif)

The example is available [here](https://example.usedapp.io/tokens) and the code [here](https://github.com/EthWorks/useDApp/blob/master/packages/example/src/pages/Tokens.tsx).

Now let’s look at what the framework has optimised for us under the hood.

📚 **Multicall**  Every single call to blockchain is handled by the framework, which provides a series of services:

-   **Combines multiple calls into one** — every single hook call is debounced and combined into one long list. Once all calls are collected, a single combined [multicall](https://github.com/makerdao/multicall) is issued.
-   **Refreshes on each new block** — the framework checks for a new block every few seconds, when a new block arrives, a single new multicall is issued.   
    The values that changed since the last block will trigger the related components to refresh. Only components affected by the changed values will be updated.
-   **Provides consistent view** — multicall guarantees that all values displayed are taken from the same block.
-   **Cache** — all repetitive calls are cached.
-   **Simple**— The whole multicall is dynamic and fully abstracted away. You can use hooks and just not think about it.

### 🪝Hooks

The previous example uses `useTokensBalance` hook. Let’s examine how to create a hook like that. See the code below.

Here are a few notes about the code:

-   `useContractCalls` — provides access to multicall services described in the previous section. It takes an array of calls or null as an argument.
-   Each _call_ contains an`abi` (provided as ethers `Interface **TODO**)` , smart contract `address`, `method` to be called along with its `args` .
-   If the application can’t do a call at a given moment (e.g. not yet connected), _falsy value_ needs to be provided as an argument. This is needed to preserve the order of React hooks calls. Hence the following construction: `tokenList && count ? ... : []` .

### 🧪 Tests

Testing is important even more in blockchain space. You will be happy to read we created a package just for testing web3-enabled hooks. We will write about it in the upcoming post.

### 🍩 **The goodies**

Additionally, the framework provides short but bound to grow list of helpers:

-   Block explorer links: `getExplorerAddressLink()`, `getExplorerTransactionLink()`
-   Chain: `getChainName()`, `isTestChain()`

### Links

🌐 [Website](http://usedapp.io)  
💻 [GitHub](https://github.com/ethworks/usedapp)  
🗒️ [Documentation](https://usedapp.readthedocs.io/)

### ✨ Sponsor us on GitCoin

This is just a beginning. There are [many new features](https://github.com/EthWorks/useDApp/issues/75) that we would like to build and building a framework is a lot of work: coding, testing, solving issues on GitHub, writing documentation and tutorials.

Help us build a dedicated team, make DApp developers’ life better and bring better UX to DApp users.

> _❤️_ [Sponsor useDApp on Gitcoin](https://gitcoin.co/grants/2357/usedapp)

### From Ethworks — creators of Waffle

We are Ethworks — creators of [Waffle](https://getwaffle.io/), the most advanced smart contract testing library used by over 3000+ projects.

For updates — follow us on [twitter](https://twitter.com/ethworks).
