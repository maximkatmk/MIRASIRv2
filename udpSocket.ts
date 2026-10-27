import dgram from 'react-native-udp';
import {Buffer} from 'buffer';
import type {SocketFactory} from './samp';

/** Adaptor react-native-udp -> UdpLike. */
export const rnSocketFactory: SocketFactory = () => {
  const s = dgram.createSocket({type: 'udp4'});
  s.bind(0);
  return {
    send: (data, host, port) => s.send(Buffer.from(data), 0, data.length, port, host, () => {}),
    onMessage: cb => s.on('message', (msg: Uint8Array) => cb(new Uint8Array(msg))),
    onError: cb => s.on('error', cb),
    close: () => s.close(),
  };
};
