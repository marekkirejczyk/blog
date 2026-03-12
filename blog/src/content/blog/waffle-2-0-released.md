---
title: "Waffle 2.0 released"
date: "2019-01-23"
description: "After weeks of hard work, I am glad to announce the release of Waffle version 2.0, with a dozen new functionalities."
heroImage: "https://cdn-images-1.medium.com/max/800/1*TC0x5SrhD-5fzSdBupd8ow.png"
---

After weeks of hard work, I am glad to announce the release of Waffle version 2.0, with a dozen new functionalities.

### What’s new?

**Documentation and website**  
Waffle now has detailed [documentation](https://ethereum-waffle.readthedocs.io/.) and a new [website](https://getwaffle.io/).

**Faster compilation with native and dockerized solc**  
By default, Waffle uses solcjs as it’s solidity compiler. This is convenient, because solcjs can be easily installed with the same tools as Waffle. On the other hand it tends to be slow for bigger projects.

With Waffle 2.0 you can now use blazing quick native and dockerized solc. If you don’t mind a couple of additional [setup steps](https://ethereum-waffle.readthedocs.io/en/latest/compilation.html). Stay tuned for some Benchmarks.

![A screen from a new website](https://cdn-images-1.medium.com/max/800/1*7nOkO4HBwfvEoMyGxcnLzQ.png)
*A screen from a new website*

**New chai matchers: _changeBalance_**  
The new _changeBalance_ and _changeBalances_ matchers allow checking if a balance of an account(s) changed, example below:

Read more about new matchers in the [documentation](https://ethereum-waffle.readthedocs.io/en/latest/features.html#change-balance).

**Support for TypeScript**  
The code is now rewritten in TypeScript with near complete support for developing with TypeScript. Notable exceptions are the chai matchers, which we plan to include in version 2.1.

**Fixtures**  
When extensively testing code dependent on smart contracts it is often useful to have a specific scenario play out before each test. That leads to repetition and slow code execution. With fixtures, you can clean-up your code and speed it up by a order of magnitude. Here comes an example fixtures declaration:

And here how to use it:

Read more about fixtures in the [documentation](https://ethereum-waffle.readthedocs.io/en/latest/features.html#fixtures).

**Others:**

-   Waffle now supports config files with both json and js extensions.
-   Contract linking should work for both solidity 4 and solidity 5
-   The compilation is covered with extensive end-to-end tests
-   Waffle is now officially released under **MIT license**

**Breaking changes:**

-   getWallet() function is not async anymore
-   Node versions older than 10 are not longer supported
-   A new format for compilation output files has been introduced

### Acknowledgments:

Waffle 2.0 was possible thanks to a group of wonderful contributors, in particular, I would like to thank:

-   [sz-piotr](https://github.com/EthWorks/Waffle/commits?author=sz-piotr) for implementing fixtures and migrating to TypeScript
-   [vanruch](https://github.com/EthWorks/Waffle/commits?author=vanruch) for implementing change balance checkers (and revertedWith in previous version)
-   [rzadp](https://github.com/EthWorks/Waffle/commits?author=rzadp) for implementing linking of smart contracts
-   [spherefoundry](https://github.com/EthWorks/Waffle/commits?author=spherefoundry) and [JustynaBroniszewska](https://github.com/EthWorks/Waffle/commits?author=JustynaBroniszewska) for their help
-   And last, but not least **special thanks** go to [snario](https://github.com/EthWorks/Waffle/commits?author=snario) for day to day testing, reporting and helping in fixing multiple issues along the way.

### Get updates

If you would like to get updates on Waffle ⭐️ and **follow us** Waffle [GitHub](https://github.com/ethworks/waffle).

### Ethworks

If would like to get updates on what we do — **follow** us on Medium and if you like the story 👏 👏 👏.
