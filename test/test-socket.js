// test/test-socket.js
const assert = require('assert');
const { io } = require('socket.io-client');
const jwt = require('jsonwebtoken');

const URL = 'http://localhost:3000';
const SECRET = process.env.JWT_SECRET || 'CHANGE_ME';
const token = jwt.sign({ sub: 'tester' }, SECRET);

function connectClient(name) {
  return new Promise((resolve, reject) => {
    const socket = io(URL, { auth: { token }, reconnection: false, timeout: 5000 });
    socket.on('connect', () => resolve(socket));
    socket.on('connect_error', (err) => reject(err));
  });
}

(async () => {
  try {
    const a = await connectClient('A');
    const b = await connectClient('B');

    await new Promise(r => setTimeout(r, 200)); // small wait

    // B join room and listen
    b.emit('joinRoom', 'room-test', (resp) => {
      assert(resp && resp.ok, 'B joinRoom failed');
    });

    let received = null;
    b.on('msg', (m) => { received = m; });

    // A joins and sends msg with ack
    a.emit('joinRoom', 'room-test', (r) => assert(r.ok));
    const ack = await new Promise((res) => {
      a.emit('msg', { room: 'room-test', text: 'hello-room' }, (ackData) => res(ackData));
    });
    assert(ack && ack.ok, 'ack non ok');

    // aspetta che B riceva
    await new Promise((r) => setTimeout(r, 300));
    assert(received && received.text === 'hello-room', 'B non ha ricevuto il messaggio nella room');

    console.log('Test OK');
    a.disconnect(); b.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Test fallito', err);
    process.exit(1);
  }
})();
