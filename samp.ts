/**
 * Client pentru protocolul de query SA-MP / open.mp (UDP).
 * Nu depinde de React Native: socket-ul este injectat, deci se poate testa în Node.
 */

export type Opcode = 'i' | 'c' | 'd' | 'r' | 'p';

export interface UdpLike {
  send(data: Uint8Array, host: string, port: number): void;
  onMessage(cb: (data: Uint8Array) => void): void;
  onError(cb: (err: unknown) => void): void;
  close(): void;
}
export type SocketFactory = () => UdpLike;

export interface ServerInfo {
  passworded: boolean;
  players: number;
  maxPlayers: number;
  hostname: string;
  gamemode: string;
  language: string;
}
export interface Player {
  name: string;
  score: number;
}
export interface ServerStatus {
  info: ServerInfo;
  players: Player[];
  rules: Record<string, string>;
  pingMs: number;
}

const enc = (s: string) => Uint8Array.from(Array.from(s).map(c => c.charCodeAt(0) & 0xff));

export function isIPv4(host: string): boolean {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(host) && host.split('.').every(n => +n <= 255);
}

/** Construiește pachetul: "SAMP" + ip(4) + port(2 LE) + opcode [+ extra]. */
export function buildPacket(ip: string, port: number, opcode: Opcode, extra: number[] = []): Uint8Array {
  const octets = ip.split('.').map(n => parseInt(n, 10));
  return Uint8Array.from([
    ...enc('SAMP'),
    ...octets,
    port & 0xff,
    (port >> 8) & 0xff,
    opcode.charCodeAt(0),
    ...extra,
  ]);
}

class Reader {
  private o = 11; // sare peste antet (4+4+2+1)
  constructor(private b: Uint8Array) {}
  u8() {
    this.need(1);
    return this.b[this.o++];
  }
  u16() {
    this.need(2);
    const v = this.b[this.o] | (this.b[this.o + 1] << 8);
    this.o += 2;
    return v;
  }
  i32() {
    this.need(4);
    const v =
      this.b[this.o] | (this.b[this.o + 1] << 8) | (this.b[this.o + 2] << 16) | (this.b[this.o + 3] << 24);
    this.o += 4;
    return v;
  }
  str(len: number) {
    this.need(len);
    const bytes = this.b.subarray(this.o, this.o + len);
    this.o += len;
    return decodeText(bytes);
  }
  private need(n: number) {
    if (this.o + n > this.b.length) throw new Error('Pachet scurt / corupt');
  }
}

function decodeText(bytes: Uint8Array): string {
  // Serverele trimit de obicei Windows-1251/1252; mapăm la caractere, fără a depinde de TextDecoder.
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return s;
}

export function parseInfo(b: Uint8Array): ServerInfo {
  const r = new Reader(b);
  const passworded = r.u8() === 1;
  const players = r.u16();
  const maxPlayers = r.u16();
  const hostname = r.str(r.i32());
  const gamemode = r.str(r.i32());
  const language = r.str(r.i32());
  return { passworded, players, maxPlayers, hostname, gamemode, language };
}

export function parsePlayers(b: Uint8Array): Player[] {
  const r = new Reader(b);
  const n = r.u16();
  const out: Player[] = [];
  for (let i = 0; i < n; i++) {
    const name = r.str(r.u8());
    out.push({name, score: r.i32()});
  }
  return out;
}

export function parseRules(b: Uint8Array): Record<string, string> {
  const r = new Reader(b);
  const n = r.u16();
  const out: Record<string, string> = {};
  for (let i = 0; i < n; i++) {
    const k = r.str(r.u8());
    out[k] = r.str(r.u8());
  }
  return out;
}

/** Rezolvă un domeniu în IPv4 prin DNS-over-HTTPS (RN nu are dns.lookup). */
export async function resolveHost(host: string): Promise<string> {
  if (isIPv4(host)) return host;
  const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(host)}&type=A`, {
    headers: {accept: 'application/dns-json'},
  });
  const json = await res.json();
  const a = (json.Answer || []).find((x: {type: number}) => x.type === 1);
  if (!a) throw new Error(`Nu pot rezolva ${host}`);
  return a.data;
}

/** Trimite un query și așteaptă răspunsul cu același opcode. */
function request(
  make: SocketFactory,
  ip: string,
  port: number,
  opcode: Opcode,
  extra: number[] = [],
  timeoutMs = 2500,
): Promise<{data: Uint8Array; ms: number}> {
  return new Promise((resolve, reject) => {
    const sock = make();
    const t0 = Date.now();
    let done = false;
    const finish = (fn: () => void) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      try {
        sock.close();
      } catch {}
      fn();
    };
    const timer = setTimeout(() => finish(() => reject(new Error('Timeout'))), timeoutMs);
    sock.onError(e => finish(() => reject(e)));
    sock.onMessage(data => {
      if (data.length < 11 || data[10] !== opcode.charCodeAt(0)) return;
      finish(() => resolve({data, ms: Date.now() - t0}));
    });
    sock.send(buildPacket(ip, port, opcode, extra), ip, port);
  });
}

export async function queryServer(
  make: SocketFactory,
  host: string,
  port: number,
  opts: {withPlayers?: boolean; withRules?: boolean} = {},
): Promise<ServerStatus> {
  const ip = await resolveHost(host);
  const rnd = [1, 2, 3, 4].map(() => Math.floor(Math.random() * 256));
  const [info, ping] = await Promise.all([
    request(make, ip, port, 'i'),
    request(make, ip, port, 'p', rnd).catch(() => null),
  ]);
  const parsed = parseInfo(info.data);
  let players: Player[] = [];
  let rules: Record<string, string> = {};
  // Serverele mari (>100 jucători) nu răspund la 'c'; ignorăm eroarea.
  if (opts.withPlayers && parsed.players <= 100) {
    players = await request(make, ip, port, 'c').then(r => parsePlayers(r.data)).catch(() => []);
  }
  if (opts.withRules) {
    rules = await request(make, ip, port, 'r').then(r => parseRules(r.data)).catch(() => ({}));
  }
  return {info: parsed, players, rules, pingMs: (ping ?? info).ms};
}
