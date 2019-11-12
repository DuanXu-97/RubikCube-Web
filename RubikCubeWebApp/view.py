from django.http import HttpResponse
from django.shortcuts import render
from django.views.generic import View
from .calculate_states.main import calculate_states
from .kernel.scripts.solveStartingStates import runMethods as deepcubea
import logging
import json

# logging.basicConfig(level=logging.DEBUG,
#                     format='%(asctime)s  %(filename)s : %(levelname)s  %(message)s',
#                     datefmt='%a, %d %b %Y %H:%M:%S',
#                     filename="/var/www/RubikCubeWebApp/log.log",
#                     filemode='w')


class IndexView(View):
    def get(self, request):
        context = dict()
        return render(request, 'index.html', context)


class SolveCubeView(View):
    def post(self, request):
        state_str = request.POST.get('state_str')
        method_type = request.POST.get('method_type')

        # DeepCubeA
        if method_type == 1:
            id_seq = calculate_states(state_str)
            if id_seq is None:
                return HttpResponse('{"code": -1, "message":"魔方状态不合法"}', content_type='application/json')

            try:
                soln, _, _ = deepcubea(id_seq)
            except AssertionError:
                return HttpResponse('{"code": -1, "message":"解法不合法"}', content_type='application/json')

            return HttpResponse('{"code": 1, "message":"成功"}. "moves":"' + soln + '"', content_type='application/json')

        # 公式法
        elif method_type == 0:
            pass

        else:
            return HttpResponse('{"code": -1, "message":"方法不存在"}', content_type='application/json')




