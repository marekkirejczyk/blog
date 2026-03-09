---
title: "Introducing Waffle support for Jest (experimental)"
date: "2020-09-08"
description: "Adding experimental support for Jest."
heroImage: "https://cdn-images-1.medium.com/max/800/1*fS06HBYQWm5dTJeofv9cZg.png"
---

### Waffle is on fire 🔥🔥🔥

In the short three months since the release of version 3, the number of projects using Waffle has doubled!

![](https://cdn-images-1.medium.com/max/800/1*GuXbavmvR7eeN4LgQSRcPA.png)

### Welcoming external contributors 🤝

We are happy to see more and more people contributing to Waffle. And today we introduce the first major feature fully created by an external contributor.

Thanks to the [great work](https://github.com/EthWorks/Waffle/pull/321) from [Adrian Li](https://github.com/adrianmcli) and testing by [Maarten Zuidhoorn](https://github.com/Mrtenz), we are releasing experimental support for Jest.

### Why Jest?

Mocha and Chai were the default choices for Waffle due to historical reasons. However, Jest has become the most popular testing framework by the number of downloads, and so, the time has come to include support for Jest in Waffle.

![](https://cdn-images-1.medium.com/max/800/0*uwooCKntn1ykrasM)

### Usage

To start using Jest matchers, install `@ethereum-waffle/jest` using yarn or your favourite package manager, i.e.:

```
yarn add @ethereum-waffle/jest
```

And below, there is a simple example of a test written with Waffle and Jest:

```js
import { waffleJest } from '@ethereum-waffle/jest';
```

```js
expect.extend(waffleJest);
```

```js
test('object assignment', () => {   
  expect(await token.balanceOf(wallet.address))
    .toEqBN(993);
});
```

### Documentation 📄

Currently, there is no documentation yet, so one has to take a look at [tests](https://github.com/EthWorks/Waffle/tree/master/waffle-jest/test/matchers) or [PR](https://github.com/EthWorks/Waffle/tree/master/waffle-jest/test/matchers) for more examples. Similarly to the _chai_ module, `@ethereum-waffle/jest` supports matchers related to:

-   **BigNumber** (`toEqBN`, `toBeGtBN`, `toBeLtBN`, `toBeGteBN`, `toBeLteBN)` e.g.:  
    `expect(BigNumber.from(2)).toEqBN(2)`
-   **Transaction revert:**  
    `await expect(token.transfer(sender, '0x0', 100)).toBeReverted();`   
    `await expect(token.transfer(sender, '0x0',100)`   
     `.toBeRevertedWith('transfer from the zero address');`
-   **Events**:  
    `await expect(tx).toHaveEmitted(contract, ‘Transfer’);   ``await expect(tx).toHaveEmittedWith(events, ‘Transfer’,`   
     `[sender, recipient, amount);`
-   **Calling functions**:  
    `expect(‘totalSupply’).toBeCalledOnContract(token);`   
    `expect(‘balanceOf’).toBeCalledOnContractWith(token, address);`
-   **Balance change:**  
    `await expect(...).toChangeBalance(sender, ‘-200’);`  
    `await expect(…).toChangeBalances([sender, receiver], [‘-200’, 200]);`
-   **Hex strings:**  
    `expect(‘0x28…0e’).toBeProperAddress();`  
    `expect(‘0x28…40’).toBeProperPrivateKey();`  
    `expect(‘0x702’).toBeProperHex(2)`

### Disclaimer ✋

We are introducing support for Jest in Waffle 3.1 as an experimental feature, which means that:

-   we don’t promise to keep and maintain this feature at this point,
-   there might be breaking changes introduced without a major version change,
-   we didn’t test how it works with [Buidler](https://buidler.dev/) and… we didn’t test much in general.

### Feedback 😍 ? 😠

We would love to hear your feedback on Jest support. Is it working? Do you love it or hate it? Let us know in comments!
