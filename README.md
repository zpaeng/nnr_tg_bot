# 项目说明
基于nodejs+sqlite，基于nnr api在TG管理用户规则
# 使用
将config.json填充完之后再运行项目
字段	|含义	
:-: | :-: 
tg_token|tg机器人token
nnr_token|nnr Api token
tg_admin_id|管理账户TGid
# 运行
```
npm install
npm start
```
# 命令
根据命令使用tg机器人(如果用户流量消耗完会自动删除规则)
命令	|含义	|示例
:-: | :-: | :-: 
/gettg|获取TGid|
/usertemp|用户操作模板(管理员)|
/adduser|创建用户(管理员)|/adduser 19542314+300+2023-10-13 14:28:00+30
/resetUser|重置用户流量|/resetUser 19542314
/deluser|删除用户(管理员)|/deluser 19542314
/traffic|流量查询
/servers|获取所有可使用节点
/rules|获取用户转发列表
/ruletemp|转发操作模板(用户)
/addrule|添加转发(用户)|/addrule bdcea4d3c4e0cdcc0edf06fc4fa2c959$tcp$192.168.0.1$12345
/delrule|删除转发(用户)|/delrule 19542314
# 免责声明
本项目只是本人个人学习开发并维护，本人不保证任何可用性，也不对使用本软件造成的任何后果负责。