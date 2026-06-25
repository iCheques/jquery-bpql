/** Mutable endpoint configuration shared by every BPQL transport. */
export interface BPQLConfig {
  /** HTTP(S) endpoint used by `$.bpql`. */
  webserviceAddress: string;
  /** WebSocket endpoint used by `$.bpql.socket`. */
  websocketAddress: string;
  /** Delay, in milliseconds, before a dropped socket tries to reconnect. */
  reconnectAfter: number;
}

/**
 * Runtime configuration. Mutate these properties to point the client at a
 * different host (sandbox, on-premise…):
 *
 * ```ts
 * $.bpql.config.webserviceAddress = 'https://my-host.example/';
 * ```
 */
const config: BPQLConfig = {
  webserviceAddress: 'https://irql.credithub.com.br/',
  websocketAddress: 'wss://irql.credithub.com.br/ws',
  reconnectAfter: 3000,
};

export default config;
