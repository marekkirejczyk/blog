---
title: "Our little secret superpower: Unification"
date: "2020-07-22"
description: "With the need for highly-skilled professionals, developing software has always been an expensive and slow process. With growing complexity…"
heroImage: "https://cdn-images-1.medium.com/max/800/1*lfjyQrh_Wv8JQNscAq1dfA@2x.png"
---

With the need for highly-skilled professionals, developing software has always been an expensive and slow process. With the growing complexity, it seems to be getting worse and worse.

> The increased complexity stems, among others, from the multitude of platforms and components (front-end, back-end, mobile, native, ops and other tooling).

> Then, there’s the fragmentation of technologies, with at least half a dozen of languages competing for the status of the back-end technology of choice, e.g. PHP, Python, Ruby, Rust, JS or Java. Each with a couple of competing frameworks.

What would it sound like if you were able to carry out your projects 30–40% cheaper and reduce your time to market by a similar factor?

Well, if it sounds good, we can tell you this is our little secret superpower. Here‘s how you can gain it too.

### 3 pillars of Unified Superpower

At Ethworks, we focus on blockchain and we like to reduce complexity wherever possible to make sure we can invest our time and resources in the right places. And so, we came up with the three pillars, which are:

-   unified technological stack,
-   unified architecture,
-   simplicity.

### Unified stack

While we work with different languages like _Solidity, Java, C++, Go, Rust_ or _Python_, we try to keep the majority of the work in **one language — TypeScript**.

Not only does it apply to **web** **front-end** **and** **back-end** but also to **mobile** development, **tooling** and **native desktop** applications.

![TypeScript across all platforms and components](https://cdn-images-1.medium.com/max/800/1*4FNr8mLd5bMUFcSAOq711A.png)
*TypeScript across all platforms and components*

### Unified architecture

We use the same four-layer architecture inspired by Domain Driven Development for each of the platforms and components. The description of the architecture goes way beyond the scope of this post but you can skim the illustration below to get the general idea.

![Unified architecture](https://cdn-images-1.medium.com/max/800/1*089krDnz3xhTksLWAnU4gA.png)
*Unified architecture*

What’s important about the architecture is that:

-   it can be used in all kinds of applications and components (front, back, web, mobile, tooling),
-   it’s loosely coupled and therefore the code is easy to test and reuse.

### Simplicity: less is more

We try to reduce the number of external dependencies throughout the stack. We prefer to use simple libraries rather than complex frameworks and reuse as much code as possible across different parts of the system.

For example, we use pure React without Redux or Rx for most applications. On top of that, we use React for both web and mobile (well, React Native for mobile, to be precise).

Domain, on the other hand, is written in pure TS with almost no external dependencies apart from basic validations and collection libraries.

### Long list of benefits

The list of savings coming from this approach is quite comprehensive. Keep reading for some notable examples of those.

### People

With the _unified technological stack_, it is **easy to**:

-   **onboard new team members,** as it is easy to explain and navigate between all the different layers and components of the system,
-   **move developers between components, applications and projects.** Once a developer knows how to work with a certain type of application, they can switch to another type with little to no investments,
-   **maintain a number of components** with a single developer,
-   **add and remove people from the team.**

The above points make booking simple and fun with little to no bench time (if there‘s not enough work in the ongoing projects, there are always some pending tasks in the common tooling).

### Tooling

-   **One CI/CD process:** With one technology, there’s only **one** building process as well as **one** continuous integration and delivery process, and all of them in **one** monorepo. One to configure and one to maintain. One to rule them all. Also, a lot of configuration is reusable.
-   **One domain:** All business logic can be implemented in pure TS in a shared project and reused throughout the codebase. Now, compare it to splitting your domain across languages (e.g. JS, Go, Java and Swift), how much can you reuse? None.
-   **One PR per feature:** It is easy and cheap to create a pull request that contains changes across multiple applications and still delivers a fully working and tested feature. Reviewing such a PR is simpler and faster too.
-   **End-to-end testing**: With monorepo and npm packages, _end-to-end_, as well as advanced _integration testing_, is simple. For _integration tests_, one can make an instance of a web server from the same JS process that is used by tests. For _E2E_ tests, it’s easy to create a new project that combines a couple of projects together and do comprehensive testing. Tests are fast and easy to add to your CI process. In the majority of cases, there’s no need to use Docker or any kind of virtualisation. Again, we **reduce complexity** and also **lower required computational resources**, while **shortening the feedback** loop.

### Code reuse

![Typical Monorepo structure](https://cdn-images-1.medium.com/max/800/1*bP0sm2NB55yr2pd7mFVCgg.png)
*Typical Monorepo structure*

-   **High code reusability:** It is extremely simple to reuse the code in all the different components. Just move it to a common project and access it through an npm package. This applies to types, validations, data transformations and the while domain, which leads us to…
-   It‘s easy to reuse the domain code and all kinds of utilities throughout all the components.
-   For mobile development, you can get even more reusability with one codebase written in React Native for both iPhone and Android. While the cost of writing an application in React Native comes with a bit of an overhead vs a native one, you can still have two applications at the price of one and still benefit from all other savings.
-   Investments in tooling are cheap and ROI is high. Below, I describe two examples.

![](https://cdn-images-1.medium.com/max/800/0*25jrbwub2ZY5Mgjx.png)

First, we developed [**restless**](https://github.com/ethworks/restless) — an open source library for type-safe validations. Its initial versions took just a couple of days to develop.   
It solves many problems we had in the past when using other libs or validations written from scratch:

-   readable errors,
-   type safety (it either returns a properly validated TS type or throws an error),
-   composability (you can create an advanced object validation using existing validations),
-   additionally, it’s side-effects free, which is always a desirable property.

It‘s currently used to validate i.a.:

-   HTML inputs (on the front-end)
-   HTTP request (on the back-end)
-   API responses (everywhere)

Several developers from our company have contributed to it. As the investment was cheap and the potential ROI is high, such improvements are no-brainers.

![](https://cdn-images-1.medium.com/max/800/0*UXz2TBEXsPGj363C.png)

[Reactive properties](https://github.com/UniLogin/reactive-properties) is another example. It’s a very lightweight alternative to Redux or Rx. Additionally, it utilises React Hooks. It was written by one developer and is now used in several applications written in both React and React Native.

### Bottomline

What used to require a team of 3–4 people in the companies I worked for before can now be done by a team of 2 or 3 developers. And, what’s also important, full-stacks require only half the knowledge and half the experience of a full-stack that works fluently with two technologies.

![](https://cdn-images-1.medium.com/max/800/1*NH7uYcQx7Id8_d_PcRRTZg.png)

Also, a project that would require 6–8 team members with mobile developers for Android and iPhone as well as a front-end and back-end developer can now be done with just 4–5 full-stack developers.

![](https://cdn-images-1.medium.com/max/800/1*RSlzscdeDj5Rw6puG2OPuA@2x.png)

You can spend some of that saved time on writing tests, which adds to the compound effect and also lowers the number of defects. Therefore, it accelerates the team even further.

This translates into budgets and timelines and directly into business performance.

And one more thing! Developing is way more fun this way!
