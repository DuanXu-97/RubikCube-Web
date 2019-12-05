# coding=utf-8
import unittest

# 定义测试用例的目录为当前目录
test_dir = './RubikCubeWebApp'
discover = unittest.defaultTestLoader.discover(test_dir, pattern='test_*.py')

if __name__ == '__main__':
    runner = unittest.TextTestRunner()
    runner.run(discover)
