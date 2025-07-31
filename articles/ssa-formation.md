---
title: "Demystifying SSA: A Practical Guide to Static Single Assignment"
date:  "08-08-2028"
---
```

idea: things i should have in there...I'm thinking something in regards things
Structure:
    - What is it and where it's place in the compiler phase, 
    - the structure of SSA 
        * immediate-dominator (idom)
            [-- things to look for: explain edge cases so people can understand better]
            * mention the different methods (Brauns & lengauer_tarjan_idom)
            * and how those methods are structured--we'll be sticking with Brauns.
                * Use code example for the algoos as you explain them
        * dominator-frontier
            * merge points 
        * dominator-tree
        * Phi-node insertion
        * rename pass
        
        [-- identify major usage of ssa formation, compare to other methods
            * How and why it makes doing passes easier
            * How it improves the flexiablity of the compiler ]
        [-- include Use-Def chains in there too...somewhere in there]
        [-- mention llvm structure of doing SSA (maybe?)]
        [-- try to include important algos and data structures use for SSA and it's stages
            * fix-point iteration]
        [-- try to use good visuals for each algo and explantion so that anyone reading it can have
            a great understanding of what they're reading. ]

```

# Soon to Come...gotta wait buddy :|



