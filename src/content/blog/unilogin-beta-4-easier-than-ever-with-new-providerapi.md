---
title: "UniLogin Beta 4: Easier than ever with new providerAPI"
date: "2020-02-14"
description: "Note: We recently changed the name from Universal Login to Unilogin (link to the announcement here)."
heroImage: "https://cdn-images-1.medium.com/max/800/1*sWw6ONmAK_qj12w7eDrp4A.png"
---

_Note: We recently changed the name from Universal Login to Unilogin (link to the announcement_ [_here_](https://medium.com/universal-ethereum/universal-login-is-now-unilogin-eb4683efadfc)_)._

We are happy to announce Beta 4 with a new Web3 provider API.

### Integrating Web3 provider API

A new API is straightforward to integrate; you can do it in 3 easy steps:

-   **Install npm:**

```js
yarn add @universal-login/provider
```

-   **Import UniLogin**

```js
import UniLoginProvider from '@universal-login/provider';
```

-   **Configure existing web3:**

```js
web3.setProvider(
  UniLoginProvider.createPicker(web3.currentProvider)
);
```

That’s it. Done!

### **Wonders of UniLogin**

That is all you need to do to unleash all the wonders of UniLogin. When a user wants to interact with Ethereum for the first time, the dialog to pick UniLogin or MetaMask appears.

If the user picks MetaMask, the application works like it always did. If on the other hand, users pick UniLogin, the application guides her step by step into creating the account, including on-ramping.

![](https://cdn-images-1.medium.com/max/800/1*QLR_b3Og9Kooy4M53Rv2Rg.png)

If a user wants to make a transaction or interact with the blockchain, you will get a dialog that allows you to confirm and customize gas options.

![](https://cdn-images-1.medium.com/max/800/1*5-f3bTnTlmYcF8-UyVVfTQ.png)

On top of that, when the transaction is being mined a dialog is displayed, so that you don’t have to implement your own.

We implemented a small in-app wallet inside your application so that users don’t have to install anything or leave your application to have full control over his account.

### Button to trigger account management

You can add a UniLogin button. It allows the user to manage his account on demand. Adding the button is just one line in HTML:

```js
<button id="unilogin-button" />
```

![](https://cdn-images-1.medium.com/max/800/1*fndKhP71SzXdDcMiKb0v0Q.png)

### Summary

-   With UniLogin, using Ethereum dapps is easier than ever, with the user guided step by step without ever leaving your application.
-   DApp development is faster than ever, as you can save time not having to build onboarding and top-up.

### What is next?

This is last the last beta. We are now focusing on stability and minor features and getting the first RC1 out later this month and onward to a first stable version in March!

### Follow us!

To make sure you don’t miss the next posts in the series, follow us [Medium](https://medium.com/universal-ethereum) and [Twitter](https://twitter.com/unilogin).

### Pilot program

Still not signed-up for our Beta program? Fix it!

[Join our Pilot program](http://tiny.cc/unilogin) 👮🏽 🛩
