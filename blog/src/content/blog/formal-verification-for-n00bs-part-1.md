---
title: "Formal Verification for n00bs: Part 1"
date: "2019-01-25"
description: "This is first in a series of blog posts on Formal Verification (FV)."
heroImage: "https://cdn-images-1.medium.com/max/800/1*9Uarzq7Zanzzz60tHyh_-A.png"
---

This is first in a series of blog posts on Formal Verification:  
Part 1: The K ecosystem  
[Part 2: Proving the correctness of a token](/blog/formal-verification-for-n00bs-part-2-proving-the-correctness-of-a-token)  
[Part 3: Formal Verification for n00bs -Part 3: An attempt to prevent classic hack with Act](http://Formal%20Verification%20for%20n00bs%20-Part%203:%20An%20attempt%20to%20prevent%20classic%20hack%20with%20Act)  
[Part 4: Understanding K language](/blog/formal-verification-for-n00bs-part-4-understanding-k-language)

### The motivation for Formal Verification

Security of smart contracts is still a crucial challenge: we all remember [the DAO](https://www.coindesk.com/understanding-dao-hack-journalists), [parity](https://blog.zeppelin.solutions/on-the-parity-wallet-multisig-hack-405a8c12e8f7) [hacks](https://www.coindesk.com/ethereum-software-parity-update-critical-bug-detected), a bunch of smaller attacks and the most recent [delayed hard fork](https://thenextweb.com/hardfork/2019/01/16/constantinople-ethereum-delayed/). We would like to see the future in which we can be way more confident about our code.

> Depending how you count, event over a half a billion dollars (by today’s Ethereum evaluation), was lost in a couple of biggest smart contract hacks.

What about if behind every responsible piece of code stands pure solid mathematics instead of personal conviction of developers? With formal verification tools for Ethereum finally maturing, it is now not only possible but also practical.

In this and following post we will be getting step by step into the world of K-framework, which allows to formally verify EVM smart contracts.

### The heart: Semantics and the K language

The heart of the whole ecosystem is language K. K is a language specially designed for defining semantics. Semantics describes the behavior of computer programs. For example, when we say that a construction **x++** for x that is _uint_ means that a program in Solidity executing it will always increase the value of x by 1, except for one value x = 2^256–1:

> Example of “low-level” semantics in plain words:  
> **x++** set value of **x** to **0**, if x = 2^256–1;  
> **x++** sets value of **x** to **x+1**; otherwise.

This type of semantics, describing the meaning of every single instruction, is a kind of low-level definition. Besides that, what K also allows is to create high-level semantics, feasible to formulate semantics like the one below.

> Example of “high-level” semantics in plain words:  
> Function **_bool isPrime(int x)_** returns **_true_** only if **_x_** is a prime.

To formally prove that your smart contract behaves as you wish, you need to provide:

-   low-level semantics of the language you use.
-   code of your program (EVM bytecode)
-   provide high-level (intended) semantics of your program

![](https://cdn-images-1.medium.com/max/800/0*_ZEJbmeeH9Xeu9oH)

Providing high-level semantics is the most interesting and at the same time most challenging: you have to formulate how you actually wish that your program behaves.

### Magic

Then the magic starts. The verifier is proving (or finding a counter-example) that your program together with low-level semantics of the programming language that you use, is indeed doing exactly the same stuff as behavior described by provided high-level semantics.

### The K ecosystem

The K-framework ecosystem is somewhat complex but contains all you need:

-   [K language](http://www.kframework.org/index.php/K_Tutorial) that allows you to write any kind of semantics;
-   Tooling that allows proving semantics using Z3 - a tool for automatic proving created by Microsoft Research;
-   Semantics for Ethereum Virtual Machine - KEVM, written by Everett Hildenbrandt;
-   Two (EDIT) c̶o̶m̶p̶e̶t̶i̶n̶g̶ [DSL](https://en.wikipedia.org/wiki/Domain-specific_language)s to create high-level semantics: act (part of [KLAB](https://github.com/dapphub/klab/blob/master/acts.md) created by dapphub) and [eDSL](https://github.com/runtimeverification/verified-smart-contracts/blob/master/resources/edsl.md) (created by runtimeverification).

*The ecosystem for creating proofs on EVM*

So the only additional work to do after the developing process is to write high-level intended semantics and put all the machinery to work.

The high-level semantics you can do it directly in K or use one of the mentioned DSLs tailored, particularly for Solidity.

### Let’s take a look at the example

The natural questions are born here: how complicated high-level semantics is possible to formulate in K? Below is an example of high-level semantics of a ERC20 _transfer_ function, written in Dapphub/klab specification language:

What does it all mean? We will answer this question in the very next blog post in the series. Spring is coming for formal verification!

Special thanks to Tomasz Kazana who’s work on formal verification in Ethworks lead to writing this blog post.

### Stay tuned

To get updates on formal verification and other Ethereum related topic **follow us on twitter:** [@ethworks](https://twitter.com/ethworks)

You can also follow us on Medium if you like the story 👏 👏 👏.
