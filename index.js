import { createServer } from 'http';
import { Server } from 'socket.io';

// Configurações
const PORT = process.env.PORT || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// Criar servidor HTTP
const httpServer = createServer();

// Criar servidor Socket.IO com configuração de CORS
const io = new Server(httpServer, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingInterval: 25000,
  pingTimeout: 60000,
  maxHttpBufferSize: 1e6,
  transports: ['websocket', 'polling']
});

// Middleware para logging de conexões
io.use((socket, next) => {
  console.log(`[Middleware] Nova tentativa de conexão: ${socket.id}`);
  console.log(`[Middleware] Handshake:`, socket.handshake.query);
  next();
});

// Evento de conexão
io.on('connection', (socket) => {
  console.log(`✅ Cliente conectado: ${socket.id}`);
  console.log(`📊 Total de clientes conectados: ${io.engine.clientsCount}`);

  // Enviar mensagem de boas-vindas
  socket.emit('welcome', {
    message: 'Bem-vindo ao servidor WebSocket!',
    socketId: socket.id,
    timestamp: new Date().toISOString()
  });

  // Exemplo: Escutar evento 'message' do cliente
  socket.on('message', (data) => {
    console.log(`📨 Mensagem recebida de ${socket.id}:`, data);
    
    // Enviar mensagem de volta para o cliente
    socket.emit('message-response', {
      original: data,
      response: 'Mensagem recebida com sucesso!',
      timestamp: new Date().toISOString()
    });
  });

  // Exemplo: Broadcast para todos os clientes
  socket.on('broadcast', (data) => {
    console.log(`📢 Broadcast de ${socket.id}:`, data);
    
    // Enviar para todos os clientes, exceto o remetente
    socket.broadcast.emit('broadcast-message', {
      from: socket.id,
      data: data,
      timestamp: new Date().toISOString()
    });
  });

  // Evento de desconexão
  socket.on('disconnect', (reason) => {
    console.log(`❌ Cliente desconectado: ${socket.id}`);
    console.log(`📊 Motivo: ${reason}`);
    console.log(`📊 Total de clientes conectados: ${io.engine.clientsCount}`);
  });

  // Tratamento de erros
  socket.on('error', (error) => {
    console.error(`⚠️ Erro no socket ${socket.id}:`, error);
  });
});

// Iniciar servidor
httpServer.listen(PORT, () => {
  console.log(`🚀 Servidor Socket.IO rodando na porta ${PORT}`);
  console.log(`🌐 CORS configurado para: ${CORS_ORIGIN}`);
  console.log(`📡 Transportes disponíveis: websocket, polling`);
});

// Tratamento de erros do servidor
httpServer.on('error', (error) => {
  console.error('❌ Erro no servidor:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM recebido, fechando servidor gracefully...');
  httpServer.close(() => {
    console.log('✅ Servidor fechado');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT recebido, fechando servidor gracefully...');
  httpServer.close(() => {
    console.log('✅ Servidor fechado');
    process.exit(0);
  });
});

