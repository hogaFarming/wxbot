const request = require('request');
const rp = require('request-promise');
const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');
const tough = require('tough-cookie');
const Cookie = tough.Cookie;
const tuling = require('./tuling');

const G = {
  StatusNotifyCode_READED           : 1,
  StatusNotifyCode_ENTER_SESSION   : 2,
  StatusNotifyCode_INITED           : 3,
  StatusNotifyCode_SYNC_CONV       : 4,
  StatusNotifyCode_QUIT_SESSION    : 5
};

/*
 user: {
    "Uin": 1247014306,
    "UserName": "@a5c3de36d6a3d31d2a5c2f179530e7cdf60e1dadeca20bb14ea9c138fab9174a",
    "NickName": "浩佳",
    "HeadImgUrl": "/cgi-bin/mmwebwx-bin/webwxgeticon?seq=244334260&username=@a5c3de36d6a3d31d2a5c2f179530e7cdf60e1dadeca20bb14ea9c138fab9174a&skey=@crypt_d99caeb1_a8b9cafeeb8905f6f6bb28f192344a01",
    "RemarkName": "",
    "PYInitial": "",
    "PYQuanPin": "",
    "RemarkPYInitial": "",
    "RemarkPYQuanPin": "",
    "HideInputBarFlag": 0,
    "StarFriend": 0,
    "Sex": 1,
    "Signature": "",
    "AppAccountFlag": 0,
    "VerifyFlag": 0,
    "ContactFlag": 0,
    "WebWxPluginSwitch": 0,
    "HeadImgFlag": 1,
    "SnsFlag": 17
  }
 */
const wxStuff = {
  uuid: '',
  skey: '',
  wxsid: '',
  wxuin: '',
  pass_ticket: '',
  isgrayscale: '',
  user: null
};
const cookiejar = rp.jar();

module.exports = {
  // 启动一个bot session
  start: () => {
    requestUUID()
      .then(getQRCodeImage)
      .then(startLogin)
      .then(newLoginPage)
      // .then(addCookies)
      .then(wxInit)
      .then(startSync)
      .catch(handleError);
  }
};

function requestUUID() {
  log('requestUUID...');
  const options = {
    url: `https://login.wx2.qq.com/jslogin`,
    qs: {
      appid: 'wx782c26e4c19acffb',
      redirect_uri: 'https://wx2.qq.com/cgi-bin/mmwebwx-bin/webwxnewloginpage',
      fun: 'new',
      lang: 'zh_CN'
    }
  };
  return rp.get(options)
    .then(result => {
      const { __err, QRLogin: { code, uuid } } = parseJSResponse(result);
      if (code === 200) {
        return wxStuff.uuid = uuid;
      } else if (__err) {
        return Promise.reject(__err);
      }
    });
}

function getQRCodeImage() {
  log('getQRCodeImage...');
  return new Promise((resolve, reject) => {
    const url = `https://login.weixin.qq.com/qrcode/${wxStuff.uuid}`;
    const imgPath = path.resolve(__dirname, '../qrcode.png');
    request(url)
      .pipe(fs.createWriteStream(imgPath))
      .on('error', reject)
      .on('close', resolve);
  });
}

function startLogin() {
  log('startLogin...');
  return nextRequest().then(parseResult);
  
  function nextRequest(prevCode) {
    const options = {
      url: 'https://login.wx2.qq.com/cgi-bin/mmwebwx-bin/login',
      qs: {
        loginicon: true,
        uuid: wxStuff.uuid,
        tip: prevCode === 201 ? 0 : 1,
        r: ~new Date
      }
    };
    return rp(options);
  }
  
  function parseResult(result) {
    const { __err, code, userAvatar, redirect_uri } = parseJSResponse(result);
    if (__err) console.error(__err);
    
    if (code !== 200) {
      return nextRequest(code).then(parseResult);
    } else if (code === 200) {
      return redirect_uri;
    }
  }
}

// function addCookies() {
//   cookiejar.setCookie(`last_wxuin=${wxStuff.wxuin};Domain=wx2.qq.com;Path=/;`, 'https://wx2.qq.com');
//   cookiejar.setCookie(`login_frequency=1;Domain=wx2.qq.com;Path=/;`, 'https://wx2.qq.com');
//   return Promise.resolve();
// }

function newLoginPage(loginPageUrl) {
  log('newLoginPage...');
  const options = {
    url: loginPageUrl,
    qs: {
      fun: 'new',
      version: 'v2'
    },
    resolveWithFullResponse: true,
    jar: cookiejar
  };
  return rp(options).then(res => {
    res.headers['set-cookie'].forEach(item => {
      cookiejar.setCookie(Cookie.parse(item), 'https://wx2.qq.com');
    });
    return new Promise((resolve, reject) => {
      xml2js.parseString(res.body, (err, json) => {
        if (err) return reject(new Error('解析xml失败')); 
        try {
          const result = json.error;
          wxStuff.skey = result.skey[0];
          wxStuff.wxsid = result.wxsid[0];
          wxStuff.wxuin = result.wxuin[0];
          wxStuff.pass_ticket = result.pass_ticket[0];
          wxStuff.isgrayscale = result.isgrayscale[0];
          resolve();
        } catch (e) {
          reject(new Error('解析xml失败'));
        }
      });
    });
  });
}

function wxInit() {
  const options = {
    method: 'POST',
    url: 'https://wx2.qq.com/cgi-bin/mmwebwx-bin/webwxinit',
    qs: {
      pass_ticket: wxStuff.pass_ticket,
      r: ~new Date
    },
    body: getBaseRequest(),
    json: true,
    jar: cookiejar
  };
  return rp(options).then(result => {
    if (result.BaseResponse.Ret !== 0) {
      return Promise.reject(new Error('wxinit失败: ' + result.BaseRequest.ErrMsg));
    }
    const { ContactList, SKey, SyncKey, User } = result;
    wxStuff.skey = SKey;
    wxStuff.synckey = SyncKey;
    wxStuff.user = User;

    notifyMobile();
  });
}

function notifyMobile() {
  const options = {
    method: 'POST',
    url: 'https://wx2.qq.com/cgi-bin/mmwebwx-bin/webwxstatusnotify',
    body: Object.assign(getBaseRequest(), {
      Code: 3,
      FromUserName: wxStuff.user.UserName,
      ToUserName: wxStuff.user.UserName,
      ClientMsgId: +new Date
    }),
    json: true
  };
  return rp(options);
}

function startSync() {
  _loopSyncCheck();
  function _loopSyncCheck() {
    const options = {
      url: 'https://webpush.wx2.qq.com/cgi-bin/mmwebwx-bin/synccheck',
      qs: Object.assign(getBaseRequest(true), {
        synckey: formatSyncKey(),
        r: ~new Date
      }),
      jar: cookiejar
    };
    log('[_loopSyncCheck]' + JSON.stringify(options.qs));
    rp(options).then(result => {
      const { synccheck } = parseJSResponse(result);
      const { retcode, selector } = synccheck;
      log('[syncCheckResult] ' + JSON.stringify(synccheck));
      if (retcode === '0' && selector !== '0') {
        sync().then(_loopSyncCheck);
      } else {
        // if (!synccheck || "1101" !== retcode && "1102" !== retcode) {
        //   if (retcode === "1100") {
        //     loginout();
        //   } else {
        //     // handleError(new Error('wxsynccheck error'));
        //   }
        // } else {
        //   loginout();
        // }
        
        _loopSyncCheck();
      }
      
    });
  }
  function sync() {
    const options = {
      method: 'POST',
      url: 'https://wx2.qq.com/cgi-bin/mmwebwx-bin/webwxsync',
      qs: {
        sid: wxStuff.wxsid,
        skey: wxStuff.skey,
        lang: 'zh_CN',
        pass_ticket: wxStuff.pass_ticket
      },
      body: Object.assign(getBaseRequest(), {
        SyncKey: wxStuff.synckey,
        rr: ~new Date
      }),
      json: true,
      jar: cookiejar
    };
    log('[sync]' + JSON.stringify(options.qs) + JSON.stringify(options.body));
    return rp(options).then(result => {
      const { SyncKey, SyncCheckKey, AddMsgCount, AddMsgList } = result;
      wxStuff.synckey = SyncKey;
      wxStuff.synccheckkey = SyncCheckKey;
      
      // TODO update user
      
      if (AddMsgCount) {
        onAddMsgList(AddMsgList);
      }
    })
  }
}

function onAddMsgList(msgList) {
  msgList.forEach(item => {
    const { Content, CreateTime, FromUserName, ToUserName } = item;
    log(`[新消息] 内容: ${Content || '(空)'}，创建时间: ${CreateTime}, 发送人: ${FromUserName}, 接收人：${ToUserName}`);
    const currentUser = wxStuff.user.UserName;
    if (ToUserName === currentUser && FromUserName !== currentUser && !/^\s*$/.test(Content)) {
      tuling(Content, FromUserName).then(text => {
        sendMessage(text, FromUserName);
      });
    }
    if ((ToUserName === 'filehelper') && !/^\s*$/.test(Content)) {
      tuling(Content, 'filehelper').then(text => {
        sendMessage(text, 'filehelper');
      });
    }
  });
}

function sendMessage(text, toUserName) {
  const options = {
    method: 'POST',
    url: 'https://wx2.qq.com/cgi-bin/mmwebwx-bin/webwxsendmsg',
    qs: {
      lang: 'zh_CN',
      pass_ticket: wxStuff.pass_ticket
    },
    body: Object.assign(getBaseRequest(), {
      Msg: createMessage(text, toUserName),
      Scene: 0
    }),
    json: true,
    jar: cookiejar,
    resolveWithFullResponse: true
  };
  log('[自动回复请求]' + JSON.stringify(options.qs) + JSON.stringify(options.body));
  return rp(options).then(res => {
    log('[自动回复结果]' + JSON.stringify(res));
    const { BaseResponse } = res.body;
    if (BaseResponse.Ret === 0) {
      return;
    }
    return Promise.reject(new Error(BaseResponse.ErrMsg));
  });
}

function loginout() {
  
}

function parseJSResponse(jsCode) {
  if (!jsCode) return;
  const result = { __err: null, QRLogin: {} };
  try {
    const jsCode_ = jsCode.replace(/window\./g, 'result.');
    eval(jsCode_);
  } catch (e) {
    result.__err = e;
  }
  return result;
}

function getBaseRequest(isGet) {
  if (isGet) {
    return {
      uin: wxStuff.wxuin,
      sid: wxStuff.wxsid,
      sky: wxStuff.skey,
      deviceid: getDeviceID()
    }
  }
  return {
    BaseRequest: {
      Uin: +wxStuff.wxuin,
      Sid: wxStuff.wxsid,
      Skey: wxStuff.skey,
      DeviceID: getDeviceID()
    }
  };
}

function getDeviceID() {
  return 'e' + ('' + Math.random().toFixed(15)).substring(2, 17);
}

function getMsgID() {
  return (new Date().getTime() + Math.random().toFixed(3)).replace(".", "")
}

function createMessage(text, toUserName) {
  const msgId = getMsgID();
  return {
    ClientMsgId: msgId,
    Content: text.replace(/<(?!(img|IMG|br|BR))[^>]*>/g, ''),
    FromUserName: wxStuff.user.UserName,
    LocalID: msgId,
    ToUserName: toUserName,
    Type: 1
  };
}

function formatSyncKey() {
  return wxStuff.synckey.List.map(item => item.Key + '_' + item.Val).join('|');
}

function log(str) {
  console.log(str);
}

function handleError(error) {
  console.error(error);
}
