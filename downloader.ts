import RNFS from 'react-native-fs';
import {DISTRIBUTION_URL} from '../config';

export interface DistFile {
  path: string; // cale relativă în folderul jocului
  size: number; // octeți
  md5: string;
  url?: string; // opțional; implicit baseUrl + path
}
export interface Distribution {
  version: string;
  baseUrl: string;
  files: DistFile[];
}
export interface Progress {
  doneBytes: number;
  totalBytes: number;
  file: string;
  fileIndex: number;
  fileCount: number;
}

export const GAME_DIR = `${RNFS.ExternalDirectoryPath}/game`;

export async function fetchDistribution(): Promise<Distribution> {
  const res = await fetch(DISTRIBUTION_URL, {headers: {'cache-control': 'no-cache'}});
  if (!res.ok) throw new Error(`Server de fișiere: HTTP ${res.status}`);
  const d = (await res.json()) as Distribution;
  if (!d.files || !Array.isArray(d.files)) throw new Error('distribution.json invalid');
  return d;
}

async function isValid(f: DistFile): Promise<boolean> {
  const p = `${GAME_DIR}/${f.path}`;
  if (!(await RNFS.exists(p))) return false;
  const st = await RNFS.stat(p);
  if (Number(st.size) !== f.size) return false;
  return (await RNFS.hash(p, 'md5')).toLowerCase() === f.md5.toLowerCase();
}

/** Returnează lista fișierelor lipsă sau corupte. */
export async function findOutdated(d: Distribution, onCheck?: (i: number, n: number) => void) {
  const out: DistFile[] = [];
  for (let i = 0; i < d.files.length; i++) {
    onCheck?.(i, d.files.length);
    if (!(await isValid(d.files[i]))) out.push(d.files[i]);
  }
  return out;
}

export interface DownloadHandle {
  promise: Promise<void>;
  cancel: () => void;
}

/** Descarcă fișierele, verifică md5 și reîncearcă de 2 ori la eroare. */
export function downloadFiles(d: Distribution, files: DistFile[], onProgress: (p: Progress) => void): DownloadHandle {
  let cancelled = false;
  let jobId: number | null = null;
  const totalBytes = files.reduce((a, f) => a + f.size, 0);

  const run = async () => {
    let doneBytes = 0;
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const dest = `${GAME_DIR}/${f.path}`;
      await RNFS.mkdir(dest.substring(0, dest.lastIndexOf('/')));
      let ok = false;
      for (let attempt = 0; attempt < 3 && !ok; attempt++) {
        if (cancelled) throw new Error('Anulat');
        const url = f.url ?? `${d.baseUrl.replace(/\/$/, '')}/${f.path}`;
        const job = RNFS.downloadFile({
          fromUrl: url,
          toFile: dest,
          background: true,
          progressInterval: 250,
          progress: r =>
            onProgress({
              doneBytes: doneBytes + r.bytesWritten,
              totalBytes,
              file: f.path,
              fileIndex: i + 1,
              fileCount: files.length,
            }),
        });
        jobId = job.jobId;
        const res = await job.promise;
        if (res.statusCode >= 200 && res.statusCode < 300) ok = await isValid(f);
        if (!ok && (await RNFS.exists(dest))) await RNFS.unlink(dest);
      }
      if (!ok) throw new Error(`Nu am putut descărca ${f.path}`);
      doneBytes += f.size;
    }
  };

  return {
    promise: run(),
    cancel: () => {
      cancelled = true;
      if (jobId !== null) RNFS.stopDownload(jobId);
    },
  };
}

export async function freeSpaceBytes(): Promise<number> {
  return (await RNFS.getFSInfo()).freeSpace;
}

export function formatBytes(n: number): string {
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
}
