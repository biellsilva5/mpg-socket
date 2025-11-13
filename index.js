import { createServer } from 'http';
import { Server } from 'socket.io';

// Configurações
const PORT = process.env.PORT || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// Criar servidor HTTP com rotas
const httpServer = createServer((req, res) => {
  // Configurar CORS para todas as rotas
  res.setHeader('Access-Control-Allow-Origin', CORS_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Tratar OPTIONS para CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Rota de health check
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      connections: io.engine ? io.engine.clientsCount : 0
    }));
  } 
  // Rota /events para receber webhooks e encaminhar para WebSocket
  else if (req.url === '/events' && req.method === 'POST') {
    let body = '';
    
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        
        // Validar campos obrigatórios
        if (!data.instance || !data.event || !data.data) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            error: 'Campos obrigatórios: instance, event, data' 
          }));
          return;
        }

        const instance = data.instance;
        const eventName = data.event;
        const eventData = data.data;

        // Enviar para a sala (room) específica da instância
        // Isso garante que apenas clientes conectados nesta instância recebam a mensagem
        io.to(instance).emit(eventName, eventData);

        console.log(`📤 Evento "${eventName}" enviado para instância "${instance}"`);
        console.log(`📊 Clientes na sala "${instance}":`, io.sockets.adapter.rooms.get(instance)?.size || 0);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: true,
          message: 'Evento enviado com sucesso',
          instance: instance,
          event: eventName,
          timestamp: new Date().toISOString()
        }));
      } catch (error) {
        console.error('❌ Erro ao processar evento:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: 'Erro ao processar JSON',
          details: error.message
        }));
      }
    });
  } 
  else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

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

  // Capturar a instância do query parameter ou auth
  const instance = socket.handshake.query.instance || socket.handshake.auth?.instance;

  if (instance) {
    // Entrar na sala (room) específica da instância
    socket.join(instance);
    console.log(`🔗 Cliente ${socket.id} entrou na instância: ${instance}`);
    console.log(`📊 Clientes na sala "${instance}":`, io.sockets.adapter.rooms.get(instance)?.size || 0);

    // Enviar mensagem de boas-vindas com informação da instância
    socket.emit('welcome', {
      message: 'Bem-vindo ao servidor WebSocket!',
      socketId: socket.id,
      instance: instance,
      timestamp: new Date().toISOString()
    });
  } else {
    // Se não especificar instância, enviar mensagem genérica
    console.log(`⚠️ Cliente ${socket.id} conectado sem instância`);
    socket.emit('welcome', {
      message: 'Bem-vindo ao servidor WebSocket!',
      socketId: socket.id,
      warning: 'Nenhuma instância especificada. Use query parameter ?instance=SEU_NUMERO',
      timestamp: new Date().toISOString()
    });
  }

  // Evento para trocar de instância
  socket.on('join-instance', (newInstance) => {
    if (!newInstance) {
      socket.emit('error', { message: 'Instância não especificada' });
      return;
    }

    // Sair de todas as salas atuais (exceto a sala do próprio socket)
    const currentRooms = Array.from(socket.rooms).filter(room => room !== socket.id);
    currentRooms.forEach(room => {
      socket.leave(room);
      console.log(`🚪 Cliente ${socket.id} saiu da instância: ${room}`);
    });

    // Entrar na nova instância
    socket.join(newInstance);
    console.log(`🔗 Cliente ${socket.id} entrou na instância: ${newInstance}`);
    console.log(`📊 Clientes na sala "${newInstance}":`, io.sockets.adapter.rooms.get(newInstance)?.size || 0);

    socket.emit('instance-changed', {
      instance: newInstance,
      timestamp: new Date().toISOString()
    });
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

