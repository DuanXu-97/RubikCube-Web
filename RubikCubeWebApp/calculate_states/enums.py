from enum import Enum, unique


@unique
class Colors(Enum):
    White = 0
    Yellow = 1
    Orange = 2
    Red = 3
    Blue = 4
    Green = 5


@unique
class Faces(Enum):
    Up = 0
    Down = 1
    Left = 2
    Right = 3
    Back = 4
    Front = 5


@unique
class Moves(Enum):
    U = 0
    D = 1
    L = 2
    R = 3
    B = 4
    F = 5
