---
title: "Mocking Solidity smart contracts with Waffle"
date: "2020-05-22"
description: "Testing smart contracts written in Solidity is still somewhat cumbersome. One subtle reason is that we keep writing our unit tests as if…"
heroImage: "https://cdn-images-1.medium.com/max/800/1*vt0XUm3uRBXZmxsE0SByhg.png"
---

Testing smart contracts written in Solidity is still somewhat cumbersome. One subtle reason is that we keep writing our _unit tests_ as if they were _integration_ _tests_ and not how we would write _unit tests_.

Surprised? Take a look at the diagram below. It represents a test for a hypothetical on-chain market that allows buying ERC721 tokens for ERC20 tokens. To test even a basic functionality, one needs to touch several other smart contracts.

![Testing without mocks.](https://cdn-images-1.medium.com/max/800/1*FqThPqFBw-z_tqmYBg8yXg.png)
*Testing without mocks.*

How much easier would it be if we could test a single contract in isolation? Like in the picture below:

![Testing with mocks.](https://cdn-images-1.medium.com/max/800/1*O6UEZshMGq1vIhwpZxvxRA.png)
*Testing with mocks.*

### Mocking smart contracts

A common pattern is to create mock contracts for testing as separate `.sol` files. You can find them in the repositories of many popular projects like [OpenZeppelin](https://github.com/OpenZeppelin/openzeppelin-contracts/tree/master/contracts/mocks), [MakerDAO](https://github.com/makerdao/dss/tree/master/src/test), [Connext](https://github.com/ConnextProject/indra/tree/staging/modules/contracts/contracts/funding/test-fixtures), [Gnosis safe](https://github.com/gnosis/safe-contracts/tree/development/contracts/mocks).

Much as we find it to be a good practice, it is also a very limited method, and it complicates tests in several ways:

-   increases the amount of code in Solidity to write, build and maintain
-   limits test flexibility to a predefined mock functionality
-   makes test setup more complex, as each test might require deploying several contracts and advance them to a specific state
-   makes tests execute slowly (especially due to complex setup)

In practice, you see many tests that deploy and establish a whole predefined smart contract system and advance it to a specific state to test simple features.

Hoping to make a significant improvement, we introduced a new feature in Waffle 2.5.0 — dynamic mocking.

### Dynamic mocking

With dynamic mocking, you can create a mock for a smart contract directly from a JavaScript test and define its behavior. To create a mock, use `deployMockContract` and pass a wallet and _abi_ interface that it should comply with:

```js
const mockERC20 = await deployMockContract(sender, IERC20.abi);
```

Now, you can easily test a functionality in isolation. Let’s examine a simple smart contract that allows verifying if `msg.sender` has at least a predetermined number of tokens:

```js
pragma solidity ^0.5.15;

interface IERC20 {
    function balanceOf(address account) ... returns (uint256);
```

```js
...
}

contract AmIRichAlready {
    IERC20 private tokenContract;
```

```js
uint private constant RICHNESS = 1000000 * 10 ** 18;
```

```js
constructor (IERC20 _tokenContract) public {
        tokenContract = _tokenContract;
    }

    function check() public view returns (bool) {
        uint balance = tokenContract.balanceOf(msg.sender);
        return balance > RICHNESS;
    }
}
```

Now, we can test our contract extensively without adding extra Solidity code that would implement an _ERC20_ mock token or import external libraries. Let’s start with creating a contract and connect it to a mock:

```js
const [wallet, otherWallet] = new MockProvider().getWallets();
```

```js
beforeEach(async () =>  {
  mockERC20 = await deployMockContract(wallet, IERC20.abi);
  contract = await deployContract(wallet, AmIRichAlready, [mockERC20.address]);
});
```

And we can define what the mock should return and test the behavior of our method right away:

```js
it('wallet has little coins', async () => {
  await mockERC20.mock.balanceOf.returns(parseEther('999999'));
  expect(await contract.check()).to.be.equal(false);
});
```

Check out the full example on [Waffle GitHub](https://github.com/EthWorks/Waffle/blob/master/examples/mock-contracts/test/AmIRichAlready.test.ts).

### Defining behaviour

Use different variants of the syntax to define what method should return for different arguments, or if it should revert instead.

```js
await mockContract.mock.<nameOfMethod>.returns(<value>)
await mockContract.mock.<name>.withArgs(<args>).returns(<value>)
```

```js
await mockContract.mock.<nameOfMethod>.reverts()
await mockContract.mock.<name>.withArgs(<args>).reverts()
```

Detailed documentation for mocking functionality is available [here](https://ethereum-waffle.readthedocs.io/en/latest/mock-contract.html).

### Warning: Experimental

The feature has been released in Waffle 2.5 as experimental, so the API may change without complying with SEMVER rules. We plan to test this feature and collect feedback in the upcoming weeks and release the final API in Waffle 3.0.

We are [Ethworks](https://ethworks.io/). A truly remarkable team for your blockchain project.

Find us on [Twitter](https://twitter.com/ethworks), [Dribbble](https://dribbble.com/ethworks) and [GitHub](https://github.com/ethworks).
