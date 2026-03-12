---
title: "Pragmatic smart contracting (TDD, Pairing, Waffle &amp; Buidler)"
date: "2020-10-13"
description: "With major security incidents popping up at least several times a year, an obvious question might arise: What would be a pragmatic…"
heroImage: "https://cdn-images-1.medium.com/max/1200/1*x0Of4Ru0WyUfx-gDcYCnIg.png"
---

With major security incidents popping up at least several times a year, an obvious question might arise: What would be a pragmatic approach to create high-quality, security-sensitive software like smart contracts?

### Formal Verification not here yet

We once put a lot of hope in formal verification (FV) but it became somewhat of a disappointment due to its high cost and slow process. Especially in times when it is common to skip not only the secondary security audit, but (sic!) in some cases even the first one (which we strongly recommend against!).

If you want to learn more about FV you might wanna have a look at our [formal verification series](/blog/formal-verification-for-n00bs-part-1) and [some conclusions](/blog/the-problem-with-formal-verification-what-we-learned-building-universal-login-part-2-security).

### TDD and pairing

The approach we adopted at Ethworks is the good old Extreme Programming duo: Test Driven Development (TDD) and Ping-Pong Pair Programming (PPPP).

![](https://cdn-images-1.medium.com/max/800/1*fSCuU_YAmCZZpwVOHpK7ag@2x.png)

DD consists in writing tests before implementation, which results in well-tested, well-designed, easily refactorable code and higher test coverage

PPPP on the other hand involves two developers working with one computer and switching keyboard as they go through different phases: writing test, implementation and refactoring. With two pairs of eyes on the code all the time, it is easier to avoid most defects, shortcuts, and build better understanding of the code and unintended consequences.

### The time reports

Recently one of our customers asked us about time reports that looked somewhat like this:

![Almost identical time reports from two developers](https://cdn-images-1.medium.com/max/1200/1*lTv8ADbVwnhmZfLgWYGIyg.png)
*Almost identical time reports from two developers*

We thought it is a great opportunity to share more about how we write smart contracts. If an image says a thousand words, then a live coding session is even better. Which was also an excuse to demonstrate the modern smart contract development stack with [Waffle](https://getwaffle.io/), [Buidler](https://buidler.dev/), as well other excellent tools like [TypeChain](https://github.com/ethereum-ts/TypeChain) and [Ethers.js](https://github.com/ethers-io/ethers.js/).

A good toolkit is crucial for effective TDD. We build Waffle with that in mind, providing wide range of matchers and short cohesive syntax. Speed of test execution is also crucial and that is where Buidler with it EVM comes in handy.

### Live demo

And so we use our presentation at [EthOnline](https://ethonline.org/) to perform the session during the first day. We build (well almost…) a simple decentralised exchange in AMM model in just 15 min. Checkout the video below:

While conference live demo can’t demonstrate how the coding looks like in real life, we hope it gives you a good glimpse.

For those who who didn’t heard about those techniques before, we provide a quick FAQ section below.

### FAQ

**Do you test drive all the code?** Yes, we write the majority of production code with TDD. One good exception to that might be spikes — prototypes, experimental pieces of code that we write to learn, or test a new tech or approach.

**Do you write all the code in pairs?** Nope, just the more challenging parts. Especially often at the beginning of a project or new big feature. Also for learning, skill sharing and on-boarding new developers.

**Isn’t pairing slower (and therefore more expensive)?** Not really, the consensus among practitioners seems to be that the speed is similar (maybe a bit slower) in the short term, but there is a huge boost in the long term.

Pairing tends to lead towards faster knowledge acquisition and skill sharing, fewer defects and higher quality code. All of that adds up. The more complex the challange, the more pronounced the benefit.

**Isn’t TDD slower (and more expensive)?** In a similar way as pairing, benefits of test driving tend to outweigh investments and boosts performance in the long term.

**I still don’t get it/believe it is more performant!** Both TDD and PPPP are somewhat unintuitive, but there is a lot of great in depth material about it. [“Test Driven Development…”](https://www.amazon.com/Test-Driven-Development-Kent-Beck/dp/0321146530) by Kent Beck is a good start for test driving and [Pair Programming Illuminated](https://www.amazon.com/Pair-Programming-Illuminated-Laurie-Williams/dp/0201745763/ref=sr_1_1?crid=1UV95XQEMI053&dchild=1&keywords=pair+programming+illuminated&qid=1602576733&sprefix=pair+programming+%2Caps%2C238&sr=8-1) is a great explanation of paring in general.

**Can I skip security audit for code written that way?** Definitely not.

### We await your feedback

Do you love it? Or do you hate it? Let us know in the comments ;)
