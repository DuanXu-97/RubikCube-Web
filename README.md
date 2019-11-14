# RubikCube-Web
This project is a prototype of RubikCube-Web.

## Usage
The url of this project is http://159.226.5.97:9006/.

- **Changing states manually:**
You can change the color of a cubie by clicking the right mouse button, and you also can click the left mouse button to rotate a specific face.

## Kernel
The kernel of RubikCube-Web to solve the rubik's cube is similar to DeepCubeA<sup>[1]</sup>.

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


## TODO
- Learn the interfaces of https://github.com/twinone/rubik-web
- Apply the deep learning model in Agostinelli F, Mcaleer S, Shmakov A, et al. Solving the Rubik’s cube with deep reinforcement learning and search[J], 2019, 1(8): 356-363.
- Learn the code in https://codeocean.com/capsule/5723040/

## 开题报告

![](https://image-bed-1253366698.cos.ap-guangzhou.myqcloud.com/mess/contents.png)

