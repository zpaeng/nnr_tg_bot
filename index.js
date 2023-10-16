const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const SqliteDB = require('./dbUtils.js').SqliteDB;
const file = "./nnr.db";
const sqliteDB = new SqliteDB(file);

const token = '6455433215:AAE7yRoXk_O3T3XcEvfWfjiQULKi3rsWGXo';
const api = 'https://nnr.moe';
const nnr_token = 'd391b316-634b-4237-9fef-4f8e86c01a32';
const tgAdminId = '1954991283';

/// create table.
  var createTileTableSql = "create table if not exists tg_user(tg_id varchar(64) PRIMARY KEY, is_admin CHAR(1) default '0', traffic_num REAL, crte_time varchar(64), days INTEGER);";
  var createLabelTableSql = "create table if not exists rule_relate(rule_relate_id INTEGER PRIMARY KEY autoincrement, tg_id varchar(64), rule_id varchar(64));";
  sqliteDB.createTable(createTileTableSql);
  sqliteDB.createTable(createLabelTableSql);

const bot = new TelegramBot(token, {
  polling: true
});

// Request interceptors for API calls
axios.interceptors.request.use(
  config => {
    config.headers['content-type'] = 'application/json';
    config.headers['token'] = nnr_token;
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

function insertAdmin() {
  sqliteDB.queryData(`select * from tg_user where tg_id = ${tgAdminId}`).then((rows) => {
    dataAdminDeal(rows)
  });
  
}

function dataAdminDeal(objects){
  // console.log(objects)
  if (!objects || objects.length == 0) {
    sqliteDB.executeSql(`insert into tg_user(tg_id, is_admin) values( ${tgAdminId}, '1')`)
  }
}

insertAdmin()

function inserUser(tgId, trafficNum, crteTime, days) {
  let sql = `insert into tg_user(tg_id, traffic_num, crte_time, days) values( ${tgId}, ${trafficNum}, '${crteTime}', ${days})`;
  sqliteDB.executeSql(sql)
}

function updateUser(tgId, trafficNum, crteTime, days) {
  sqliteDB.executeSql(`update tg_user set traffic_num=${trafficNum}, crte_time='${crteTime}', days=${days} where tg_id=${tgId}`);
}

function deleteUser(tgId) {
  sqliteDB.executeSql(`delete from tg_user where tg_id=${tgId}`);
}

function listUser(tgId) {
  let sql = `select tg_id tgId, is_admin isAdmin, traffic_num trafficNum, datetime(crte_time) crteTime, days from tg_user where is_admin = '0'`;
  if (tgId) {
    sql += ` and tg_id = ${tgId}`
  }
  return sqliteDB.queryData(sql);
}

function insertRule(tgId, ruleId) {
  let sql = `insert into rule_relate(tg_id, rule_id) values(${tgId}, '${ruleId}')`;
  sqliteDB.executeSql(sql)
}

function deleteRule(tgId, ruleId) {
  let sql = `delete from rule_relate where tg_id=${tgId}`;
  if (ruleId) {
    sql += ` and rule_id=${ruleId}`;
  }
  sqliteDB.executeSql(sql)
}

function listRule(tgId) {
  let sql = `select tg_id tgId, rule_id ruleId from rule_relate`
  if (tgId) {
    sql += ` where tg_id=${tgId}`
  }
  return sqliteDB.queryData(sql)
}

function dataDealUserList(tgId, rows) {
 let msg = ``;
 if (!rows || rows.length == 0) {
  return;
 }
 for(var i = 0; i < rows.length; ++i){
        //  console.log(rows[i]);
         msg += `Tg id: ${rows[i].tgId};流量：${rows[i].trafficNum}G;开始时间：${rows[i].crteTime};期限：${rows[i].days}(天)
`
     }
  bot.sendMessage(tgId, msg, {parse_mode: 'html'});
}
  
bot.onText(/\/start/, function onLoveText(msg) {
  bot.sendMessage(msg.chat.id, 'Hello');
});

bot.onText(/\/gettg/, function onLoveText(msg) {
  let tgId = msg.chat.id
  bot.sendMessage(msg.chat.id, 'TG id为：'+ '`' + tgId + '`' , {parse_mode: 'Markdown'});
});

bot.onText(/\/usertemp/, msg => {
  bot.sendMessage(msg.chat.id, '增加用户模板：TGid+流量(G)+开始时间+天数(`\/adduser 19542314+300+2023-10-13 14:28:00+30`)', {parse_mode: 'Markdown'});
  bot.sendMessage(msg.chat.id, '修改用户模板：TGid+流量(G)+开始时间+天数(`\/edituser 19542314+300+2023-10-13 14:28:00+30`)', {parse_mode: 'Markdown'});
  bot.sendMessage(msg.chat.id, '删除用户模板：TGid(`\/deluser 19542314`)', {parse_mode: 'Markdown'});
});

bot.onText(/\/echo (.+)?/, (msg, match) => {
  const chatId = msg.chat.id;
  const resp = match[1];
  bot.sendMessage(chatId, resp);
});

bot.onText(/\/adduser (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const resp = match[1];
  if (chatId != tgAdminId) {
    bot.sendMessage(chatId, '非管理员，无法添加');
    return
  }
  let arr = resp.split('+');
  if(arr.length != 4 || !arr[0] || !arr[1] || !arr[2] || !arr[3]) {
    bot.sendMessage(chatId, '格式错误');
    return
  }
  // console.log(arr)
  inserUser(arr[0], arr[1], arr[2], arr[3]);
  listUser().then(rows => {
    // console.log(chatId)
    // console.log(rows)
    dataDealUserList(chatId, rows);
  });
});

bot.onText(/\/edituser (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const resp = match[1];
  if (chatId != tgAdminId) {
    bot.sendMessage(chatId, '非管理员，无法修改');
    return
  }
  let arr = resp.split('+');
  if(arr.length != 4 || !arr[0] || !arr[1] || !arr[2] || !arr[3]) {
    bot.sendMessage(chatId, '格式错误');
    return
  }
  // console.log(arr)
  updateUser(arr[0], arr[1], arr[2], arr[3]);
  listUser().then(rows => {
    // console.log(chatId)
    // console.log(rows)
    dataDealUserList(chatId, rows);
  });
});

bot.onText(/\/deluser (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const resp = match[1];
  if (chatId != tgAdminId) {
    bot.sendMessage(chatId, '非管理员，无法删除');
    return
  }
  if(!resp) {
    bot.sendMessage(chatId, '格式错误');
    return
  }
  // console.log(resp)
  deleteUser(chatId);
  deleteRule(chatId)
  listUser().then(rows => {
    // console.log(chatId)
    // console.log(rows)
    dataDealUserList(chatId, rows);
  });
});

bot.onText(/\/traffic/, msg => {
  const chatId = msg.chat.id;
  listUser().then(rows => {
    let user = rows.find(row => row.tgId == chatId)
    bot.sendMessage(tgId, `流量：${user.trafficNum}G;开始时间：${user.crteTime};期限：${user.days}(天)`);
  });
});

function getServers(tgId) {
  axios.post(api+'/api/servers').then(res => {
    const {status, data} = res.data
    // console.log(status)
    // console.log(data[0])
    if (data && data.length > 0) {
      let msg = ``;
      for(var i = 0; i < data.length; ++i){
        //  console.log(rows[i]);
         msg += `创建代码: ${data[i].sid}
名称: ${data[i].name}
协议: ${data[i].types.join('、')}
倍率: ${data[i].mf}X

`
     }
      bot.sendMessage(tgId, msg, {parse_mode: 'html'});
    }
  })
}

bot.onText(/\/server/, msg => {
  getServers(msg.chat.id)
});

function crteRule(sid, remote, rport, type, tgId) {
  if (!userExist(tgId)) {
    bot.sendMessage(tgId, '禁止操作')
    return
  }
  let params = {
    'sid':sid,
    'remote': remote,
    'rport': parseInt(rport),
    'type': type,
    'name': tgId
  }
  console.log(params)
  axios.post(api + '/api/rules/add', params).then(res => {
    const {status, data} = res.data
    console.log(data)
    if (data) {
      insertRule(tgId, data.rid)
      bot.sendMessage(tgId, '规则id: `'+ data.rid + '`;节点地址: `' + data.host + '`;节点端口: `' + data.port + '`', {parse_mode: 'Markdown'});
    } else {
      bot.sendMessage(tgId, '添加失败');
    }
  })
}

async function userExist(tgId) {
  let bol = false
  await listUser(tgId).then(rows => {
    if (rows && rows.length > 0) {
      bol = true
    }
    if (tgId == tgAdminId) {
      bol = true
    }
  })
  // console.log(bol)
  return bol
}

function getAllRules(tgId) {
  if (!userExist(tgId)) {
    bot.sendMessage(tgId, '禁止操作')
    return
  }
  axios.post(api + '/api/rules/').then(async res => {
    const {status, data} = res.data
    let arr = data;
    if (tgId) {
      await listRule(tgId).then(rows => {
        let ruleArr = []
        rows.forEach(item => {
          ruleArr.push(item.ruleId)
        });
        // console.log(ruleArr[0])
        let tgArr = []
        arr.forEach(item => {
          if(ruleArr.includes(item.rid)) {
            tgArr.push(item)
          }
        })
        // console.log(tgArr)
        arr = tgArr
      })
    }
    let msg = ''
    arr.forEach(item => {
      msg += '规则id: `'+ item.rid + '`;节点地址: `' + item.host + '`;节点端口: `' + item.port + '`;消耗流量: ' + item.traffic + 'B'
      msg += `
      `
    })
    // console.log(msg)
    bot.sendMessage(tgId, msg, {parse_mode: 'Markdown'})
  })
}

bot.onText(/\/rules/, msg => {
  const chatId = msg.chat.id;
  getAllRules(chatId)
});

function delRule(tgId, ruleId) {
  if (!userExist(tgId)) {
    bot.sendMessage(tgId, '禁止操作')
    return
  }
  let params = {
    'rid': ruleId
  }
  axios.post(api + '/api/rules/del', params).then(res => {
    const {status, data} = res.data
    if (data) {
      deleteRule(tgId, ruleId)
      getAllRules(tgId)
    } else {
      bot.sendMessage(tgId, '删除失败');
    }
  })
}

bot.onText(/\/ruletemp/, msg => {
  bot.sendMessage(msg.chat.id, '增加规则模板：创建代码$协议$ip(域名)$端口号(`\/addrule bdcea4d3c4e0cdcc0edf06fc4fa2c959$tcp$192.168.0.1$12345`)', {parse_mode: 'Markdown'});
  bot.sendMessage(msg.chat.id, '删除规则模板：规则id(`\/delrule 19542314`)', {parse_mode: 'Markdown'});
});

bot.onText(/\/addrule (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const resp = match[1];
  let arr = resp.split('$')
  if (arr.length != 4 || !arr[0] || !arr[1] || !arr[2] || !arr[3]) {
    bot.sendMessage(chatId, '格式错误');
    return
  }
  crteRule(arr[0], arr[2], arr[3], arr[1], chatId)
});
bot.onText(/\/delrule (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const resp = match[1];
  if (!resp) {
    bot.sendMessage(chatId, '格式错误');
    return
  }
  delRule(chatId, resp)
});
// insertRule(tgAdminId, 'bdcea4d3c4e0cdcc0edf06fc4fa2c959')
// listRule(tgAdminId).then(rows => {
//   console.log(rows)
// })