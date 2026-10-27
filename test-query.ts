// Pornește un server SA-MP fals (UDP) și verifică parserul + clientul de query.
import dgram from 'node:dgram';
import {queryServer, buildPacket, type UdpLike} from '../src/lib/samp';

const str = (s: string, lenBytes: 1 | 4) => {
  const b = Buffer.from(s, 'latin1');
  const h = Buffer.alloc(lenBytes);
  lenBytes === 1 ? h.writeUInt8(b.length) : h.writeUInt32LE(b.length);
  return Buffer.concat([h, b]);
};

const server = dgram.createSocket('udp4');
server.on('message', (msg, rinfo) => {
  const op = String.fromCharCode(msg[10]);
  const head = Buffer.from(msg.subarray(0, 11));
  let body = Buffer.alloc(0);
  if (op === 'i') {
    const a = Buffer.alloc(5);
    a.writeUInt8(0, 0);
    a.writeUInt16LE(42, 1);
    a.writeUInt16LE(500, 3);
    body = Buffer.concat([a, str('Mira City RP', 4), str('Roleplay', 4), str('RO', 4)]);
  } else if (op === 'c') {
    const n = Buffer.alloc(2);
    n.writeUInt16LE(2);
    const sc = (v: number) => {
      const b = Buffer.alloc(4);
      b.writeInt32LE(v);
      return b;
    };
    body = Buffer.concat([n, str('Alex', 1), sc(10), str('Maria_K', 1), sc(-3)]);
  } else if (op === 'r') {
    const n = Buffer.alloc(2);
    n.writeUInt16LE(1);
    body = Buffer.concat([n, str('version', 1), str('0.3.7-R2', 1)]);
  } else if (op === 'p') {
    body = Buffer.from(msg.subarray(11, 15));
  }
  server.send(Buffer.concat([head, body]), rinfo.port, rinfo.address);
});

const nodeSocket = (): UdpLike => {
  const s = dgram.createSocket('udp4');
  return {
    send: (d, h, p) => s.send(d, p, h),
    onMessage: cb => s.on('message', m => cb(new Uint8Array(m))),
    onError: cb => s.on('error', cb),
    close: () => s.close(),
  };
};

const assert = (c: boolean, m: string) => {
  if (!c) {
    console.error('EȘEC:', m);
    process.exit(1);
  }
};

server.bind(0, '127.0.0.1', async () => {
  const port = (server.address() as {port: number}).port;
  const p = buildPacket('127.0.0.1', 7777, 'i');
  assert(p.length === 11 && p[8] === 7777 % 256 && p[9] === 7777 >> 8, 'antet pachet');
  const st = await queryServer(nodeSocket, '127.0.0.1', port, {withPlayers: true, withRules: true});
  assert(st.info.hostname === 'Mira City RP', 'hostname');
  assert(st.info.players === 42 && st.info.maxPlayers === 500, 'jucători');
  assert(st.info.gamemode === 'Roleplay' && st.info.language === 'RO', 'gamemode/limbă');
  assert(st.players.length === 2 && st.players[1].name === 'Maria_K' && st.players[1].score === -3, 'listă jucători');
  assert(st.rules.version === '0.3.7-R2', 'reguli');
  assert(st.pingMs >= 0, 'ping');
  console.log('OK — query SA-MP:', JSON.stringify({...st, rules: undefined}));
  server.close();
});
