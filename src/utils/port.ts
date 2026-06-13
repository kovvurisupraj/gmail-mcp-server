import * as net from 'net';

export function findAvailablePort(start: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const max = start + 10;

    function tryPort(port: number): void {
      if (port > max) {
        reject(new Error(`No available port found between ${start} and ${max}`));
        return;
      }
      const server = net.createServer();
      server.listen(port, () => {
        server.close(() => resolve(port));
      });
      server.on('error', () => tryPort(port + 1));
    }

    tryPort(start);
  });
}
