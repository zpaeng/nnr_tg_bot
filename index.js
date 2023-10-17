/**
 * powerby zpaeng
 */
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const { readJson } = require('./readJson.js');
const moment = require('moment');

const api = 'https://nnr.moe';

const SqliteDB = require('./dbUtils.js').SqliteDB;
const file = "./nnr.db";
const sqliteDB = new SqliteDB(file);

const config = readJson('./config.json')
const token = config.tg_token;
const nnr_token = config.nnr_token;
const tgAdminId = config.tg_admin_id;
const scheduleFlag = config.schedule_flag;

/// create table.
  var createTileTableSql = "create table if not exists tg_user(tg_id varchar(64) PRIMARY KEY, is_admin CHAR(1) default '0', traffic_num REAL, bal_traffic REAL, crte_time varchar(64), days INTEGER);";
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

function dbUpdate(tableName, tableColumn) {
  let querySql = `select * from sqlite_master where type='table' and name='${tableName}' and sql like '%${tableColumn}%'`
  sqliteDB.queryData(querySql).then(rows => {
    // console.log(rows)
    if (!rows || rows.length == 0) {
      let alterSql = `ALTER TABLE ${tableName} ADD COLUMN ${tableColumn} REAL`
      sqliteDB.executeSql(alterSql)
    }
  })
}

dbUpdate('tg_user', 'time_traffic')

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
  let sql = `insert into tg_user(tg_id, traffic_num, bal_traffic, crte_time, days) values( ${tgId}, ${trafficNum}, ${trafficNum}, '${crteTime}', ${days})`;
  sqliteDB.executeSql(sql)
}

function updateUser(tgId, trafficNum, crteTime, days) {
  sqliteDB.executeSql(`update tg_user set traffic_num=${trafficNum}, crte_time='${crteTime}', days=${days} where tg_id=${tgId}`);
}

function resetUser(tgId, crteTime) {
  sqliteDB.executeSql(`update tg_user set crte_time='${crteTime}', bal_traffic=traffic_num where tg_id=${tgId}`);
}

function useTraffic(tgId, balTraffic) {
  sqliteDB.executeSql(`update tg_user set bal_traffic=${balTraffic} where tg_id=${tgId}`);
}

function updateTimeTraffic(tgId, timeTraffic) {
  sqliteDB.executeSql(`update tg_user set time_traffic=${timeTraffic} where tg_id=${tgId}`);
}

function deleteUser(tgId) {
  sqliteDB.executeSql(`delete from tg_user where tg_id=${tgId}`);
}

function listUser(tgId) {
  let sql = `select tg_id tgId, is_admin isAdmin, traffic_num trafficNum, time_traffic timeTraffic, bal_traffic balTraffic, datetime(crte_time) crteTime, days from tg_user where is_admin = '0'`;
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
    sql += ` and rule_id='${ruleId}'`;
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
         msg += `Tg id: ${rows[i].tgId};流量：${rows[i].trafficNum}G;余额：${rows[i].balTraffic}G;开始时间：${rows[i].crteTime};期限：${rows[i].days}(天)
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
  // bot.sendMessage(msg.chat.id, '修改用户模板：TGid+流量(G)+开始时间+天数(`\/edituser 19542314+300+2023-10-13 14:28:00+30`)', {parse_mode: 'Markdown'});
  bot.sendMessage(msg.chat.id, '重置用户模板：TGid(`\/resetuser 19542314`)', {parse_mode: 'Markdown'});
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

bot.onText(/\/resetuser (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const resp = match[1];
  if (chatId != tgAdminId) {
    bot.sendMessage(chatId, '非管理员，无法刷新流量');
    return
  }
  if(!resp) {
    bot.sendMessage(chatId, '格式错误');
    return
  }
  let timedate = moment().format('YYYY-MM-DD HH:mm:ss')
  resetUser(resp, timedate)
  await listUser().then(rows => {
    dataDealUserList(chatId, rows);
  });
});

// bot.onText(/\/edituser (.+)/, (msg, match) => {
//   const chatId = msg.chat.id;
//   const resp = match[1];
//   if (chatId != tgAdminId) {
//     bot.sendMessage(chatId, '非管理员，无法修改');
//     return
//   }
//   let arr = resp.split('+');
//   if(arr.length != 4 || !arr[0] || !arr[1] || !arr[2] || !arr[3]) {
//     bot.sendMessage(chatId, '格式错误');
//     return
//   }
//   // console.log(arr)
//   updateUser(arr[0], arr[1], arr[2], arr[3]);
//   listUser().then(rows => {
//     // console.log(chatId)
//     // console.log(rows)
//     dataDealUserList(chatId, rows);
//   });
// });

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

bot.onText(/\/alluser/, msg => {
  const chatId = msg.chat.id;
  if (chatId != tgAdminId) {
    bot.sendMessage(chatId, '非管理员，无法删除');
    return
  }
  listUser().then(rows => {
    dataDealUserList(chatId, rows);
  });
});

bot.onText(/\/traffic/, msg => {
  const chatId = msg.chat.id;
  listUser().then(rows => {
    let user = rows.find(row => row.tgId == chatId)
    bot.sendMessage(chatId, `流量：${user.trafficNum}G;余额：${user.balTraffic}G;开始时间：${user.crteTime};期限：${user.days}(天)`);
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

bot.onText(/\/servers/, msg => {
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
    'name': tgId + ' ' + remote
  }
  // console.log(params)
  axios.post(api + '/api/rules/add', params).then(res => {
    const {status, data} = res.data
    // console.log(data)
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
    // console.log(arr)
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
      msg += '规则id: `'+ item.rid + '`;节点地址: `' + item.host + '`;节点端口: `' + item.port + '`;消耗流量: ' + item.traffic + 'B;名称: ' + item.name
      msg += `
      `
    })
    // console.log(msg)
    if (msg) {
      bot.sendMessage(tgId, msg, {parse_mode: 'Markdown'})
    }
  })
}

bot.onText(/\/rules/, msg => {
  const chatId = msg.chat.id;
  getAllRules(chatId)
});

async function delRule(tgId, ruleId) {
  if (!userExist(tgId)) {
    bot.sendMessage(tgId, '禁止操作')
    return
  }
  let params = {
    'rid': ruleId
  }
  await axios.post(api + '/api/rules/get', params).then(resp => {
    const {status, data} = resp.data
    listUser(tgId).then(rows => {
      let timeTraffic = Number(rows[0].timeTraffic || rows[0].trafficNum) - (data.traffic || 0)/1024/1024/1024
      updateTimeTraffic(tgId, timeTraffic)
    })
  })
  await axios.post(api + '/api/rules/del', params).then(res => {
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

async function timeRules() {
  let arr = []
  await axios.post(api + '/api/rules/').then(res => {
    const {status, data} = res.data
    arr = data; 
  })
  return arr
}

async function timeUser() {
  let arr = []
  await listUser().then(rows => {
    if (rows && rows.length > 0) {
      arr = rows
    }
  })
  return arr
}

async function timeUserRuleRelate() {
  let arr = []
  await listRule().then(rows => {
    if (rows && rows.length > 0) {
      arr = rows
    }
  })
  return arr
}

function timeDelRule(tgId, ruleId) {
  let params = {
    'rid': ruleId
  }
  axios.post(api + '/api/rules/del', params).then(res => {
    const {status, data} = res.data
    if (data) {
      deleteRule(tgId, ruleId)
    }
  })
}

async function timeTraffic() {
  let ruleArr = await timeRules()
  let userArr = await timeUser()
  let urRelateArr = await timeUserRuleRelate()
  for(var i = 0; i < userArr.length; ++i){
    let item = userArr[i]
    let endTime = moment(item.crteTime).add(7, 'd')
    let startTime = moment()
    let ruleIdArr = []
    urRelateArr.forEach(ur => {
      if (item.tgId == ur.tgId) {
        ruleIdArr.push(ur.ruleId)
      }
    })
    if (ruleIdArr.length > 0) {
      if(endTime.isBefore(startTime)) {
        ruleIdArr.forEach(rui => {
          timeDelRule(item.tgId, rui)
        })
        bot.sendMessage(tgAdminId, `TGid: ${item.tgId}已失效，请及时续期`, {parse_mode: 'Markdown'});
        continue
      }
      let arr = []
      ruleArr.forEach(rule => {
        if (ruleIdArr.includes(rule.rid)) {
          arr.push(rule)
        }
      })
      if (arr.length > 0) {
        let traffic = 0
        arr.forEach(tra => {
          traffic += tra.traffic
        })
        let balTraffic = Number(item.timeTraffic || item.trafficNum) - traffic/1024/1024/1024
        if (balTraffic > 0) {
          useTraffic(item.tgId, balTraffic)
        } else {
          useTraffic(item.tgId, 0)
          arr.forEach(tra => {
            timeDelRule(item.tgId, tra.rid)
          })
          bot.sendMessage(tgAdminId, `TGid: ${item.tgId}流量已用完，请及时处理`, {parse_mode: 'Markdown'});
        }
      }
    }
  }
}

function intervalFun() {
  if (scheduleFlag == '1') {
    setInterval(() => {
      timeTraffic()
    }, 60*1000)
  }
}

intervalFun()
