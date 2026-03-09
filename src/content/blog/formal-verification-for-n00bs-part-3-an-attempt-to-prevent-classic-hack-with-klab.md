---
title: "Formal Verification for n00bs -Part 3: An attempt to prevent classic hack with KLab"
date: "2019-02-21"
description: "This is the third post of a series Formal Verification for n00bs:
Part 1: The K ecosystem
Part 2: Proving the correctness of a token
Part…"
heroImage: "https://cdn-images-1.medium.com/max/800/1*cKTz2GyNJ2I3ereGFcpR0Q.jpeg"
---

This is the third post of a series Formal Verification for n00bs:  
[Part 1: The K ecosystem](/blog/formal-verification-for-n00bs-part-1)  
[Part 2: Proving the correctness of a token](/blog/formal-verification-for-n00bs-part-2-proving-the-correctness-of-a-token)  
Part 3: A try to prevent classic hack with KLab  
[Part 4: Understanding K language](/blog/formal-verification-for-n00bs-part-4-understanding-k-language)

In this post, we will try to use KLab to show how a classic hack - Batch overflow could be prevented. We will also explore ACT in more details as well as reach some of its limitations.

> Reminder:  
> ACT is a fairly simple language provided by KLAB that helps in generating high-level semantics in K. The whole ecosystem is described in [part1](/blog/formal-verification-for-n00bs-part-1); some basics on ACT were already described in [part2](/blog/formal-verification-for-n00bs-part-2-proving-the-correctness-of-a-token).

### A tragedy that could be avoided

In the history of Ethereum, there were a few big hacks caused by implementation issues in smart contracts. One of the famous was the one with [batch](https://blog.matryx.ai/batch-overflow-bug-on-ethereum-erc20-token-contracts-and-safemath-f9ebcc137434) [overflow](https://medium.com/@peckshield/alert-new-batchoverflow-bug-in-multiple-erc20-smart-contracts-cve-2018-10299-511067db6536). We want to show that this problem could be avoided if formal verification had been used.

The code of the considerate contract is [here](https://etherscan.io/address/0xc5d105e63711398af9bbff092d4b6769c82f793d#code). The problem is in the following function:

The vulnerability is caused by code in line 3, where SafeMath should have been used:

> The attack for the original code is the following: you can pick a huge **\_value** such that for example **(2 \* \_value)** overflows the range of **uint256, e.g.  \_value = MAX\_INT/2+1** This will casue **amount to equal 2** and will bypasschecks in line 5, while amount added to receiver in line 9 will be much bigger than amount of all tokens in circulation.

Could this bug be noticed earlier? Let’s write high-level **intended** semantics for the _batchTransfer_ function and check if it is consistent with the actual code.

> Note: We have to change the interface of the _batchTransfer_ function since at this particular moment dynamic arrays are not yet supported by KLab. So, we will alter solidity code:

The announced above high-level semantics for the _batchTransfer_ function is as follows:

As an exercise, you can try to check that the above implementation of _batchTransfer_ function fails the proof of consistency with the semantics, however after fixing the bug in line 5 — it passes.

The fixed code is here:

_Watch out: the proof for the above on my MacBook Air took ~3 hours!_

#### Conclusion

This example shows how formal verification could prevent the hack. It also shows the limitations of practical verification with ACT.

### ACT cheatsheet

As we reached the first limitations of ACT it seems like a good moment to see what is the list of all available headers.

In [part2](/blog/formal-verification-for-n00bs-part-2-proving-the-correctness-of-a-token) of this series we described the general structure of a specification written in ACT, in particular, three headers: IF, IFF (particularly to express assumptions) and STORAGE. More headers below:

#### SUCH THAT

This is used solely to express constraints for statements (S). Let us see an example (special thanks to MrChico from dapphub for this example; all following examples are from official dapphub materials):

As you can see the above specifies that a function _change_ behaves in such a way that it modifies two particular positions at the storage (0 and 1 stands for the first two variables of the code of the function) with the constraint that the final values must sum up to the input value x.

#### GAS

You can specify accurate usage of your gas:

#### STACK

You can specify direct changes to stack:

#### CALLS

You can specify that an external function is called.

#### RETURNS

You can specify what is returned by your function:

#### BALANCE

You should be able to specify that a balance of a specific address is somehow changed. However, this is not yet available in KLab.

### Act vs K

KLab gives a great promise for a solid, reliable tool for formal verification. However, it is a tool on an early stage and there are significant limitations: lack of support for account balance or arrays are two examples. To be able to efficiently obtain a proof of correctness, one has to write Solidity code in a specific manner:

-   All functions should be short and do just one specific thing. If you have a complicated multi-purpose function in your contract, we recommend splitting into a few smaller specialized functions.
-   Calls to unknown code should be avoided.
-   The code should be as simple and straightforward as possible.

KLab is an upper layer of a stack of technologies (Details: [part1](/blog/formal-verification-for-n00bs-part-1)). Directly underneath KLab, there is a language K, in which we can also state our high-level semantics.

K is a more expressive language but comes with its own trade-offs:

-   K’s prover outputs just TRUE or FALSE, while KLab’s prover is equipped with a graphical debugger that helps to find a counterexample for a failed proof. (We will cover debugger in a future blog post)
-   Second, to write directly in K, one has to understand accurately EVM (more specifically: KEVM, which description of EVM written in K) which isn’t a piece of cake.

So that reality of today’s formal verification of EVM code is that one should understand both ACT and K to be efficient.

And so: next time, we will give you a smooth introduction to K!
