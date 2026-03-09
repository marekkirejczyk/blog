---
title: "Smart Contracts testing still sucks, how want to make it better"
date: "2020-04-29"
description: "Despite these challenging times, we remain very optimistic about the future of Ethereum ecosystem. Earlier this year, when ETH price…"
heroImage: "https://cdn-images-1.medium.com/max/1200/1*tyr3NElqUbauWHzfKJ0c4w.jpeg"
---

Despite these challenging times, we remain very optimistic about the future of Ethereum ecosystem. Earlier this year, when ETH price crashed, MakerDAO challenges arose. More recently, dForce protocol and Hegic have been hacked. And yet, we perceive it as a healthy part of ecosystem growth. As it is being tested, new problems arise and they need to be solved. Yet another important step in a long journey to a wide adoption.

![](https://cdn-images-1.medium.com/max/800/1*bdjy3mRDRmjYU_4QpV4VYg.jpeg)

Despite great optimism on the product’s side, we see many problems behind the curtains. One very close to our hearts relates to tooling for smart contracts development, which seems to be lagging behind. Not only is writing smart contracts still slow, error prone and somewhat cumbersome, but also we consider testing smart contracts challenging and at times even annoying.

![](https://cdn-images-1.medium.com/max/800/1*c2U_kigxuRGKiLzrlAtzww.jpeg)

We believe that smart contracts testing should be easy and fun. Good tests encourage developers to test more, build better code and refactor more often, which is highly correlated with better security and low development costs. Still, we find progress in terms of tooling somewhat disappointing.

What we find exciting is that, though written a while ago, our tool Waffle is now getting more and more popular. We discover over and over again that yet another acknowledged project is using it.

![](https://cdn-images-1.medium.com/max/800/1*Er0apJ1lFb82yNFuOsNOVA.png)

Waffle is also the default testing framework for [Buidler](https://buidler.dev/) — [Nomic Labs](https://nomiclabs.io/)’ building tool, with its adoption growing faster and faster.

![](https://cdn-images-1.medium.com/max/800/1*kZ2bRVgAQOC3K8cThYaDTw.jpeg)

While we see Waffle as a great start to build a better experience for smart contract developers, it doesn’t meet our high expectations on what a good tooling for writing tests should look like, yet.

![](https://cdn-images-1.medium.com/max/800/1*bMrtypPFfUdSGe0yzUylXw.jpeg)

And so, we are very glad to announce that our initial efforts have been appreciated and we have received a grant from Ethereum foundation to work on better testing experience with Waffle.

### Grant: Waffle new exciting features

We will be working on Waffle version 3.0 and introducing exciting new features, including:

-   Support for mocks, so that you can create a dynamic mock quickly from javascript e.g.

```js
const mockContract = await deployMockContract(wallet, Contract.interface);
await mockContract.mock.add.returns(2);
await mockContract.mock.mul.withArgs(2, 2).returns(4);
await mockContract.mock.div.withArgs(3, 0).reverts();
```

-   Support for fakes and putting expectations on function calls e.g:

```js
expect('functionName').to.be.calledOnContract(contract)
expect('functionName').to.be.calledOnContractWith(contract, ...args)
```

-   Support for testing with ENS
-   Support for contract flattening
-   Simplify configuration files
-   Support Ethers.js version 5.x
-   And more!

### Other awesome features

There are other Waffle features we were working on in the meantime and we hope they will make you as excited as we are. Two honorable mentions are:

-   Support for Vyper compilation
-   Show file name and line number when revert occurs, e.g.

![](https://cdn-images-1.medium.com/max/1200/1*2CgoEkmAMrMS9PfDJLV72A.png)

### Acknowledgements

We would like to take the opportunity to thank the Nomic Labs team, who are at the frontier of Ethereum tooling. Their support made it all possible for us.

### So, what’s next?

We are working hard and will deliver the features described above. We will post updates soon. Stay tuned!

Did you like the post? 👏👏👏

**We are** [**Ethworks**](https://ethworks.io/)**!**

Truly remarkable team for your blockchain project.

Find us on [Twitter](https://twitter.com/ethworks) and [Dribbble](https://dribbble.com/ethworks).
