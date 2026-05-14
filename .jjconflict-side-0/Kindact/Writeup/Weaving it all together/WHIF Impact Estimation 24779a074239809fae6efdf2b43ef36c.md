# WHIF / Impact Estimation

Separate module that can take in various parameters, texts, descriptions, and evaluates them on all their side-effects and their impact on different SDGs.

Because this is very difficult to achieve (basically predicting the future!?!), the results should be an array of individual statements of *possible/likely outcomes*, each of them linked to some SDGs, possibly with a quantifier (0.3 x Environment, 0.4 x Social, …).

By default each statement would be taken as ‘true’ but with a grain of salt, i.e. might be weighted 0.5. Users should then be able to upvote/downvote each statement (likely accurate / likely false), which would effect the impact it has on the SDGs. I.e. if up- and downvotes are equal, it should have an impact of 0.5, and go proportionally towards 0 or 1 respectively. Or possibly even higher than 1, if e.g. upvotes are in a big majority?