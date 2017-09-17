const rp = require('request-promise');

const userIdMap = {};

module.exports = autoReply;

function autoReply(message, userName) {
  const userId = getUserId(userName);
  const options = {
    method: 'POST',
    url: 'http://www.tuling123.com/openapi/api',
    body: {
      key: "a6915dc8de514e5aa5a3139fc50de2eb",
      info: message,
      userid: userId
    },
    json: true
  };
  return rp(options).then(result => {
    if (/^4000\d$/.test(result.code + '')) {
      return '机器人糊涂了\n' + result.text;
    }
    let reply = '';
    if (result.text) reply += result.text + '\n';
    if (result.url) reply += result.url + '\n';
    if (result.list) {
      reply += result.list.map(item => (item.article || item.name || ' ') + item.detailurl).join('\n');
    }
    console.log('[图灵结果]' + reply);
    return reply;
  });
}

function getUserId(userName) {
  if (userIdMap[userName]) {
    return userIdMap[userName];
  } else {
    const userId = (Math.random() + '').slice(2, 7);
    userIdMap[userName] = userId;
    return userId;
  }
}
