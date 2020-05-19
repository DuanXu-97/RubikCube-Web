# RubikCube-Web
RubikCube-Web is an open-source web application designed to help users practice solving Rubik's Cube. With RubikCube-Web you can learn the fun of playing Rubik's Cube without real objects! At the same time, RubikCube-Web provides a variety of algorithms for solving Rubik's Cube, which is suitable for many types of users to practice solving Rubik's Cube.

<div align=center>
<img src="https://raw.githubusercontent.com/DuanXu-97/RubikCube-Web/master/doc/UI_1.png" alt="UI Image" width="500" height="280"/>
</div>

## Usage
RubikCube-Web contains the following functions:

- **Rotating face:**
The face of cube can be rotated by pressing ULFRBD on the keyboard.

- **Changing colors of cubie:**
The color of a cubie can be changed by clicking the left mouse button.

- **Rotating view:**
The view can be rotated by holding the mouse and dragging.

- **Solving:**
After selecting the algorithm in the menu bar, click Solve Rubik's Cube to automatically solve the Rubik's Cube.

- **Single-step execution:**
The move can be single-step execute or roll back by clicking single-step execution or single-step rollback.

- **And so on:**
Please try yourself to explore more interesting functions.

## Solvers
RubikCube-Web provides four algorithms for solving Rubik's Cube, which are LayerFirst, CFOP, Kociemba and DeepCubeA.

#### DeepCubeA
DeepCubeA<sup>[1]</sup> is an algorithm based on reinforcement learning and A * search.

- The input of DeepCubeA should describe the starting state of the cube. The form of the input is as follows:

>[ 0 48 17 10  4 16 20 37 36  9 12 11 28 13 32 35 50 29 18 23 51 39 22 14
 24 19 26  6 46 44  3 31 34  8  5 33 38 41 15 52 40 30 42  1 27 45 43 47
  7 49 21 53 25  2]

- The output of DeepCubeA indicates the solution to revert the cube. The form of the output is as follows:

>[['R', -1], ['D', -1], ['U', 1], ['R', 1], ['B', 1], ['L', -1], ['F', 1], ['D', 1], ['B', -1], ['R', 1], ['U', 1], ['L', 1], ['B', -1], ['L', -1], ['U', -1], ['L', 1], ['B', 1], ['U', -1], ['L', -1], ['D', -1], ['B', 1], ['U', 1], ['B', -1], ['D', -1], ['B', 1], ['U', -1], ['B', -1], ['D', -1], ['D', -1]]

- The Encoding rule of starting state (not sure):

|Face|Color|Code|
|---|---|---
|U|white|0~8
|D|yellow|9~17
|L|orange|18~26
|R|red|27~35
|B|blue|36~44
|F|green|45~53



## Requirements
|Package Managers|Packages|
|---|---
|apt-get|build-essential=12.4ubuntu1, libboost-all-dev=1.65.1.0ubuntu1, libboost-dev=1.65.1.0ubuntu1, apache2, libapache2-mod-wsgi
|conda|python=2.7.5, tensorflow-gpu=1.8.0
|pip|dm-sonnet=1.10, matplotlib=2.2.3, django=1.11

## References
[1] Agostinelli F, Mcaleer S, Shmakov A, et al. Solving the Rubik’s cube with deep reinforcement learning and search[J], 2019, 1(8): 356-363.

[2] https://github.com/twinone/rubik-web

[3] http://deepcube.igb.uci.edu/



