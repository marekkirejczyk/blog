---
title: "useDApp update ‘22"
date: "2022-02-17"
description: "useDApp is on fire 🔥🔥🔥"
heroImage: "https://cdn-images-1.medium.com/max/800/1*qpJjsIGJo08mzbhNfCWk1A.png"
---

When we were [not looking](/blog/introducing-truefi-engineering), useDApp became a very popular framework for front-end development on Ethereum (and other EVM blockchains), with 1000+ public projects using the framework and a great community of contributors and some respected projects using it on production.

![](https://cdn-images-1.medium.com/max/800/1*QzbTaxhZbGPMbBJSriorhw.png)

We’re back to development after a break. And we are coming at you with a pocket full of updates. And there is more to come soon!

### **⏩ Multicall2**

We learned a lot since we first introduced useDApp. useContractCalls, which is at the heart of the framework, introduced a sweet functionality:  
🔢 combine multiple calls into a single multicall   
🔄 auto-refresh on network new block update or network/wallet change

Now, we are introducing a new hook: useCall. It is very similar, but we made one major change to it. It supports multicall2. Why is it important? With multicall v1, if a single call fails, there is no readable information about the error. With the new hook, you can easily retrieve the error:

```js
const { value, error } = useCall({
  contract: new Contract(tokenAddress, ERC20Interface),
  method: "balanceOf",
  args: [address],
});
```

```js
if(error) {
  //display error
} else {
  //do sth with value
}
```

The new format takes the ether.js’s contract as the parameter, not the pair (Interface and address) as previously. Thanks to this tweak, we will be able to implement another long-awaited feature: strong typing for useCall hook.

### **☀️ Web3Modal and Web3React**

We rebuilt the network connection state machine and removed Web3React dependency. Web3React held us back on the new functionality and resulted in complex code. The new rewrite is:

✅ Compatible with **Web3React** connectors (check the [example](https://example.usedapp.io/web3react) and [code](https://github.com/EthWorks/useDApp/blob/c70a76e91918a5501169fd64c5d0893a01803cd4/packages/example/src/components/account/Web3ReactConnectorButton.tsx))  
✅ Easy to integrate with **Web3Modal** (check the [example](https://example.usedapp.io/web3modal) and [code](https://github.com/EthWorks/useDApp/blob/6b90cbaa395f26d5c49acbdf0388e1756c15809e/packages/example/src/components/account/Web3ModalButton.tsx))

**⬇️ Smaller than ever**

With Web3React removed and better configuration (by @gasolin), the npm package size is now reduced from almost ~2MB to ~600kb.

### **🍪 Goodies**

#### **🖍 useTransactions updates**

useTransaction hook got better too, it:  
👉 now handles properly dropped and replaced transactions  
👉 in return state, includes the new state PendingSignature (when waiting for the user’s confirmation in MetaMask)  
👉 returns resetState, which allows for changing the state back to none, after the transaction has been executed

🏗 **Your friendly neighbour’s token hooks:** We added two new hooks for handling tokens:

👉 **useToken** — which allows to easily fetch information about a specific token, example below:

```js
const DAI_ADDRESS = '0x6b175474e89094c44da98b954eedeac495271d0f'
const dai = useToken(DAI_ADDRESS)
```

```js
return dai ? (
  <>
    <p>Dai name: {dai?.name}</p>
    <p>Dai symbol: {dai?.symbol}</p>
    <p>Dai decimals: {dai?.decimals}</p>
    <p>Dai totalSupply: {dai?.totalSupply ? formatUnits(dai?.totalSupply, dai?.decimals) : ''}</p>
  </>
) : null
```

👉 **useTokenList** — which allows to easily fetch information about a list of tokens (compatible with Uniswap’s [tokenlists](https://uniswap.org/blog/token-lists)), which returns the name of the list, logo URI, and list of tokens in a format similar to the one above. See example below:

```js
const { name, logoURI, tokens } = 
  useTokenList(UNISWAP_DEFAULT_TOKEN_LIST_URI) || {}
```

**🔌 More networks** Thanks to great refactoring by @gasolin adding, the new networks is easier than ever. Here are the new networks which have been added:

-   Optimism
-   Arbitrum
-   Avalanche
-   Moonbeam
-   BSC
-   Fanton, Theta, Palm, Metis, Cronos

**🏁 1.0 on horizont** With major refactoring done and the features introduced recently as well as those we want to introduce in upcoming weeks we are getting close to the end of the roadmap for version 1.0. We hope to release a stable version in spring ‘22.

👨‍👩‍👧‍👧 **The Community**

The thing we are most proud of is that there is now a community of 60 contributors and more than half of these features weren’t created by me or the TrueFi team, but external contributors.

![](https://cdn-images-1.medium.com/max/800/1*EGkTNE1y3V96XWpyImxYIA.png)

Great thanks to all the folks from the community and the guys from the TrueFi Engineering team!

📻 Stay tuned for more updates!  
Marek
