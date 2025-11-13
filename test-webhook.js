// Script de teste para enviar webhooks para o servidor
// Uso: node test-webhook.js

const URL = 'http://localhost:3001/events';

// Função para enviar webhook
async function sendWebhook(instance, event, data) {
  try {
    const response = await fetch(URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        instance,
        event,
        data,
        apikey: 'TEST_API_KEY', // Isso NÃO será enviado ao WebSocket
        server_url: 'https://test.example.com'
      })
    });

    const result = await response.json();
    console.log(`✅ Webhook enviado para instância ${instance}:`, result);
    return result;
  } catch (error) {
    console.error(`❌ Erro ao enviar webhook:`, error.message);
  }
}

// Testes
async function runTests() {
  console.log('🧪 Iniciando testes de webhook...\n');

  // Teste 1: QR Code atualizado para instância 1
  console.log('📝 Teste 1: QR Code para instância 5521969055336');
  await sendWebhook('5521969055336', 'qrcode.updated', {
    qrcode: {
      instance: '5521969055336',
      pairingCode: 'ABC123',
      base64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...'
    }
  });

  await new Promise(resolve => setTimeout(resolve, 1000));

  // Teste 2: Mensagem recebida para instância 1
  console.log('\n📝 Teste 2: Mensagem para instância 5521969055336');
  await sendWebhook('5521969055336', 'message.received', {
    from: '+5521987654321',
    text: 'Olá, tudo bem?',
    timestamp: new Date().toISOString()
  });

  await new Promise(resolve => setTimeout(resolve, 1000));

  // Teste 3: QR Code para instância 2 (diferente)
  console.log('\n📝 Teste 3: QR Code para instância 5521987654321');
  await sendWebhook('5521987654321', 'qrcode.updated', {
    qrcode: {
      instance: '5521987654321',
      pairingCode: 'XYZ789',
      base64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...'
    }
  });

  await new Promise(resolve => setTimeout(resolve, 1000));

  // Teste 4: Status de conexão
  console.log('\n📝 Teste 4: Status de conexão para instância 5521969055336');
  await sendWebhook('5521969055336', 'connection.status', {
    status: 'connected',
    battery: 85,
    lastSeen: new Date().toISOString()
  });

  await new Promise(resolve => setTimeout(resolve, 1000));

  // Teste 5: Evento customizado
  console.log('\n📝 Teste 5: Evento customizado para instância 5521969055336');
  await sendWebhook('5521969055336', 'custom.event', {
    message: 'Este é um evento customizado!',
    data: {
      foo: 'bar',
      number: 42,
      nested: {
        value: true
      }
    }
  });

  console.log('\n✅ Todos os testes concluídos!');
  console.log('\n💡 Dica: Abra o exemplo-cliente.html no navegador para ver os eventos em tempo real.');
}

// Executar testes
runTests();

