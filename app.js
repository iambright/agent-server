/**
 * Created by Bright on 2019/1/28.
 */

const AgentServer = require('./libs');
let option={
    maps:{
        'g':'https://www.google.com',
        'b':'https://www.baidu.com',
    }
};
let agentServer = new AgentServer(option);

agentServer.dataFilter = function (res) {
    if(typeof res != "undefined"){
        //res=res.replace('</body>',`<script>alert(666)</script></body>`);
        //console.log(res);
    }
    return res;
};
