---
title: "Introducing Waffle"
date: "2018-11-19"
description: "If you care about the quality of your software, you care about tests. You care about syntax and speed. We find a good testing framework is…"
heroImage: "https://cdn-images-1.medium.com/max/800/1*ibIslpTHApZbM41npK01xA.png"
---

If you care about the quality of your software, you care about tests. If you care about tests, you care about syntax and speed. We find a good testing framework is essential for creating quality software. Which brings us to smart contracts.

Today testing smart contracts seem cumbersome and tedious. Frameworks have verbose syntax and make it hard to formulate precise expectations.

And so we would like to announce waffle — a framework for testing smart contracts. It allows you to write short but expressive tests.

> Waffle is simpler and sweeter than Truffle.

For example, it is easy to check what was the reason for a revert:

It is easy to check which event was emitted and with what arguments:

I hope the code above is pretty self-explanatory. Here is a more complete example with a couple of tests written for OpenSolidity ERC20 based token:

> Waffle is aiming to replace Truffle. It is simpler, faster and easier to learn and use. However, it only focuses on testing and not on creating applications.

### About Waffle

> Waffle tastes best with ES6.

It is based on ethers.js and mocha.

Ethers.js is a stable, small and robust js lib for accessing ethereum. It gained a lot of traction recently and seems to be on the way to be the standard js JSON RPC abstraction.

### Roadmap

We tested Waffle for a couple of months now and it works well for us. Our next goal is **speed**. On our roadmap you can find:  
\- faster contract compilation  
\- faster test execution  
\- support for running tests with Geth (aside from ganache)  
and more!

### Getting started

To learn more and start using visit Waffle [GitHub.](https://github.com/ethworks/waffle)

### What about Mocking?

![](https://cdn-images-1.medium.com/max/800/1*1cC72iIqzgP4lCNCxpTG9g.png)

Do you miss mocking smart contract functionality? Check our other library [_doppelgänger_](https://github.com/EthWorks/Doppelganger)_._

### Get updates

If would like to get updates on what we do — **follow** us on Medium and if you like the story 👏 👏 👏.

If you would like to get updates on Waffle ⭐️ and **follow** us waffle [GitHub](https://github.com/ethworks/waffle).
