---
title: "Learning AI coding is no longer optional. But it’s not vibe coding."
date: "2025-08-24"
description: "This is the first post in a series on AI-assisted coding. See the overview of the series below:"
heroImage: "https://cdn-images-1.medium.com/max/800/1*nngI6rf5B3CKY7W_NLt7dQ.png"
---

This is the first post in a series on AI-assisted coding. See the overview of the series below:

-   **👻 Part 1: Myths, misconceptions, and realistic expectations about AI-assisted coding**
-   **🧩**️ _Part_ 2: Fundamentals, practical techniques, and step-by-step workflows _(coming soon)_
-   🚀 _Part 3_: Advanced techniques and a look at what comes next _(coming soon)_

Recently at [**vlayer**](https://x.com/vlayer_xyz), we invested significant effort into learning AI-assisted coding. In this series, I want to share some very practical lessons on how to leverage AI to accelerate your daily workflow.

### **How Much Can AI Really Speed Up Coding?**

My overall impression is that AI can, in some cases, speed up coding by orders of magnitude — while in others, it can actually slow you down. The exact speed-up depends on the task at hand, the programmer’s skill (both in coding and in using AI), and the technology involved. After several weeks of practice, my conclusion is that a skilled coder can learn to use AI tools to accelerate daily work by a factor of **2–3×** on average. **The promise of such a gain makes learning it feel less like an option and more like a necessity.**

However, achieving this requires developing new skills — and those skills are the focus of this series. Before diving in, though, we need to clear a few things off the table.

### If AI is so good, why isn’t everyone using it?

I’m making a bold claim here. If AI can really speed up your work by 2–3×, why doesn’t everyone already use AI-assisted coding? There are a few things to unpack here:

**Most developers already use ChatGPT** instead of Google on a daily basis, but that’s only scratching the surface of what’s possible.

AI tooling has only recently matured to the point where it can serve as a true coding companion. Several developments happened in parallel:

-   **LLMs** have reached a stage where hallucinations, while still present, are occurring less and less frequently.
-   **Agent systems** emerged to help LLMs understand context more effectively. Examples include [Cursor](https://cursor.com/agents), [Claude](https://claude.ai/), [Lovable](https://lovable.dev/), and [Code Rabbit](https://www.coderabbit.ai/) — each representing a different category of agent systems. At vlayer, we use all of them for different kinds of tasks.
-   A growing **community of “_AI coders_”** developed best practices around building code with AI.

**Many developers simply haven’t noticed this shift yet.** They base their opinions on limited interactions with a narrow subset of today’s AI tools, without investing the time and effort to develop the right skillset.

Among these skeptics are influential voices like [DHH](https://www.youtube.com/watch?v=wz65rRHL6jM) and [Prime](https://www.youtube.com/watch?v=0pcwqcFyDfM), who take a more cautious stance and do not actively encourage developers to explore AI-assisted coding — which in turn slows down adoption.

### The Myths

It’s time to bust some common myths popularized by AI skeptics. These misconceptions hold many developers back from adopting AI coding.

**“AI coding is good for prototypes, but not for production code.”**  
In reality, AI can accelerate the entire process of creating production-ready code — covering research, planning, coding, refactoring, and testing. But it requires two things:

-   the operator must already be a skilled coder, and
-   they need to acquire new skills and learn a handful of new tools.

**“You can’t really learn coding when using AI.”**  
In fact, you can learn coding faster than ever. The risk lies in relying too heavily on AI and losing control of the codebase — preventing that is one of the hardest skills to master. On the flip side, AI can dramatically speed up learning: you can discuss design decisions, ask about best practices, and learn in minutes or hours what would otherwise take days or months of research and reading.

You still need to put in hours of trial-and-error learning and work your way through those AHA moments.

**“AI coding is only good for web development, not for low-level languages like Rust.”**  
There’s a grain of truth in this view. Tools like **Lovable** make it possible to build non-trivial web applications with zero coding skills, purely through _vibe coding_. As far as I know, comparable tools don’t yet exist for lower-level stacks such as C/C++/Rust, Android, or iOS. In those domains, developers still can rely on other tools and AI-assisted coding techniques. The difference between _vibe coding_ and _AI-assisted coding_ is something I will explain in one of the following paragraphs.

**“AI coding is less fun.”**  
The fun factor depends on how you use it. AI can take over the boring parts of coding — repetitive boilerplate, tedious debugging — leaving you with more time for the interesting problems. At the same time, there are still many situations where coding or debugging yourself is the better (and more satisfying) choice. The real fun comes from getting things done faster.

**“AI is making you dumber”**

There have been [studies](https://www.forbes.com/sites/dimitarmixmihov/2025/02/11/ai-is-making-you-dumber-microsoft-researchers-say/) suggesting that AI can make users dumber. I see a strong analogy to the internet: it placed nearly all of human knowledge online, freely available to anyone — yet most people spend their time scrolling through social media junk. I believe the same will happen with AI. Most people will use it mindlessly, but for those who can master it, AI will become a powerful tool.

This series is written to encourage the latter approach: using AI thoughtfully and deliberately, as a tool to amplify human ability rather than replace it.

**“AI is writing a lot of crapy code fast”**

This is generally true, and it highlights the importance of developing the skill of taming AI. The community has already created several useful techniques, which I’ll describe in detail in parts 2 and 3. These include working in small chunks, building feedback loops for the AI, and teaching it a specific coding style, architecture, and design. And a spoiler alert: AI still requires constant supervision.

Working with it remains hard work that demands significant skill. To be clear, in unskilled hands there is a serious risk in relying too heavily on AI: the codebase can quickly spiral out of control and spread like cancer.

### Vibe Coding vs. AI-Assisted Coding

The term [_vibe coding_](https://x.com/karpathy/status/1886192184808149383) was popularized by [Andrej Karpathy](https://x.com/karpathy). Originally, he described it as an alternative to traditional human coding. Vibe coding allows people with little to no coding experience to create entire applications. While powerful, it’s not necessarily the best choice for production code — especially in the context of large, custom, complex, and security-sensitive codebases.

That’s why I’d like to clearly differentiate between **vibe coding** and **AI-assisted coding**.

-   **Vibe coding** is when you let AI write the code without needing to read or fully understand it. If the code goes in the wrong direction, you simply ask the AI to start over. If there’s a bug, you ask the AI to fix it. In this mode, the AI acts as the coder, and you play the role of the product owner.
-   **AI-assisted coding**, on the other hand, is when developers understand most of the code and work together with AI, treating it more like a teammate — discussing ideas, writing and debugging together, and even doing informal code reviews. Many recommend thinking of AI as an _eager intern_ — a metaphor I’ll expand on in the next post in this series.

This second approach is gaining popularity quickly. However, I haven’t yet seen many good beginner-friendly resources that explain how it really works in practice. That’s exactly what this series aims to provide.

### AI is changing fast.

Much of what I write here may become outdated in a few months — or even in a few weeks. That’s why I’ll focus on principles wherever possible and aim to keep this series updated. Think of this as a snapshot of how I approach AI-assisted coding today.

### Acknowledgments

Many of the insights I share in this series come from training sessions with [Michał Prządka](https://www.michalprzadka.com/) and discussions with [kaimi](https://x.com/kaimi_eth). I am also grateful to [Piotr Szlachciak](https://x.com/PiotrSzlachciak) for his detailed feedback. Finally, the video that gave me the final push toward embracing AI was Andrej Karpathy’s [Software Is Changing (Again)](https://www.youtube.com/watch?v=LCEmiRjPEtQ).

Stay tuned for Part 2 on fundamentals, practical techniques and workflows.

_
