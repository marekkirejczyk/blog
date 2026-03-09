---
title: "useDApp: Deep dive into custom hooks and testing"
date: "2021-04-06"
description: "This is the second post of our series on new useDApp features:
1. Introducing useDApp
2. Deep dive into custom hooks and testing
3. Coming…"
heroImage: "https://cdn-images-1.medium.com/max/800/1*NWfZfV39AhiUvhbny30S2g.png"
---

This is the second post of our series on new useDApp features:  
1\. [Introducing useDApp](/blog/introducing-usedapp-framework-for-rapid-dapp-development)  
2\. Deep dive into custom hooks and testing  
_3\. Coming soon: sending transactions and notifications_

### 🪝Hooks…

useDApp brings idiomatic React hooks paradigm to writing DApps to provide amazing developer and user experience. Read all about it in the [previous post](/blog/introducing-usedapp-framework-for-rapid-dapp-development). And now, as promised, it is time to talk about testing.

Automated testing is easy with two exceptions: UI and integration tests (e.g code interacting with blockchain). With useDApp, a basic building block of the app is a hook that is used for interaction with blockchain. Which is partially a UI code and partially integration code. Good support for testing hooks is therefore essential.

### 🍱 Example hook

Let’s examine a basic example — a `useTokenApproval` hook — that returns (you guessed it) — token approval for given _owner_ and _spender_ addresses.

```js
function useTokenAllowance(
  tokenAddress: string | Falsy,
  ownerAddress: string | Falsy,
  spenderAddress: string | Falsy
) {
  const [allowance] =
    useContractCall(
      ownerAddress &&
        spenderAddress &&
        tokenAddress && {
          abi: ERC20Interface,
          address: tokenAddress,
          method: 'allowance',
          args: [ownerAddress, spenderAddress],
        }
    ) ?? []
  return allowance
}
```

As you can see, it is a straightforward wrapper for `useChainCall` hook. A quick reminder what`useChainCall` does:

-   aggregates many calls into one call,
-   makes sure the component refreshes when return value changes (i.e. on new block, when the wallet or network changes).

A single argument of useChainCall is [ContractCall](https://usedapp.readthedocs.io/en/latest/core.html#contractcall) with the following fields:

-   contract interface as ethers.js `Interface` (see docs [here](https://docs.ethers.io/v5/api/utils/abi/interface/)),
-   contract _address_ to call the method on,
-   the name of the contract function to call,
-   array of function arguments (in this case the owner and spender addresses).

**Note 1:** React hooks always need to be called in the same order, regardless of whether all values have been initialized. Therefore you should call `useContractCall` with `null` as an argument if one of the variables is not yet initialized. Hence the example uses the following construction:`ownerAddress && spenderAddress && tokenAddress && ...`.

**Note 2:** As `useChainCall` can return null, make sure the custom hook will return a meaningful result, hence the following construction at the end:`?? []`

### 🎰 Testing hook

Let’s write a test for the hook. We start with a setup code that will create a _mock provider_ and _test wallets_. If you know [Waffle](https://getwaffle.io/), the code might look familiar.

```js
const mockProvider = new MockProvider()
const [deployer, spender] = mockProvider.getWallets()
```

And before each test deploy an ERC20 contract.

```js
let token: Contract
```

```js
beforeEach(async () => {
  const args = ['MOCKToken', 'MOCK', deployer.address, utils.parseEther("10")]
  token = await deployContract(deployer, ERC20Mock, args)
})
```

And now we can test the hook.

```js
await token.approve(spender.address, utils.parseEther('1'))
```

```js
const { result, waitForCurrent } = await renderWeb3Hook(
  () => useTokenAllowance(token.address, deployer.address, spender.address),
  {
    mockProvider,
  }
)
await waitForCurrent((val) => val !== undefined)
```

```js
expect(result.error).to.be.undefined
expect(result.current).to.eq(utils.parseEther('1'))
```

First, let’s approve the spender for 1 ETH so that we can check if our hook returns the correct value.

We will render the hook using the helper `renderWeb3Hook` function. It works like renderHook from the [react-testing-library](https://testing-library.com/docs/react-testing-library/intro/), but it wraps the hook into a special `DAppProvider`. To pass blockchain environment, we need to provide our previously created mockProvider to the hook as an argument.

React components update asynchronously. Reading data from the blockchain is also an async operation. To get the return value from the hook, wait for the result to be set: `await waitForCurrent((val) => val !== undefined)`

Finally we can check if our result is correct. `result.current` is a value returned from our hook. It should be equal to 1 Ether (1 with 18 zeros).

### 🚀 Coming next

We are testing a new version of useDApp right now with new hooks for sending transactions, tracking their status and showing notifications. We will publish the new blog post soon.

### 🔥 So what do I do now?

✅ Start using it (checkout the [website](http://usedapp.io/), [docs](https://usedapp.readthedocs.io/en/latest/getting-started.html)) and give us feedback ([GitHub](https://github.com/ethworks/usedapp))  
✅ Follow us on [Twitter](https://twitter.com/ethworks) for updates  
✅ Retweet to spread the word  
✅ Help us build a dedicated team and **fund us on the** [**Gitcoin**](https://gitcoin.co/grants/2357/usedapp)

We are [Ethworks](https://ethworks.io/). A genuinely remarkable team for your blockchain project.
