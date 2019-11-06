from django.http import HttpResponse
from django.shortcuts import render
from django.views.generic import View
from .calculate_states import main
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

        return HttpResponse('{"code": -1, "message":"魔方状态不合法"}', content_type='application/json')

