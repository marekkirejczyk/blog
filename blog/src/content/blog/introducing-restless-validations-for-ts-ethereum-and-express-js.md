---
title: "Introducing Restless: Validations for TS, Ethereum and Express.js"
date: "2021-01-14"
description: "Validations are … everywhere"
heroImage: "https://cdn-images-1.medium.com/max/1200/1*uA54CgI3xdYAYgnz__Arig.png"
---

Data validations and sanitization are ubiquitous throughout all kinds of programming. From web to mobile, from back-end to front-end, and of course, in the blockchain space, where a single injection can carry devastating results.

#### 😬 Validations are broken

It is also an annoying topic at times. There are many sanitization libraries, and one could expect that topic is exhausted. However, if we look for a lib with a reasonable list of expectations, you might find nothing that fits the bill.

The solid validation lib should have the following properties:

-   **Type safety** — sanitized data should automatically convert to a proper type (in TypeScript),
-   **Reusability** — Ability to define validations once and use them in multiple places,
-   **Composability** — ability to create new validations for complex types (i.e. objects and arrays) using previously defined validations,
-   **Readable errors** — if a validation fails, it should provide a meaningful message for the user,
-   **Customization** — the ability to easily create new completely custom validations,
-   **Simple** — if it takes more than 15min to learn the lib and start using it, it is too complex,
-   **Small** — our js project dependencies trees are already too big; we don’t want to make it even bigger.

It would be a nice bonus if it had out-of-the-box support for our favorite technologies like Express.js and, of course, Ethereum.

### 🎩 Introducing Restless

And so we created Restless, a simple library for validations that can rise to the challange! Core `@restless/sanitizers` library takes only **37kb** unpacked and has **zero dependencies**. Purely functional — just the way you like it. But let’s start from scratch.

#### 🛠️ Installation

Install core restless library to start using sanitizers and validation:

```
yarn add @restless/sanitizers
```

#### A simple example

Let’s start by casting a string to number, pretty straightforward:

```js
cast('123', asNumber) // 123
```

If one tries to cast invalid number representation an error will be thrown:

```js
cast('foo', asNumber) // TypeError
```

Error can be easily customized:

```js
cast('foo', asNumber, 'My custom message')
```

#### 🪄 Magic: Type safety

Now let’s assign result of a cast to variable of proper type, here is how it looks like in my Visual Studio Code:

![](https://cdn-images-1.medium.com/max/800/1*ke8p7So5MNzLd9n6tIrBTA.png)

Now let’s see what happens if I accidentally try to assign result to a wrong type:

![](https://cdn-images-1.medium.com/max/800/1*z5_NL-Y1ybgpuQFNS_yGZw.png)

Compiler and IDE knows the assignment is wrong, because there is a type mismatch. The data is sanitized and type safe.

### 🧰 Composability and reusability

You can define complex sanitizers for arrays:

```js
const sanitizer = asArray(asNumber)
```

And objects:

```js
const sanitizer = asObject({ foo: asNumber, bar: asString })
```

Once defined they can be used anywhere in the codebase.

#### ⚙️ Creating a custom validator

Creating a custom validator is simple, here is an example function that checks if value provided is string is only capital letters:

```js
export const asCapitalString: Sanitizer<string> = (value, path) =>  
  typeof value === 'string' && value.match(/[A-Z]/)
    ? Result.ok(value)
    : Result.error([{ path, expected: 'string' }])
```

#### 💸 **Ethereum**

For Ethereum support install `@restless/ethereum` package:

```
yarn add @restless/ethereum
```

Now you can use additional sanitizers:

asEthAddress('0xA5fE...f213', ...)
asBigNumber('10000000000000', ...)
asHexBytes(...)
`asTransactionHash(...)`

#### 🚄 **Express.js**

For Express.js support install `@restless/restless` package:

```
yarn add @restless/restless
```

You can now use a couple of new functions like`sanitize`, `asyncHandler` and `responseOf` which will make sure you are properly sanitizing your data and formulating responses. An example route could look like this:

```js
const app = express()
app.get('/:foo', asyncHandler(
  sanitize({
    foo: asNumber,
    body: asObject({
      bar: asNumber
    }),
    query: asObject({
      baz: asNumber
    })
  })
  (data) => responseOf(data)
))
```

The `sanitize` transforms the request into an object that matches a provided schema, `responseOf` formulates proper response with HTTP code and serialized JSON data. `asyncHandler` wraps it all into a middleware that can handle async functions and convert exceptions to proper HTTP responses.

#### 📕 Documentation

To learn more check documentation for the project on 🌐 [Restless website](http://getrestless.io/) and 💾 [Github](https://github.com/EthWorks/restless).

We are [Ethworks](https://ethworks.io/). A genuinely remarkable team for your blockchain project.

Follow us on 🐦 [Twitter](https://twitter.com/ethworks)!
