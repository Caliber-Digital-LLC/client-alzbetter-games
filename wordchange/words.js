/**
 * Word Change Game - Word Lists & Puzzle Generator
 * Contains curated word lists organized by category and difficulty.
 * All words are common, family-friendly, and suitable for seniors.
 */

// ============================================================================
// MASTER WORD LIST - All valid words for the game
// ============================================================================
const MASTER_WORDS = new Set([
    // 3-letter words (Easy)
    "ace", "act", "add", "age", "ago", "aid", "aim", "air", "all", "and",
    "ant", "any", "ape", "arc", "are", "ark", "arm", "art", "ash", "ask",
    "ate", "awe", "axe", "bad", "bag", "ban", "bar", "bat", "bay", "bed",
    "bee", "beg", "bet", "bid", "big", "bin", "bit", "bob", "bog", "bow",
    "box", "boy", "bud", "bug", "bun", "bus", "but", "buy", "cab", "can",
    "cap", "car", "cat", "cob", "cod", "cog", "cop", "cot", "cow", "cry",
    "cub", "cud", "cup", "cur", "cut", "dab", "dad", "dam", "day", "den",
    "dew", "did", "die", "dig", "dim", "dip", "doe", "dog", "don", "dot",
    "dry", "dub", "dud", "due", "dug", "dye", "ear", "eat", "eel", "egg",
    "elm", "end", "era", "eve", "eye", "fad", "fan", "far", "fat", "fax",
    "fed", "fee", "few", "fig", "fin", "fir", "fit", "fix", "fly", "foe",
    "fog", "for", "fox", "fry", "fun", "fur", "gab", "gag", "gap", "gas",
    "gay", "gel", "gem", "get", "gig", "gin", "gnu", "gob", "god", "got",
    "gum", "gun", "gut", "guy", "gym", "had", "hag", "ham", "has", "hat",
    "hay", "hem", "hen", "her", "hew", "hid", "him", "hip", "his", "hit",
    "hob", "hog", "hop", "hot", "how", "hub", "hue", "hug", "hum", "hut",
    "ice", "icy", "ill", "imp", "ink", "inn", "ion", "its", "ivy", "jab",
    "jag", "jam", "jar", "jaw", "jay", "jet", "jig", "job", "jog", "jot",
    "joy", "jug", "jut", "keg", "ken", "key", "kid", "kin", "kit", "lab",
    "lac", "lad", "lag", "lap", "law", "lay", "lea", "led", "leg", "let",
    "lid", "lie", "lip", "lit", "log", "lot", "low", "lug", "mad", "man",
    "map", "mar", "mat", "maw", "may", "men", "met", "mid", "mix", "mob",
    "mom", "mop", "mow", "mud", "mug", "nab", "nag", "nap", "net", "new",
    "nil", "nip", "nit", "nod", "nor", "not", "now", "nun", "nut", "oak",
    "oar", "oat", "odd", "ode", "off", "oft", "oil", "old", "one", "opt",
    "orb", "ore", "our", "out", "owe", "owl", "own", "pad", "pal", "pan",
    "pap", "par", "pat", "paw", "pay", "pea", "peg", "pen", "pep", "per",
    "pet", "pew", "pie", "pig", "pin", "pit", "ply", "pod", "pop", "pot",
    "pow", "pry", "pub", "pug", "pun", "pup", "put", "rag", "ram", "ran",
    "rap", "rat", "raw", "ray", "red", "ref", "rib", "rid", "rig", "rim",
    "rip", "rob", "rod", "roe", "rot", "row", "rub", "rug", "run", "rut",
    "rye", "sac", "sad", "sag", "sap", "sat", "saw", "say", "sea", "set",
    "sew", "she", "shy", "sin", "sip", "sir", "sis", "sit", "six", "ski",
    "sky", "sly", "sob", "sod", "son", "sop", "sot", "sow", "soy", "spa",
    "spy", "sub", "sue", "sum", "sun", "sup", "tab", "tad", "tag", "tan",
    "tap", "tar", "tax", "tea", "ten", "the", "thy", "tic", "tie", "tin",
    "tip", "toe", "tog", "tom", "ton", "too", "top", "tot", "tow", "toy",
    "try", "tub", "tug", "two", "urn", "use", "van", "vat", "vet", "via",
    "vie", "vim", "vow", "wad", "wag", "war", "was", "wax", "way", "web",
    "wed", "wee", "wet", "who", "why", "wig", "win", "wit", "woe", "wok",
    "won", "woo", "wow", "yak", "yam", "yap", "yaw", "yea", "yes", "yet",
    "yew", "you", "zap", "zed", "zen", "zip", "zoo",

    // 4-letter words (Medium)
    "able", "ache", "acre", "aged", "aide", "aims", "also", "ante", "aqua",
    "arch", "area", "aria", "army", "arts", "aunt", "auto", "baby", "back",
    "bade", "bait", "bake", "bald", "bale", "ball", "band", "bane", "bang",
    "bank", "bare", "bark", "barn", "base", "bash", "bath", "bead", "beak",
    "beam", "bean", "bear", "beat", "beck", "beds", "beef", "been", "beer",
    "beet", "bell", "belt", "bend", "bent", "best", "bias", "bike", "bile",
    "bill", "bind", "bird", "bite", "bits", "blow", "blue", "blur", "boar",
    "boat", "body", "boil", "bold", "bolt", "bomb", "bond", "bone", "book",
    "boom", "boot", "bore", "born", "boss", "both", "bout", "bowl", "boys",
    "brag", "bran", "brat", "bred", "brew", "brim", "buck", "buds", "bugs",
    "bulb", "bulk", "bull", "bump", "bunk", "burn", "bury", "bush", "bust",
    "busy", "cafe", "cage", "cake", "calf", "call", "calm", "came", "camp",
    "cane", "cape", "caps", "card", "care", "carp", "cars", "cart", "case",
    "cash", "cast", "cats", "cave", "cell", "chat", "chef", "chew", "chin",
    "chip", "chop", "city", "clad", "clam", "clan", "clap", "claw", "clay",
    "clip", "club", "clue", "coal", "coat", "code", "coil", "coin", "cola",
    "cold", "cole", "colt", "comb", "come", "cone", "cook", "cool", "cope",
    "copy", "cord", "core", "cork", "corn", "cost", "cosy", "cozy", "crab",
    "crop", "crow", "cube", "cubs", "cuff", "cure", "curl", "cute", "dads",
    "dame", "damp", "dare", "dark", "darn", "dart", "dash", "data", "date",
    "dawn", "days", "deal", "dean", "dear", "debt", "deck", "deed", "deem",
    "deep", "deer", "deli", "dell", "demo", "dent", "desk", "dial", "dice",
    "diet", "digs", "dill", "dime", "dine", "dire", "dirt", "disc", "dish",
    "disk", "dive", "dock", "does", "dogs", "doll", "dome", "done", "doom",
    "door", "dose", "dots", "dove", "down", "doze", "drab", "drag", "draw",
    "drew", "drip", "drop", "drum", "dual", "duck", "duel", "duet", "duke",
    "dull", "dumb", "dump", "dune", "dunk", "dusk", "dust", "duty", "dyed",
    "each", "earl", "earn", "ears", "ease", "east", "easy", "eats", "echo",
    "edge", "edit", "eels", "eggs", "else", "emit", "ends", "envy", "epic",
    "even", "ever", "evil", "exam", "exit", "eyes", "face", "fact", "fade",
    "fail", "fair", "fake", "fall", "fame", "fang", "fare", "farm", "fast",
    "fate", "fawn", "fear", "feat", "feed", "feel", "fees", "feet", "fell",
    "felt", "fend", "fern", "fest", "feud", "file", "fill", "film", "find",
    "fine", "fire", "firm", "fish", "fist", "fits", "five", "flag", "flak",
    "flam", "flan", "flap", "flat", "flaw", "flea", "fled", "flew", "flip",
    "flit", "flog", "flop", "flow", "foam", "foes", "foil", "fold", "folk",
    "fond", "font", "food", "fool", "foot", "fore", "fork", "form", "fort",
    "foul", "four", "fowl", "fray", "free", "fret", "frog", "from", "fuel",
    "full", "fume", "fund", "furs", "fuse", "fuss", "gain", "gait", "gale",
    "game", "gang", "gape", "gaps", "garb", "gash", "gasp", "gate", "gave",
    "gaze", "gear", "gels", "gems", "gene", "gent", "gift", "gild", "gill",
    "gilt", "girl", "gist", "give", "glad", "glen", "glib", "glow", "glue",
    "glum", "glut", "gnat", "gnaw", "goal", "goat", "gods", "goes", "gold",
    "golf", "gone", "gong", "good", "goof", "gore", "gory", "gosh", "gown",
    "grab", "grad", "gram", "gray", "grew", "grey", "grid", "grim", "grin",
    "grip", "grit", "grow", "grub", "gulf", "gulp", "gums", "gunk", "guns",
    "guru", "gush", "gust", "guts", "guys", "gyms", "hack", "hail", "hair",
    "hale", "half", "hall", "halt", "hams", "hand", "hang", "hank", "hare",
    "hark", "harm", "harp", "hash", "hasp", "haste","hate", "hats", "haul",
    "have", "hawk", "haze", "hazy", "head", "heal", "heap", "hear", "heat",
    "heed", "heel", "heir", "held", "hell", "helm", "help", "hems", "hens",
    "herb", "herd", "here", "hero", "hers", "hewn", "hide", "high", "hike",
    "hill", "hilt", "hind", "hint", "hips", "hire", "hiss", "hits", "hive",
    "hoax", "hobs", "hock", "hogs", "hold", "hole", "holy", "home", "hone",
    "hood", "hoof", "hook", "hoop", "hope", "hops", "horn", "hose", "host",
    "hour", "howl", "hubs", "hued", "hues", "hugs", "hulk", "hull", "hump",
    "hums", "hung", "hunk", "hunt", "hurl", "hurt", "hush", "husk", "huts",
    "hymn", "iced", "icon", "idea", "idle", "idol", "inch", "info", "inks",
    "inns", "into", "ions", "iris", "iron", "isle", "itch", "item", "jabs",
    "jack", "jade", "jail", "jake", "jams", "jane", "jars", "java", "jaws",
    "jays", "jazz", "jean", "jeep", "jeer", "jell", "jerk", "jest", "jets",
    "jigs", "jilt", "jinx", "jive", "jobs", "jock", "jogs", "john", "join",
    "joke", "jolt", "jots", "jowl", "joys", "judo", "jugs", "jump", "june",
    "junk", "jury", "just", "jute", "kale", "keen", "keep", "kegs", "kelp",
    "kept", "keys", "kick", "kids", "kill", "kiln", "kilt", "kind", "king",
    "kink", "kiss", "kite", "kits", "knee", "knew", "knit", "knob", "knot",
    "know", "labs", "lace", "lack", "lacy", "lads", "lady", "lags", "laid",
    "lair", "lake", "lamb", "lame", "lamp", "land", "lane", "laps", "lard",
    "lark", "lash", "lass", "last", "late", "laud", "lawn", "laws", "lays",
    "lazy", "lead", "leaf", "leak", "lean", "leap", "left", "legs", "lend",
    "lens", "lent", "less", "liar", "lice", "lick", "lids", "lied", "lien",
    "lies", "life", "lift", "like", "lily", "limb", "lime", "limp", "line",
    "link", "lint", "lion", "lips", "lisp", "list", "live", "load", "loaf",
    "loam", "loan", "lobe", "lobs", "lock", "lode", "loft", "logo", "logs",
    "lone", "long", "look", "loom", "loon", "loop", "loot", "lord", "lore",
    "lose", "loss", "lost", "lots", "loud", "lout", "love", "lows", "luck",
    "luge", "lugs", "lull", "lump", "lure", "lurk", "lush", "lust", "mace",
    "made", "maid", "mail", "main", "make", "male", "mall", "malt", "mane",
    "many", "maps", "mare", "mark", "mars", "mash", "mask", "mass", "mast",
    "mate", "math", "mats", "maul", "maze", "mead", "meal", "mean", "meat",
    "meek", "meet", "meld", "melt", "memo", "mend", "menu", "meow", "mere",
    "mesh", "mess", "mica", "mice", "mild", "mile", "milk", "mill", "mime",
    "mind", "mine", "mint", "mire", "miss", "mist", "mite", "mitt", "moan",
    "moat", "mobs", "mock", "mode", "mold", "mole", "molt", "monk", "mood",
    "moon", "moor", "moot", "mope", "mops", "more", "morn", "moss", "most",
    "moth", "move", "much", "muck", "muds", "muff", "mugs", "mule", "mull",
    "mumm", "mums", "mung", "murk", "muse", "mush", "musk", "must", "mute",
    "mutt", "myth", "nabs", "nags", "nail", "name", "nape", "naps", "nary",
    "nave", "navy", "near", "neat", "neck", "need", "neon", "nerd", "nest",
    "nets", "news", "newt", "next", "nibs", "nice", "nick", "nine", "nips",
    "nits", "node", "nods", "noel", "none", "nook", "noon", "nope", "norm",
    "nose", "nosy", "note", "noun", "nubs", "null", "numb", "nuns", "nuts",
    "oafs", "oaks", "oars", "oath", "oats", "obey", "oboe", "odds", "odes",
    "odor", "offs", "oils", "oily", "okay", "omen", "omit", "once", "ones",
    "only", "onto", "oops", "ooze", "opal", "open", "opts", "opus", "oral",
    "orbs", "orca", "ores", "ours", "oust", "outs", "ouzo", "oval", "oven",
    "over", "owed", "owes", "owls", "owns", "pace", "pack", "pact", "pads",
    "page", "paid", "pail", "pain", "pair", "pale", "palm", "pals", "pane",
    "pang", "pans", "pant", "papa", "pare", "park", "part", "pass", "past",
    "path", "pats", "pave", "pawn", "paws", "pays", "peak", "peal", "pear",
    "peas", "peat", "peck", "peek", "peel", "peep", "peer", "pegs", "pelt",
    "pens", "peon", "perk", "perm", "pest", "pets", "pews", "pick", "pied",
    "pier", "pies", "pigs", "pike", "pile", "pill", "pine", "ping", "pink",
    "pins", "pint", "pipe", "pips", "pita", "pith", "pits", "pity", "plan",
    "play", "plea", "pled", "plod", "plop", "plot", "plow", "ploy", "plug",
    "plum", "plus", "pock", "pods", "poem", "poet", "poke", "poky", "pole",
    "poll", "polo", "pomp", "pond", "pony", "pooh", "pool", "poop", "poor",
    "pope", "pops", "pore", "pork", "port", "pose", "posh", "post", "pots",
    "pour", "pout", "pram", "pray", "prep", "prey", "prim", "prod", "prom",
    "prop", "pros", "prow", "prys", "pubs", "puck", "puds", "puff", "pugs",
    "pull", "pulp", "pump", "puns", "punk", "puns", "pupa", "pups", "pure",
    "push", "puts", "putt", "quad", "quay", "quit", "quiz", "race", "rack",
    "raft", "rage", "rags", "raid", "rail", "rain", "rake", "ramp", "rams",
    "rang", "rank", "rant", "raps", "rapt", "rare", "rash", "rasp", "rate",
    "rats", "rave", "rays", "raze", "read", "real", "ream", "reap", "rear",
    "redo", "reed", "reef", "reek", "reel", "refs", "rely", "rend", "rent",
    "rest", "ribs", "rice", "rich", "ride", "rids", "rife", "rift", "rigs",
    "rile", "rill", "rime", "rims", "rind", "ring", "rink", "riot", "ripe",
    "rips", "rise", "risk", "rite", "road", "roam", "roar", "robe", "robs",
    "rock", "rode", "rods", "roes", "roil", "role", "roll", "romp", "roof",
    "rook", "room", "root", "rope", "ropy", "rose", "rosy", "rots", "roue",
    "rout", "rove", "rows", "rubs", "ruby", "ruck", "rude", "rued", "rues",
    "ruff", "rugs", "ruin", "rule", "rump", "rums", "rune", "rung", "runs",
    "runt", "ruse", "rush", "rust", "ruts", "sack", "sacs", "safe", "saga",
    "sage", "sags", "said", "sail", "sake", "sale", "salt", "same", "sand",
    "sane", "sang", "sank", "saps", "sash", "sate", "save", "saws", "says",
    "scab", "scam", "scan", "scar", "seal", "seam", "sear", "seas", "seat",
    "sect", "seed", "seek", "seem", "seen", "seep", "seer", "sees", "self",
    "sell", "semi", "send", "sent", "sept", "sets", "sewn", "sews", "sexy",
    "shag", "shah", "sham", "shed", "shew", "shim", "shin", "ship", "shiv",
    "shmo", "shod", "shoe", "shoo", "shop", "shot", "show", "shun", "shut",
    "sick", "side", "sift", "sigh", "sign", "silk", "sill", "silo", "silt",
    "sine", "sing", "sink", "sips", "sire", "sirs", "site", "sits", "size",
    "skim", "skin", "skip", "skis", "skit", "slab", "slag", "slam", "slap",
    "slat", "slaw", "slay", "sled", "slew", "slid", "slim", "slit", "slob",
    "sloe", "slog", "slop", "slot", "slow", "slue", "slug", "slum", "slur",
    "smog", "snap", "snag", "snip", "snit", "snob", "snot", "snow", "snub",
    "snug", "soak", "soap", "soar", "sobs", "sock", "soda", "sods", "sofa",
    "soft", "soil", "sold", "sole", "solo", "some", "song", "sons", "soon",
    "soot", "sops", "sore", "sort", "soul", "soup", "sour", "sown", "sows",
    "span", "spar", "spas", "spat", "spec", "sped", "spin", "spit", "spot",
    "spry", "spud", "spun", "spur", "stab", "stag", "star", "stay", "stem",
    "step", "stew", "stir", "stop", "stow", "stub", "stud", "stun", "stye",
    "subs", "such", "suds", "sued", "sues", "suit", "sulk", "sully","sumo",
    "sump", "sums", "sung", "sunk", "suns", "sups", "sure", "surf", "swan",
    "swap", "swat", "sway", "swim", "swob", "swop", "sync", "tabs", "tack",
    "tact", "tads", "tags", "tail", "take", "tale", "talk", "tall", "tame",
    "tamp", "tang", "tank", "tans", "tape", "taps", "tare", "tarn", "tarp",
    "tars", "tart", "task", "taxi", "teak", "teal", "team", "tear", "teas",
    "teem", "teen", "tell", "temp", "tend", "tens", "tent", "term", "tern",
    "test", "text", "than", "that", "thaw", "thee", "them", "then", "thew",
    "they", "thin", "this", "thou", "thud", "thug", "thus", "tick", "tide",
    "tidy", "tied", "tier", "ties", "tile", "till", "tilt", "time", "tine",
    "tins", "tint", "tiny", "tips", "tire", "toad", "toes", "toff", "togs",
    "toil", "told", "toll", "tomb", "tome", "tone", "tong", "tons", "took",
    "tool", "toot", "tops", "tore", "torn", "tort", "toss", "tote", "tots",
    "tour", "tout", "town", "tows", "toys", "tram", "trap", "tray", "tree",
    "trek", "trim", "trio", "trip", "trod", "trot", "true", "tubs", "tuck",
    "tuft", "tugs", "tuna", "tune", "turf", "turn", "tusk", "tutu", "twig",
    "twin", "twit", "twos", "type", "typo", "ugly", "undo", "unit", "unto",
    "upon", "urge", "urns", "used", "user", "uses", "vain", "vale", "vamp",
    "vane", "vans", "vary", "vase", "vast", "vats", "veal", "veer", "veil",
    "vein", "vent", "verb", "very", "vest", "vets", "vial", "vibe", "vice",
    "vied", "vies", "view", "vile", "vine", "visa", "vise", "void", "volt",
    "vote", "vows", "wade", "wads", "waft", "wage", "wags", "waif", "wail",
    "wait", "wake", "walk", "wall", "wand", "wane", "want", "ward", "ware",
    "warm", "warn", "warp", "wars", "wary", "wash", "wasp", "watt", "wave",
    "wavy", "waxy", "ways", "weak", "wean", "wear", "webs", "weds", "weed",
    "week", "weep", "weld", "well", "welt", "went", "wept", "were", "west",
    "wets", "wham", "what", "when", "whet", "whey", "whig", "whim", "whip",
    "whir", "whit", "whiz", "whom", "wick", "wide", "wife", "wigs", "wild",
    "wile", "will", "wilt", "wimp", "wind", "wine", "wing", "wink", "wins",
    "wipe", "wire", "wiry", "wise", "wish", "wisp", "with", "wits", "wive",
    "woes", "woke", "woks", "wolf", "womb", "wont", "wood", "woof", "wool",
    "word", "wore", "work", "worm", "worn", "wort", "wove", "wows", "wrap",
    "wren", "writ", "yaks", "yams", "yank", "yaps", "yard", "yarn", "yawn",
    "yawl", "yaws", "yeah", "year", "yeas", "yell", "yelp", "yens", "yeps",
    "yews", "yids", "yoke", "yolk", "yore", "your", "yowl", "yule", "yups",
    "zany", "zaps", "zeal", "zebu", "zeds", "zens", "zero", "zest", "zinc",
    "zine", "zing", "zips", "zone", "zoom", "zoos",

    // 5-letter words (Hard)
    "about", "above", "abuse", "actor", "acute", "admit", "adopt", "adult",
    "after", "again", "agent", "agree", "ahead", "alarm", "album", "alert",
    "alien", "align", "alike", "alive", "alley", "allow", "alloy", "alone",
    "along", "alpha", "alter", "ample", "angel", "anger", "angle", "angry",
    "ankle", "apart", "apple", "apply", "arena", "argue", "arise", "armor",
    "aroma", "array", "arrow", "asset", "avoid", "await", "awake", "award",
    "aware", "awful", "badge", "baker", "basic", "basis", "batch", "beach",
    "beard", "beast", "began", "begin", "bench", "berry", "bible", "birth",
    "black", "blade", "blame", "blank", "blast", "blaze", "bleed", "blend",
    "bless", "blind", "block", "blond", "blood", "bloom", "blown", "blues",
    "blunt", "blush", "board", "boast", "bonus", "boost", "booth", "bound",
    "brain", "brake", "brand", "brass", "brave", "bread", "break", "breed",
    "brick", "bride", "brief", "bring", "broad", "broke", "brook", "broom",
    "brown", "brush", "build", "built", "bunch", "burst", "buyer", "cabin",
    "cable", "camel", "candy", "cargo", "carry", "catch", "cause", "cease",
    "chain", "chair", "chalk", "champ", "chant", "chaos", "charm", "chart",
    "chase", "cheap", "cheat", "check", "cheek", "cheer", "chess", "chest",
    "chief", "child", "chill", "china", "choir", "chose", "chunk", "civil",
    "claim", "clamp", "clash", "class", "clean", "clear", "clerk", "click",
    "cliff", "climb", "cling", "cloak", "clock", "close", "cloth", "cloud",
    "clown", "coach", "coast", "colon", "color", "comet", "coral", "couch",
    "cough", "could", "count", "court", "cover", "crack", "craft", "crane",
    "crash", "crawl", "crazy", "cream", "creek", "creep", "crime", "crisp",
    "cross", "crowd", "crown", "crush", "curve", "cycle", "daily", "dairy",
    "daisy", "dance", "dealt", "death", "debut", "decay", "decor", "delay",
    "delta", "dense", "depot", "depth", "devil", "diary", "dirty", "disco",
    "ditch", "diver", "donor", "doubt", "dough", "draft", "drain", "drama",
    "drank", "dream", "dress", "dried", "drift", "drill", "drink", "drive",
    "drown", "drunk", "dryer", "dusty", "dwarf", "dwell", "dying", "eager",
    "eagle", "early", "earth", "eight", "elbow", "elder", "elect", "elite",
    "empty", "enemy", "enjoy", "enter", "entry", "equal", "equip", "error",
    "essay", "event", "every", "exact", "exert", "exile", "exist", "extra",
    "faint", "fairy", "faith", "false", "fancy", "fatal", "fault", "favor",
    "feast", "fence", "ferry", "fever", "fiber", "field", "fifth", "fifty",
    "fight", "final", "first", "fixed", "flame", "flash", "flask", "fleet",
    "flesh", "float", "flock", "flood", "floor", "flora", "flour", "fluid",
    "flush", "flute", "focus", "foggy", "force", "forge", "forth", "forty",
    "forum", "fossil","found", "frame", "frank", "fraud", "freak", "fresh",
    "front", "frost", "fruit", "fully", "fungi", "funny", "ghost", "giant",
    "gland", "glass", "gleam", "glide", "globe", "gloom", "glory", "gloss",
    "glove", "grace", "grade", "grain", "grand", "grant", "grape", "graph",
    "grasp", "grass", "grave", "great", "greed", "green", "greet", "grief",
    "grill", "grind", "groan", "groom", "gross", "group", "grove", "growl",
    "grown", "guard", "guess", "guest", "guide", "guild", "guilt", "guise",
    "habit", "handy", "happy", "harsh", "haste", "hasty", "hatch", "haven",
    "heart", "heath", "heavy", "hedge", "hello", "hence", "heroic","hilly",
    "hinge", "hippo", "hobby", "honey", "honor", "horse", "hotel", "hound",
    "house", "human", "humid", "humor", "hurry", "ideal", "image", "imply",
    "index", "inner", "input", "issue", "ivory", "jelly", "jewel", "joint",
    "joker", "jolly", "judge", "juice", "juicy", "jumbo", "jumpy", "knock",
    "knoll", "known", "label", "labor", "large", "laser", "later", "laugh",
    "layer", "learn", "lease", "least", "leave", "legal", "lemon", "level",
    "lever", "light", "limit", "linen", "liner", "liter", "liver", "llama",
    "lobby", "local", "lodge", "logic", "lonely","loose", "lorry", "loser",
    "lotus", "lover", "lower", "loyal", "lucky", "lunar", "lunch", "lyric",
    "magic", "major", "maker", "manor", "maple", "march", "marry", "marsh",
    "match", "mayor", "media", "melon", "mercy", "merit", "merry", "metal",
    "meter", "micro", "midst", "might", "minor", "minus", "mirth", "model",
    "moist", "money", "month", "moose", "moral", "motor", "motto", "mound",
    "mount", "mouse", "mouth", "movie", "muddy", "music", "naive", "naked",
    "nasty", "naval", "nerve", "never", "newly", "night", "ninth", "noble",
    "noise", "north", "notch", "noted", "novel", "nurse", "nylon", "occur",
    "ocean", "offer", "often", "olive", "onion", "opera", "orbit", "order",
    "organ", "other", "ought", "ounce", "outer", "outgo", "owing", "owner",
    "oxide", "ozone", "paint", "panel", "panic", "paper", "party", "pasta",
    "paste", "pasty", "patch", "pause", "peace", "peach", "pearl", "pedal",
    "penny", "perch", "peril", "petty", "phase", "phone", "photo", "piano",
    "piece", "pilot", "pinch", "pitch", "pizza", "place", "plain", "plane",
    "plant", "plate", "plaza", "plead", "pleat", "pluck", "plumb", "plume",
    "plump", "plunge","plus", "poach", "point", "poise", "polar", "pollen",
    "poppy", "porch", "pouch", "pound", "power", "prank", "press", "price",
    "pride", "prime", "print", "prior", "prize", "probe", "prone", "proof",
    "prose", "proud", "prove", "prune", "punch", "pupil", "puppy", "purse",
    "queen", "query", "quest", "queue", "quick", "quiet", "quilt", "quota",
    "quote", "radar", "radio", "rainy", "raise", "rally", "ranch", "range",
    "rapid", "ratio", "reach", "react", "realm", "rebel", "refer", "relax",
    "relay", "reply", "rider", "ridge", "rifle", "right", "rigid", "rinse",
    "ripen", "risen", "risky", "river", "roast", "robin", "robot", "rocky",
    "rogue", "roman", "roomy", "roots", "rough", "round", "route", "royal",
    "rugby", "ruler", "rumor", "rural", "rusty", "sadly", "saint", "salad",
    "sales", "salon", "salty", "sandy", "sauce", "savor", "scale", "scare",
    "scarf", "scary", "scene", "scent", "scope", "score", "scout", "scrap",
    "seize", "sense", "serve", "setup", "seven", "shade", "shady", "shake",
    "shall", "shame", "shape", "share", "shark", "sharp", "shave", "sheep",
    "sheer", "sheet", "shelf", "shell", "shift", "shine", "shiny", "shire",
    "shirt", "shock", "shore", "short", "shout", "shove", "shown", "shrub",
    "siege", "sight", "sigma", "silly", "since", "siren", "skill", "skull",
    "slave", "sleep", "slice", "slide", "slope", "slump", "small", "smart",
    "smell", "smile", "smith", "smoke", "snack", "snake", "snare", "snarl",
    "sneak", "snow", "sober", "solar", "solid", "solve", "sorry", "sound",
    "south", "space", "spare", "spark", "speak", "spear", "speed", "spell",
    "spend", "spice", "spicy", "spill", "spine", "spite", "split", "spoke",
    "spoon", "sport", "spray", "squad", "stack", "staff", "stage", "stain",
    "stair", "stake", "stale", "stall", "stamp", "stand", "stare", "stark",
    "start", "state", "stave", "steak", "steal", "steam", "steel", "steep",
    "steer", "stern", "stick", "stiff", "still", "sting", "stock", "stomp",
    "stone", "stool", "stoop", "store", "storm", "story", "stout", "stove",
    "strap", "straw", "stray", "strip", "stuck", "study", "stuff", "stump",
    "style", "sugar", "sunny", "super", "surge", "swamp", "swarm", "swear",
    "sweat", "sweep", "sweet", "swell", "swift", "swing", "sword", "syrup",
    "table", "taboo", "tacky", "tailor","taken", "tally", "taste", "tasty",
    "taunt", "teach", "teeth", "tempo", "tense", "tenth", "terra", "thank",
    "theft", "their", "theme", "there", "these", "thick", "thief", "thigh",
    "thing", "think", "third", "thorn", "those", "three", "threw", "throw",
    "thumb", "tiger", "tight", "timer", "tired", "title", "toast", "today",
    "token", "topic", "torch", "total", "touch", "tough", "towel", "tower",
    "toxic", "trace", "track", "tract", "trade", "trail", "train", "trait",
    "tramp", "trash", "trawl", "treat", "trend", "trial", "tribe", "trick",
    "tried", "troop", "trout", "truck", "truly", "trunk", "trust", "truth",
    "tulip", "tumor", "tunic", "tutor", "tweed", "twice", "twist", "tycoon",
    "ultra", "uncle", "under", "union", "unity", "until", "upper", "upset",
    "urban", "usage", "usual", "utter", "vague", "valid", "value", "vapor",
    "vault", "venus", "venue", "verse", "video", "vigor", "villa", "vinyl",
    "viola", "vital", "vivid", "vocal", "vogue", "voice", "voter", "vowel",
    "wagon", "waist", "waste", "watch", "water", "weary", "wedge", "weigh",
    "weird", "whale", "wheat", "wheel", "where", "which", "while", "whine",
    "white", "whole", "whose", "widen", "widow", "width", "windy", "witch",
    "woman", "women", "world", "worry", "worse", "worst", "worth", "would",
    "wound", "wrath", "wreck", "wrist", "write", "wrong", "wrote", "yacht",
    "yearn", "yeast", "yield", "young", "youth", "zebra", "zesty"
]);

// ============================================================================
// CATEGORY WORD LISTS
// ============================================================================
const CATEGORIES = {
    easy3: {
        name: "Easy 3-Letter",
        description: "Simple three-letter words",
        words: [
            "cat", "bat", "hat", "rat", "mat", "sat", "fat", "pat", "vat",
            "dog", "bog", "fog", "hog", "jog", "log", "cog",
            "sun", "bun", "fun", "gun", "nun", "run", "pun",
            "bed", "fed", "led", "red", "wed",
            "pen", "den", "hen", "men", "ten",
            "big", "dig", "fig", "jig", "pig", "rig", "wig",
            "hot", "cot", "dot", "got", "lot", "not", "pot", "rot",
            "cup", "pup", "sup",
            "car", "bar", "far", "jar", "tar", "war",
            "top", "cop", "hop", "mop", "pop",
            "man", "ban", "can", "fan", "pan", "ran", "tan", "van",
            "pet", "bet", "get", "jet", "let", "met", "net", "set", "wet", "yet",
            "nut", "but", "cut", "gut", "hut", "rut",
            "box", "fox", "pox",
            "day", "bay", "gay", "hay", "jay", "lay", "may", "pay", "ray", "say", "way",
            "new", "dew", "few", "hew", "sew",
            "old", "kid", "lid", "bid", "did", "hid", "rid"
        ]
    },
    easy4: {
        name: "Easy 4-Letter",
        description: "Common four-letter words",
        words: [
            "cake", "bake", "fake", "lake", "make", "rake", "take", "wake",
            "cold", "bold", "fold", "gold", "hold", "mold", "sold", "told",
            "tall", "ball", "call", "fall", "hall", "mall", "wall",
            "book", "cook", "hook", "look", "took", "nook",
            "sand", "band", "hand", "land", "wand",
            "rain", "gain", "main", "pain", "vain",
            "boat", "coat", "goat", "moat",
            "heat", "beat", "meat", "neat", "seat",
            "ring", "king", "sing", "wing", "bing",
            "pink", "link", "mink", "sink", "wink",
            "pool", "cool", "fool", "tool",
            "barn", "darn", "warn", "yarn",
            "bell", "cell", "fell", "sell", "tell", "well", "yell",
            "dish", "fish", "wish", "mesh",
            "bent", "dent", "lent", "rent", "sent", "tent", "went",
            "bump", "dump", "hump", "jump", "lump", "pump",
            "duck", "buck", "luck", "muck", "tuck", "puck"
        ]
    },
    animals: {
        name: "Animals",
        description: "Animal-themed words",
        words: [
            "cat", "bat", "rat", "dog", "hog", "pig", "cow", "hen", "bee",
            "ant", "ape", "owl", "fox", "elk", "ram", "emu",
            "bear", "deer", "frog", "fish", "duck", "bird", "crab", "goat",
            "lamb", "mole", "moth", "seal", "slug", "swan", "toad", "wolf",
            "horse", "moose", "mouse", "snake", "whale", "eagle", "shark",
            "tiger", "zebra", "camel", "llama", "panda", "robin"
        ]
    },
    food: {
        name: "Food & Drinks",
        description: "Food-related words",
        words: [
            "ham", "jam", "yam", "pie", "tea", "pea", "egg", "bun", "nut",
            "cup", "mug", "dip", "fig", "oat", "rye",
            "cake", "bake", "bean", "beef", "beer", "beet", "bread", "corn",
            "fish", "food", "lime", "meat", "milk", "mint", "pear", "pork",
            "rice", "salt", "soup", "tart",
            "apple", "bacon", "berry", "candy", "cream", "grape", "honey",
            "juice", "lemon", "melon", "olive", "pasta", "peach", "pizza",
            "salad", "sauce", "spice", "steak", "sugar", "toast", "wheat"
        ]
    },
    veterans: {
        name: "Veterans & Service",
        description: "Respectful military and service words",
        words: [
            "hero", "flag", "duty", "team", "aid", "home", "care", "hope",
            "brave", "honor", "peace", "serve", "guard", "troop", "medal",
            "valor", "pride", "rank", "base", "camp", "army", "navy", "fort",
            "march", "salute", "badge", "corps", "fleet", "pilot", "chief",
            "major", "unit", "ally"
        ]
    },
    general: {
        name: "General",
        description: "Mix of common words",
        words: [
            // 3-letter
            "the", "and", "for", "are", "but", "not", "you", "all", "can",
            "had", "her", "was", "one", "our", "out", "day", "get", "has",
            "him", "his", "how", "its", "may", "new", "now", "old", "see",
            "two", "way", "who", "boy", "did", "man", "put", "say", "she",
            // 4-letter
            "that", "with", "have", "this", "will", "your", "from", "they",
            "been", "call", "come", "each", "find", "give", "good", "here",
            "just", "know", "last", "look", "made", "make", "most", "must",
            "name", "over", "part", "some", "take", "than", "them", "then",
            "very", "want", "well", "what", "when", "work", "year", "also",
            // 5-letter
            "about", "after", "being", "could", "every", "first", "found",
            "great", "house", "large", "might", "never", "other", "place",
            "point", "right", "small", "sound", "still", "think", "those",
            "under", "water", "where", "which", "while", "world", "would",
            "write", "years"
        ]
    }
};

// ============================================================================
// PUZZLE GENERATION FUNCTIONS
// ============================================================================

/**
 * Check if a word is valid (exists in dictionary)
 * @param {string} word - Word to validate
 * @returns {boolean}
 */
function isValidWord(word) {
    return MASTER_WORDS.has(word.toLowerCase());
}

/**
 * Find all valid one-letter-change neighbors for a given word
 * @param {string} word - The source word
 * @returns {string[]} - Array of valid neighbor words
 */
function findNeighbors(word) {
    const neighbors = [];
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    const wordChars = word.toLowerCase().split('');
    
    for (let i = 0; i < wordChars.length; i++) {
        const original = wordChars[i];
        for (const letter of letters) {
            if (letter !== original) {
                wordChars[i] = letter;
                const candidate = wordChars.join('');
                if (MASTER_WORDS.has(candidate)) {
                    neighbors.push(candidate);
                }
            }
        }
        wordChars[i] = original;
    }
    
    return neighbors;
}

/**
 * Get all words from a category that have at least one valid neighbor
 * @param {string} categoryKey - Category key from CATEGORIES
 * @returns {string[]} - Solvable words from that category
 */
function getSolvableWords(categoryKey) {
    const category = CATEGORIES[categoryKey];
    if (!category) return [];
    
    return category.words.filter(word => {
        const neighbors = findNeighbors(word);
        return neighbors.length > 0;
    });
}

/**
 * Generate a puzzle from a specific category
 * @param {string} categoryKey - Category key
 * @param {Set<string>} recentWords - Words to avoid (prevent repeats)
 * @returns {{word: string, solutions: string[]} | null}
 */
function generatePuzzle(categoryKey, recentWords = new Set()) {
    const solvable = getSolvableWords(categoryKey);
    
    // Filter out recent words
    const available = solvable.filter(w => !recentWords.has(w));
    
    if (available.length === 0) {
        // If all words used, allow repeats
        if (solvable.length === 0) return null;
        const word = solvable[Math.floor(Math.random() * solvable.length)];
        return { word, solutions: findNeighbors(word) };
    }
    
    // Pick random available word
    const word = available[Math.floor(Math.random() * available.length)];
    return { word, solutions: findNeighbors(word) };
}

/**
 * Generate a quick play puzzle (sensible defaults)
 * @param {Set<string>} recentWords - Words to avoid
 * @returns {{word: string, solutions: string[], category: string}}
 */
function generateQuickPlayPuzzle(recentWords = new Set()) {
    // Prefer easy categories for quick play
    const preferredCategories = ['easy3', 'easy4', 'general'];
    const category = preferredCategories[Math.floor(Math.random() * preferredCategories.length)];
    const puzzle = generatePuzzle(category, recentWords);
    return puzzle ? { ...puzzle, category } : null;
}

/**
 * Get hint for current puzzle - suggests which position to change
 * @param {string} currentWord - Current word
 * @param {string[]} solutions - Valid solutions
 * @returns {{position: number, letter: string} | null}
 */
function getHint(currentWord, solutions) {
    if (!solutions || solutions.length === 0) return null;
    
    // Pick a random solution
    const target = solutions[Math.floor(Math.random() * solutions.length)];
    
    // Find the differing position
    for (let i = 0; i < currentWord.length; i++) {
        if (currentWord[i] !== target[i]) {
            return { position: i, letter: target[i] };
        }
    }
    
    return null;
}

// Export for use in game.js
window.WordGame = {
    MASTER_WORDS,
    CATEGORIES,
    isValidWord,
    findNeighbors,
    getSolvableWords,
    generatePuzzle,
    generateQuickPlayPuzzle,
    getHint
};
