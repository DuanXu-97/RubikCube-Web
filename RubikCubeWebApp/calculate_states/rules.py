# 角块判定规则，共8条
CORNER_RULES = [
    {'White': 0, 'Green': 47, 'Orange': 26},
    {'White': 6, 'Green': 53, 'Red': 29},
    {'White': 2, 'Blue': 44, 'Orange': 20},
    {'White': 8, 'Blue': 38, 'Red': 35},

    {'Green': 45, 'Orange': 24, 'Yellow': 11},
    {'Green': 51, 'Red': 27, 'Yellow': 17},
    {'Blue': 36, 'Red': 33, 'Yellow': 15},
    {'Blue': 42, 'Orange': 18, 'Yellow': 9}
]

# 边块判定规则，共12条
EDGE_RULES = [
    {'White': 3, 'Green': 50},
    {'White': 7, 'Red': 32},
    {'White': 1, 'Orange': 23},
    {'White': 5, 'Blue': 41},

    {'Red': 34, 'Blue': 37},
    {'Red': 28, 'Green': 52},
    {'Orange': 25, 'Green': 46},
    {'Orange': 19, 'Blue': 43},

    {'Orange': 21, 'Yellow': 10},
    {'Red': 30, 'Yellow': 16},
    {'Green': 48, 'Yellow': 14},
    {'Blue': 39, 'Yellow': 12}
]

RULES = CORNER_RULES + EDGE_RULES
