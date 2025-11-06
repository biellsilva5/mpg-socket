# MPG Socket - Servidor WebSocket com Socket.IO

Servidor WebSocket robusto construído com Socket.IO e Node.js, com suporte a CORS e containerização via Docker.

## 🚀 Características

- ✅ Servidor WebSocket com Socket.IO v4.8+
- ✅ Configuração de CORS completa
- ✅ Suporte a salas (rooms)
- ✅ Sistema de broadcast
- ✅ Middleware de autenticação
- ✅ Logging detalhado de conexões
- ✅ Graceful shutdown
- ✅ Health check integrado
- ✅ Containerizado com Docker

## 📋 Pré-requisitos

- Node.js 20+ (ou Docker)
- pnpm 10.20.0+

## 🏥 Health Check

O servidor expõe uma rota HTTP `/health` que retorna o status do servidor:

```bash
# Verificar saúde do servidor
curl http://localhost:3000/health

# Resposta:
# {"status":"ok","timestamp":"2025-11-06T...","connections":0}
```

## 🔧 Instalação

### Instalação Local

```bash
# Instalar dependências
pnpm install

# Iniciar servidor em modo desenvolvimento (com auto-reload)
pnpm dev

# Iniciar servidor em modo produção
pnpm start
```

### Instalação com Docker

```bash
# Construir imagem Docker
docker build -t mpg-socket .

# Executar container
docker run -p 3000:3000 mpg-socket

# Executar com variáveis de ambiente customizadas
docker run -p 3000:3000 \
  -e PORT=3000 \
  -e CORS_ORIGIN=https://meusite.com \
  mpg-socket
```

## 🌐 Variáveis de Ambiente

| Variável | Descrição | Valor Padrão |
|----------|-----------|--------------|
| `PORT` | Porta do servidor | `3000` |
| `CORS_ORIGIN` | Origem permitida para CORS | `*` (qualquer origem) |

## 📡 Eventos do Socket.IO

### Eventos do Servidor → Cliente

- `welcome` - Mensagem de boas-vindas ao conectar
- `message-response` - Resposta a uma mensagem enviada
- `broadcast-message` - Mensagem broadcast de outro cliente
- `user-joined` - Notificação de usuário entrando na sala
- `user-left` - Notificação de usuário saindo da sala
- `room-message-received` - Mensagem recebida em uma sala
- `room-joined` - Confirmação de entrada na sala

### Eventos do Cliente → Servidor

- `message` - Enviar mensagem ao servidor
- `broadcast` - Enviar broadcast para todos os clientes
- `join-room` - Entrar em uma sala específica
- `leave-room` - Sair de uma sala específica
- `room-message` - Enviar mensagem para uma sala

## 💻 Exemplo de Cliente

### JavaScript/Node.js

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

// Escutar evento de boas-vindas
socket.on('welcome', (data) => {
  console.log('Conectado!', data);
});

// Enviar mensagem
socket.emit('message', { text: 'Olá, servidor!' });

// Escutar resposta
socket.on('message-response', (data) => {
  console.log('Resposta recebida:', data);
});

// Entrar em uma sala
socket.emit('join-room', 'sala-1');

// Enviar mensagem para sala
socket.emit('room-message', {
  room: 'sala-1',
  message: 'Olá, pessoal da sala!'
});
```

### HTML/Browser

```html
<!DOCTYPE html>
<html>
<head>
  <title>Cliente Socket.IO</title>
</head>
<body>
  <h1>Cliente WebSocket</h1>
  <div id="messages"></div>
  
  <script src="https://cdn.socket.io/4.8.1/socket.io.min.js"></script>
  <script>
    const socket = io('http://localhost:3000');
    
    socket.on('welcome', (data) => {
      console.log('Conectado!', data);
      document.getElementById('messages').innerHTML += 
        `<p>Conectado: ${data.message}</p>`;
    });
    
    socket.emit('message', { text: 'Olá do navegador!' });
  </script>
</body>
</html>
```

## 🏗️ Estrutura do Projeto

```
mpg-socket/
├── index.js           # Servidor Socket.IO principal
├── package.json       # Dependências e scripts
├── Dockerfile         # Configuração Docker
├── .dockerignore     # Arquivos ignorados pelo Docker
└── README.md         # Documentação
```

## 🔒 Segurança

- Container roda com usuário não-root
- Imagem baseada em Alpine Linux (menor superfície de ataque)
- CORS configurável por ambiente
- Health check integrado

## 📊 Monitoramento

O servidor inclui logs detalhados de:
- Conexões e desconexões
- Mensagens enviadas/recebidas
- Entrada/saída de salas
- Erros e exceções

## 🐳 Docker Compose (Opcional)

Crie um arquivo `docker-compose.yml`:

```yaml
version: '3.8'

services:
  socket-server:
    build: .
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - CORS_ORIGIN=*
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 3s
      retries: 3
```

Execute com:

```bash
docker-compose up -d
```

## 📝 Licença

ISC

## 👤 Autor

Lucas

