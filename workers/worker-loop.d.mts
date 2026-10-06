export interface WorkerResult {
  claimed: boolean;
  completed?: boolean;
  continuing?: boolean;
}
export function runWorkerLoop<T extends WorkerResult>(options: {
  processJob: () => Promise<T>;
  delay: () => Promise<unknown>;
  isStopping: () => boolean;
  once?: boolean;
  onResult?: (result: T) => void;
}): Promise<T | undefined>;
