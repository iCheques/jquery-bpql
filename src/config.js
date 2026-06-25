/**
 * Runtime configuration shared by every BPQL transport.
 *
 * Mutate these properties to point the client at a different BIPBOP host
 * (for instance a sandbox or an on-premise deployment):
 *
 * ```js
 * $.bpql.config.webserviceAddress = 'https://my-host.example/';
 * ```
 *
 * @namespace config
 * @property {string} webserviceAddress HTTP(S) endpoint used by `$.bpql`.
 * @property {string} websocketAddress  WebSocket endpoint used by `$.bpql.socket`.
 * @property {number} reconnectAfter     Delay, in milliseconds, before a dropped
 *   socket tries to reconnect.
 */
const config = {
  webserviceAddress: 'https://irql.bipbop.com.br/',
  websocketAddress: 'wss://irql.bipbop.com.br/ws',
  reconnectAfter: 3000,
};

export default config;
