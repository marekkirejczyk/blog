---
title: "New Waffle matcher: expect().to.be.calledOnContract()"
date: "2020-06-03"
description: "Perhaps you read my previous post about mocking smart contracts. Now, if you did, you may probably agree that writing tests is still a…"
heroImage: "https://cdn-images-1.medium.com/max/800/1*SEuHGmexw_2zxqiAC05u_A.png"
---

Perhaps you read my previous post about [_mocking smart contracts_](/blog/mocking-solidity-smart-contracts-with-waffle)_._ Now, if you did, you may probably agree that writing tests is still a challange. One of the fundamental reasons is that we approach them as if they were integration tests rather than unit tests.

This time, we are going to focus on another aspect of the same challenge: testing the effects of a call.

### Testing effects

Let’s examine once more a testing scenario for a hypothetical ERC721 market that allows trading non-fungible tokens for ERC20 tokens.

![](https://cdn-images-1.medium.com/max/800/1*LQRfEfTzKQZVIYdpVUyS3A.png)

Once a call to the _contract under test (Market_ on our diagram_)_ is made, one needs to inspect the effects of the call. We usually do that by querying the state of the related smart contracts. This might be somewhat complex at times, as we need to look into the state of different smart contracts, which in some cases might be private. In other cases, the state might poorly reflect interactions between contracts.

Wouldn’t it be useful if we could examine precisely what the interactions between a _contract under test_ and its dependencies are?

![](https://cdn-images-1.medium.com/max/800/1*83BoBB6qkY2B2G419p5hlQ.png)

### expect(…).to.be.calledOnContract(…);

For those complex cases, we’ve introduced a new matcher that allows us to specify expectations as to which function should be called, on which contracts, and with which arguments.

Let’s examine an example smart contract.

```js
pragma solidity ^0.6.2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract BasicToken is ERC20 {
  constructor(uint256 initialBalance) ERC20("Basic", "BSC") public {
    _mint(msg.sender, initialBalance);
  }
}

contract AmIRichAlready {
    BasicToken private tokenContract;
    uint private constant RICHNESS = 1000000 * 10 ** 18;
    constructor (BasicToken _tokenContract) public {
        tokenContract = _tokenContract;
    }

    function check() public view returns (bool) {
        uint balance = tokenContract.balanceOf(msg.sender);
        return balance > RICHNESS;
    }
}
```

Now, with the new matcher, we can test it in the following ways. Firstly, examine if a specific function on the contract was called:

```js
it('...', async () => {
  ...
  await contract.check();
  expect('balanceOf').to.be.calledOnContract(ERC20);
});
```

Secondly, specify exact parameters to be used in the call:

```js
it('...', async () => {
  ...
  await contract.check();
  expect('balanceOf').to.be
    .calledOnContractWith(ERC20, [wallet.address]);
});
```

Full example [available here](https://github.com/EthWorks/Waffle/tree/master/examples/called-on-contract).

### Works with Mock and… any contract

And here is the best part. The new matchers work with both normal and mock contracts described in the previous post. It is because Waffle records and filters EVM calls rather than inject code, like it is the case of popular testing libraries for other technologies.

### Important notes

This feature was introduced in Waffle version 2.5.

Currently, it doesn’t work with _Buidler_ which some of you are using together Waffle. However, we’ll be working with the Nomic Labs team in the following weeks to integrate the matchers into the framework.

We are [Ethworks](https://ethworks.io/). A truly remarkable team for your blockchain project.

Find us on [Twitter](https://twitter.com/ethworks), [Dribbble](https://dribbble.com/ethworks) and [GitHub](https://github.com/ethworks).
