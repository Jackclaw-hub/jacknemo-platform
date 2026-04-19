const sseService = require('../services/sseService');

const streamEvents = (req, res) => {
  const providerId = String(req.user.id);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // Send connected confirmation
  res.write(`event: connected\ndata: {"status":"connected"}\n\n`);

  sseService.addClient(providerId, res);

  req.on('close', () => {
    sseService.removeClient(providerId, res);
    console.log(`[SSE] Provider ${providerId} disconnected`);
  });
};

module.exports = { streamEvents };
