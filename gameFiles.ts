import {useCallback, useEffect, useRef, useState} from 'react';
import {Distribution, DownloadHandle, DistFile, Progress, downloadFiles, fetchDistribution, findOutdated, freeSpaceBytes} from './downloader';

export type FilesState =
  | {kind: 'checking'; done?: number; total?: number}
  | {kind: 'ready'}
  | {kind: 'needs'; files: DistFile[]; bytes: number}
  | {kind: 'downloading'; p: Progress}
  | {kind: 'error'; message: string};

/** Verifică fișierele jocului față de distribution.json și le descarcă. */
export function useGameFiles() {
  const [state, setState] = useState<FilesState>({kind: 'checking'});
  const dist = useRef<Distribution | null>(null);
  const handle = useRef<DownloadHandle | null>(null);

  const check = useCallback(async () => {
    setState({kind: 'checking'});
    try {
      const d = await fetchDistribution();
      dist.current = d;
      const files = await findOutdated(d, (done, total) => setState({kind: 'checking', done, total}));
      setState(files.length ? {kind: 'needs', files, bytes: files.reduce((a, f) => a + f.size, 0)} : {kind: 'ready'});
    } catch (e) {
      setState({kind: 'error', message: e instanceof Error ? e.message : String(e)});
    }
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  const start = useCallback(async () => {
    if (state.kind !== 'needs' || !dist.current) return;
    const free = await freeSpaceBytes();
    if (free < state.bytes * 1.1) {
      setState({kind: 'error', message: 'Spațiu insuficient pe dispozitiv.'});
      return;
    }
    const h = downloadFiles(dist.current, state.files, p => setState({kind: 'downloading', p}));
    handle.current = h;
    try {
      await h.promise;
      setState({kind: 'ready'});
    } catch (e) {
      setState({kind: 'error', message: e instanceof Error ? e.message : String(e)});
    }
  }, [state]);

  const cancel = useCallback(() => {
    handle.current?.cancel();
  }, []);

  return {state, check, start, cancel};
}
