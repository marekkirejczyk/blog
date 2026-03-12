---
title: "🦄 UniLogin and the Quest for a Better Txn Fees UX"
date: "2020-06-22"
description: "Transaction fees remain one of the main usability challenges for Ethereum and blockchains in general. There are a few different problems…"
heroImage: "https://cdn-images-1.medium.com/max/1200/1*EXSqTOTYimOoM45OTp1kGQ.png"
---

Transaction fees remain one of the main usability challenges for Ethereum and blockchains in general. There are a few different problems with them.

#### **Problem 1: Fluctuations**

Fluctuations gas prices make fees unpredictable. The chart below is just one illustration of how volatile gas prices can be.

![Historical gas prices on Ethereum](https://cdn-images-1.medium.com/max/1200/1*27a4nbU2EZIgHHz_AoZfJQ.png)
*Historical gas prices on Ethereum*

#### **Problem 2: Necessity of ETH**

A user may want to move ERC20 tokens around but still needs ETH to do it. This can result in what the user perceives as a bizarre situation where, despite possessing significant assets, they get an “Insufficient funds” error message.

![Surprising error message in Metamask](https://cdn-images-1.medium.com/max/800/1*ezxSCb_-NQB1LJW4S6x0Kg.png)
*Surprising error message in Metamask*

#### **Problem 3: Fee calculations**

The fee calculation model is somewhat complex, which leads to a bad user experience.

![Somewhat complex Metamask UI for managing transaction fees.](https://cdn-images-1.medium.com/max/1200/1*V6KmnWdXEXHsp_0NRu9WRQ.png)
*Somewhat complex Metamask UI for managing transaction fees.*

### A New Hope

Here is an interesting fact: in our interviews with dapp developers, many of them stated **they would gladly pay fees for their users, as long as they made money on their users’ actions.**

People familiar with the topic can already see that trend in _Argent’s fair use gas policy_.

To fight fee related challenges with UniLogin, we are introducing two fee modes.

### Mode 1: Meta-transactions with token fees

If the user has to pay their own fees, it is now possible to pay them with the ERC20 tokens already in their possession instead of ETH using meta-transactions. This means users not only don’t need to have ETH, they don’t have to even known what ETH is.

Below is a video of RSVPing to an event on [Kickback](https://kickback.events/)…

![RSVP to an event, pay transaction fee in DAI](https://cdn-images-1.medium.com/max/1200/1*yeXcg3UNr3G5ksGrA7jz2g.gif)
*RSVP to an event, pay transaction fee in DAI*

…and the full on-boarding flow with wallet creation using only DAI (with our favorite on-ramp provider [Ramp](http://ramp.network/)):

![DAI only onboarding](https://cdn-images-1.medium.com/max/1200/1*y6TzviCdsrKZScKqiw6hJg.gif)
*DAI only onboarding*

You can try this out with one of our partners: [GnosisSafe](https://gnosis-safe.io/), [Kickback](https://kickback.events/) or [Jarvis](https://beta.jarvis.network/).

### Mode 2: Fee-less transactions

If a dapp developer decides they want to cover user fees, the UX becomes even better. Just create a wallet and send transactions. No fee dialogs, no transaction speed widgets, no unnecessary UI bloat.

Check out the video below in Jarvis Wallet which demonstrates creation of a wallet…

![](https://cdn-images-1.medium.com/max/800/1*tMbcBE8IljKDCYVAhvaFIw.gif)

…and sending a transaction with this method:

![](https://cdn-images-1.medium.com/max/800/1*yRjyh5C5mFk0Ef6tfRQWlw.gif)

### The Future of Fees

These new features are introduced in UniLogin Beta 4 — 0.6.0

Shoot us an email to _marek \[at\] universallogin.io_ if you would like to test _fee-less_ transactions on your application.

In the future, we envision our customers dynamically making decisions of whether to cover a user’s fee or not based on various inputs: transaction data, the state of network and reputation of the user.

### Bonus: Web3 Modal ❤️ UniLogin

As a bonus, we are happy to let you know that [Web3 Modal](https://web3modal.com/) now supports UniLogin!

### Follow us!

To make sure you don’t miss the next posts in the series, follow us [Medium](https://medium.com/universal-ethereum) and [Twitter](https://twitter.com/unilogin).

### Pilot program

Still not signed-up for our Beta program? Fix it!

[Join our Pilot program](http://tiny.cc/unilogin) 👮🏽 🛩
