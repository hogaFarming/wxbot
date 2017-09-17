## 获取uuid
方式: jsonp
```
url: https://login.wx2.qq.com/jslogin

params: 
  appid:wx782c26e4c19acffb
  redirect_uri:https://wx2.qq.com/cgi-bin/mmwebwx-bin/webwxnewloginpage
  fun:new
  lang:zh_CN
  _:1505582435330

res: window.QRLogin.code = 200; window.QRLogin.uuid = "Abi3mGRxyA==";
```

## 获取二维码图片
url: https://login.weixin.qq.com/qrcode/Abi3mGRxyA==

## 监听扫描/登录
方式: 长连接
```
url: https://login.wx2.qq.com/cgi-bin/mmwebwx-bin/login

params: 
  loginicon:true
  uuid:Abi3mGRxyA==
  tip:1
  r:1951085191
  _:1505582435331

res:
  // 继续监听
  window.code=408;

  // 用户扫描
  window.code=201;window.userAvatar = 'data:img/j...';

  // 用户登录
  window.code=200;
window.redirect_uri="https://wx2.qq.com/cgi-bin/mmwebwx-bin/webwxnewloginpage?ticket=Azv0cN93E9D9ttlZt1VwMgSC@qrticket_0&uuid=Abi3mGRxyA==&lang=zh_CN&scan=1505582649";
```

## 获取pass_ticket等
方式: 普通get请求
```
url: https://wx2.qq.com/cgi-bin/mmwebwx-bin/webwxnewloginpage

params:
  ticket:Azv0cN93E9D9ttlZt1VwMgSC@qrticket_0
  uuid:Abi3mGRxyA==
  lang:zh_CN
  scan:1505582649
  fun:new
  version:v2

res:
  <error>
    <ret>0</ret>
    <message></message>
    <skey>@crypt_d99caeb1_96174089776b78a0d274e8846fc70ea9</skey>
    <wxsid>fLFeLUBgiWrkL+s9</wxsid>
    <wxuin>1247014306</wxuin>
    <pass_ticket>Y3MRq7Zg%2BLi%2FPNCKUSfrevPtZn6%2Bg391JKZFI1B2NdU%2B24RaLFHnep%2Bo4ky1LaBA</pass_ticket>
    <isgrayscale>1</isgrayscale>
  </error>

set-cookie:
  Set-Cookie:mm_lang=zh_CN; Domain=wx2.qq.com; Path=/; Expires=Sun, 17-Sep-2017 05:24:12 GMT
  Set-Cookie:wxuin=1247014306; Domain=wx2.qq.com; Path=/; Expires=Sun, 17-Sep-2017 05:24:12 GMT
  Set-Cookie:webwxuvid=38e27a971978c8f6498b5163999d5b4286db4041a1bca89f47764cfedf95993c6160d3549029e52183270d9d7759eccd; Domain=wx2.qq.com; Path=/; Expires=Tue, 14-Sep-2027 17:24:12 GMT
  Set-Cookie:webwx_auth_ticket=CIsBEKvfkLQCGoAB8BtLRPk60fpV3L9jkWVsHNSO8zuWngNos+SN3vwAsCT86B0nvQ8n4sDURaY8+k8Z265x2MRyNxpW7AvDswphyDUM8AE6lf2K6qfhUY6SUWOzbqrdqBa+7axy1KgcbVolpmEIBAXs5UrjI6ZN8d10dkh80LR6G5Z0hwb1H18j2o0=; Domain=wx2.qq.com; Path=/; Expires=Tue, 14-Sep-2027 17:24:12 GMT
  Set-Cookie:wxloadtime=1505582652; Domain=wx2.qq.com; Path=/; Expires=Sun, 17-Sep-2017 05:24:12 GMT
  Set-Cookie:wxsid=nAdswiAL1CoJEyJ9; Domain=wx2.qq.com; Path=/; Expires=Sun, 17-Sep-2017 05:24:12 GMT
  Set-Cookie:webwx_data_ticket=gScyqBTngqpN45C2nXOHRQvr; Domain=.qq.com; Path=/; Expires=Sun, 17-Sep-2017 05:24:12 GMT
```

## 初始化，获取用户信息等
方式: post
```
url: https://wx2.qq.com/cgi-bin/mmwebwx-bin/webwxinit

params: 
  r:1951085510
  pass_ticket:znISAbu%2FoWmVDb%2FP5Q3tlXSHmAGyzW9T7ahNMKbKrSJY6IspSgZXgLFGyhUx5x3Z

body(json):
  {"BaseRequest":{"Uin":"1247014306","Sid":"nAdswiAL1CoJEyJ9","Skey":"@crypt_d99caeb1_5f88044da4e7b66c2a04f7a7ef02485c","DeviceID":"e625110438101300"}}
```
