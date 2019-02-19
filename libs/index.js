/**
 * Created by Bright on 2019/1/19.
 */
const fs = require('fs');
const http = require('http');
const queryString = require('querystring');
const URL = require("url");
const {randomBytes} = require('crypto');
const Cookies = require('cookies');
const superAgent = require('superagent');
const baseCoder = require('base-coder');

module.exports = class AgentServer {
    constructor(option) {
        this.opts = Object.assign({
            cache: true,
            key: '__AS__',
            maxAge: 1000 * 60 * 60 * 24,
            port: 8000
        }, option);
        this.agentMaps = new Map();
        this.timer = new Map();
        this.cache = {};
        this.init();
    }

    dataFilter(res) {
        return res;
    }

    init() {
        http.createServer((req, res) => {
            //
            const cookies = new Cookies(req, res, {
                keys: ['keyboard cat']
            });
            //
            var data = '';
            req.on('error', function (err) {
                console.log(err);
                res.writeHead(500, {
                    'Content-Type': 'text/html',
                    "Access-Control-Allow-Origin": "*"
                });
                res.end(err.toString());
            });
            req.on('data', function (chunk) {
                //console.log('data', chunk);
                data += chunk;
            });
            req.on('end', () => {
                let url = req.url.substr(1);
                let headers = req.headers,
                    host = headers.host;

                if (host && host.indexOf('nb2hi4') == 0) {
                    url = baseCoder.decode32(host.split('.')[0]) + req.url;
                }

                if (url == '') {
                    if (req.method.toLowerCase() == 'post') {
                        //console.log(data);
                        data = queryString.parse(data);
                        let uri = URL.parse(data.url);
                        let domain = baseCoder.encode32(`${uri.protocol}//${uri.host}`);
                        if (data.action == 'Domain') {
                            // res.end(`<script>window.location.href='http://${baseCoder.encode32(data.url)}.${host}'</script>`);
                            res.end(`<script>window.location.href='http://${domain}.${host}${uri.path}';</script>`);
                        } else {
                            // res.end(`<script>window.location.href='/${baseCoder.encode32(data.url)}'</script>`);
                            res.end(`<script>window.location.href='/${domain}${uri.path}';</script>`);
                        }
                    } else {
                        fs.readFile('./index.html', function (err, html) {
                            if (err) {
                                console.log(err);
                                res.writeHead(500, {
                                    'Content-Type': 'text/html',
                                    "Access-Control-Allow-Origin": "*"
                                });
                                res.end('');
                            }
                            res.end(html);
                        });
                    }
                    return;
                }
                if (url.indexOf('nb2hi4') == 0) {
                    var arr = url.split('/');
                    url = baseCoder.decode32(arr.shift()) + arr.join('/');
                }
                console.log(`[${new Date()}] - request[${req.method}]: ${req.url}`);
                if (url.indexOf('http') !== 0) {
                    res.writeHead(200, {
                        'Content-Type': 'text/html',
                        "Access-Control-Allow-Origin": "*"
                    });
                    res.end('nothing...');
                } else {
                    data = queryString.parse(data);
                    let id = cookies.get(this.opts.key) || this.getId();
                    let agent = this.getAgent(id);
                    let request;
                    if (req.method.toLowerCase() == 'post') {
                        request = agent.post(url).send(data);
                    } else {
                        request = agent.get(url);
                    }
                    //
                    request.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36');
                    request.set('Accept-Language', 'zh-CN,zh;q=0.9');
                    request.set('cookie', req.headers.cookie || '');
                    //
                    request.then(response => {
                        cookies.set(this.opts.key, id);
                        res.writeHead(200, {
                            'Content-Type': response.type + (response.type == 'text/html' ? ';charset=utf-8' : ''),
                            'Accept-Language': 'zh-CN,zh;q=0.9',
                            "Access-Control-Allow-Origin": "*"
                        });
                        Buffer.isBuffer(response.body) && res.write(response.body);
                        res.end(this.dataFilter(response.text));
                        // res.end("test");
                    });
                    request.catch(err => {
                        // err.message, err.response
                        res.writeHead(200, {
                            'Content-Type': 'application/json',
                            "Access-Control-Allow-Origin": "*"
                        });
                        res.end(`{"__error__":${err}}`);
                        console.log('Error:', err);
                    });
                }
            });
        }).listen(this.opts.port, '127.0.0.1');
    }

    getId(length = 24) {
        return randomBytes(length).toString('hex');
    }

    getAgent(id) {
        console.log("agent length", this.agentMaps.size);
        if (this.agentMaps.has(id) && this.timer.has(id)) {
            const timeout = this.timer.get(id);
            if (timeout) {
                clearTimeout(timeout);
            }
        }
        let agent = this.agentMaps.get(id) || superAgent.agent();
        this.agentMaps.set(id, agent);
        this.timer.set(id, setTimeout(() => this.destroyAgent(id), this.opts.maxAge));
        return agent;
    }

    destroyAgent(id) {
        console.log("delete", id);
        this.agentMaps.delete(id);
        this.timer.delete(id);
    }
};
















