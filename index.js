import Gun from 'gun/gun'
import 'gun/sea'
import 'gun/lib/radix'
import 'gun/lib/radisk'
import 'gun/lib/store'
import 'gun/lib/rindexed'
import {Client} from 'relay-to-relay'
import {EventEmitter} from 'events'

export default class Gunie extends EventEmitter {
    constructor(opts = {}){
        super()
        if(!opts.gun){
            opts.gun = {}
        }
        this.debug = opts.debug
        this.urlProxy = null
        this.gunMessage = null
        this.channel = new Client(opts.url, opts.hash, opts.rtor)
        this._connect = (chan) => {console.log('connected: ' + chan)}
        this._err = (e, chan) => {console.error(e, chan)}
        this._disconnect = (chan) => {console.log('disconnected: ' + chan)}
        this._message = (data, id) => {
            try {
                if(this.debug){
                    console.log('Received Message: ', typeof(data), data)
                }
                this.gunMessage(data)
                this.channel.onMesh(data, id)
            } catch (error) {
                console.error(error)
            }
        }
        this.channel.on('connect', this._connect)
        this.channel.on('error', this._err)
        this.channel.on('disconnect', this._disconnect)
        this.gun = Gun({ ...opts.gun, peers: ["proxy:websocket"], WebSocket: this.WebSocketProxy })
        this.attachGun()
    }
    
    WebSocketProxy(url){
        const websocketproxy = {};

        websocketproxy.url = url || 'ws:proxy';
        this.urlProxy = url || 'ws:proxy';
        websocketproxy.CONNECTING = 0;
        websocketproxy.OPEN = 1;
        websocketproxy.CLOSING = 2;
        websocketproxy.CLOSED = 3;
        websocketproxy.readyState = 1;
        websocketproxy.bufferedAmount = 0;
        websocketproxy.onopen = function () { };
        websocketproxy.onerror = function () { };
        websocketproxy.onclose = function () { };
        websocketproxy.extensions = '';
        websocketproxy.protocol = '';
        websocketproxy.close = { code: '4', reason: 'Closed' };
        websocketproxy.onmessage = function () { }; //overwritten by gun
        websocketproxy.binaryType = 'blob';
        websocketproxy.send = sendMessage;

        return websocketproxy
    }

    attachGun(){
        if(this.urlProxy){
            if(this.debug){
                console.log('proxy', this.urlProxy)
            }
            this.gunMessage = this.gun._.opt.peers[urlProxy].wire.onmessage
            this.channel.on('message', this._message)
            this.gun.quit = this.shutdown()
            this.gun.status = true
            console.log('gundb is attached')
        } else {
            // attachGun(gun)
            setTimeout(() => {this.attachGun()}, 5000)
        }
    }

    sendMessage(data){
        try {
            if(this.debug){
                console.log('Sending Data: ', typeof(data), data)
            }
            this.channel.onSend(data)
        } catch (error) {
            console.error(error)
        }
    }

    shutdown(){
        return function(){
            this.channel.off('connect', this._connect)
            this.channel.off('message', this._message)
            this.channel.off('error', this._err)
            this.channel.off('disconnect', this._disconnect)
            const mesh = this.gun.back('opt.mesh'); // DAM
            const peers = this.gun.back('opt.peers');
            Object.keys(peers).forEach((id) => {mesh.bye(id)});
            this.gun.status = false
            this.channel.end()
        }
    }
}