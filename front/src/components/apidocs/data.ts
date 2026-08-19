import type { EndpointDef } from './types';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const API_ENDPOINTS: EndpointDef[] = [
  {
    id: 'actions-create',
    category: 'ACTIONS',
    title: 'Register Action',
    method: 'POST',
    path: '/v1/actions',
    permission: 'actions:create',
    permissionDesc: 'Allows the API key to create new actions within the workspace.',
    description: 'Registra uma nova ação de agente no sistema. Esta ação será capturada pelo pipeline da FluxionIA e pode engatilhar workflows configurados.',
    bodyParams: [
      {
        name: 'actionType',
        type: 'string',
        required: true,
        description: 'O tipo da ação a ser registrada.',
        enumValues: ['send_message', 'lead_generated', 'custom_event']
      },
      {
        name: 'data',
        type: 'object',
        required: false,
        description: 'Dados adicionais (payload) relacionados à ação. Pode conter qualquer estrutura JSON útil para o seu workflow.'
      }
    ],
    responses: [
      {
        status: 201,
        label: 'Created',
        description: 'Ação registrada com sucesso.',
        example: {
          success: true,
          data: {
            id: 'act_123abc',
            actionType: 'send_message',
            createdAt: '2026-08-07T12:00:00Z'
          }
        }
      },
      {
        status: 400,
        label: 'Bad Request',
        description: 'Parâmetros inválidos ou faltando.',
        example: {
          statusCode: 400,
          message: ['actionType must be a string'],
          error: 'Bad Request'
        }
      },
      {
        status: 403,
        label: 'Forbidden',
        description: 'A API Key não possui a permissão actions:create.',
        example: {
          statusCode: 403,
          message: 'Forbidden resource',
          error: 'Forbidden'
        }
      }
    ],
    snippet: {
      curl: `curl -X POST \\
  https://api.fluxion.ai/v1/actions \\
  -H "X-API-Key: flx_live_sua_chave_aqui" \\
  -H "Content-Type: application/json" \\
  -d '{
    "actionType": "lead_generated",
    "data": { "source": "landing_page" }
  }'`,
      js: {
        nestjs: `import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class FluxionService {
  constructor(private readonly httpService: HttpService) {}

  async createAction() {
    const url = 'https://api.fluxion.ai/v1/actions';
    const headers = { 'X-API-Key': 'flx_live_sua_chave_aqui' };
    const body = {
      actionType: 'lead_generated',
      data: { source: 'landing_page' }
    };

    const response = await firstValueFrom(this.httpService.post(url, body, { headers }));
    return response.data;
  }
}`,
        express: `const express = require('express');
const axios = require('axios');
const app = express();

app.post('/lead', async (req, res) => {
  try {
    const response = await axios.post('https://api.fluxion.ai/v1/actions', {
      actionType: 'lead_generated',
      data: req.body
    }, {
      headers: { 'X-API-Key': 'flx_live_sua_chave_aqui' }
    });

    res.json({ success: true, action: response.data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});`,
        axios: `import axios from 'axios';

const createAction = async () => {
  const { data } = await axios.post('https://api.fluxion.ai/v1/actions', {
    actionType: 'lead_generated',
    data: { source: 'landing_page' }
  }, {
    headers: { 'X-API-Key': 'flx_live_sua_chave_aqui' }
  });
  console.log(data);
};`,
        fetch: `fetch("https://api.fluxion.ai/v1/actions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": "flx_live_sua_chave_aqui"
  },
  body: JSON.stringify({
    actionType: "lead_generated",
    data: { source: "landing_page" }
  })
})
.then(res => res.json())
.then(console.log);`
      },
      ts: `import axios from 'axios';

const createAction = async () => {
  const { data } = await axios.post('https://api.fluxion.ai/v1/actions', {
    actionType: 'lead_generated',
    data: { source: 'landing_page' }
  }, {
    headers: { 'X-API-Key': 'flx_live_sua_chave_aqui' }
  });
  console.log(data);
};`,
      java: {
        springBoot: `package com.empresa.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.util.Map;
import java.util.HashMap;

@Service
public class FluxionApiService {

    private final RestTemplate restTemplate = new RestTemplate();

    public String registerAction() {
        String url = "https://api.fluxion.ai/v1/actions";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-API-Key", "flx_live_sua_chave_aqui");

        Map<String, Object> body = new HashMap<>();
        body.put("actionType", "lead_generated");
        body.put("data", Map.of("source", "landing_page"));

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

        return response.getBody();
    }
}`,
        httpClient: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class FluxionActionExample {
    public static void main(String[] args) throws Exception {
        String json = """
            {
                "actionType": "lead_generated",
                "data": { "source": "landing_page" }
            }
            """;

        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("https://api.fluxion.ai/v1/actions"))
            .header("X-API-Key", "flx_live_sua_chave_aqui")
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(json))
            .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        System.out.println(response.statusCode() + ": " + response.body());
    }
}`
      },
      python: `import requests

url = "https://api.fluxion.ai/v1/actions"
headers = {
    "X-API-Key": "flx_live_sua_chave_aqui",
    "Content-Type": "application/json"
}
data = {
    "actionType": "lead_generated",
    "data": { "source": "landing_page" }
}

response = requests.post(url, json=data, headers=headers)
print(response.json())`,
      php: `$ch = curl_init('https://api.fluxion.ai/v1/actions');
$payload = json_encode(array(
    'actionType' => 'lead_generated',
    'data' => array('source' => 'landing_page')
));

curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, array(
    'X-API-Key: flx_live_sua_chave_aqui',
    'Content-Type: application/json'
));
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);

$response = curl_exec($ch);
curl_close($ch);
echo $response;`
    }
  },
  {
    id: 'events-trigger',
    category: 'EVENTS',
    title: 'Trigger Event',
    method: 'POST',
    path: '/v1/events',
    permission: 'events:create',
    permissionDesc: 'Allows the API key to trigger external events.',
    description: 'Dispara um evento no barramento do sistema, notificando agentes e automações.',
    bodyParams: [
      {
        name: 'eventType',
        type: 'string',
        required: true,
        description: 'Identificador único do evento.',
        enumValues: ['user_signup', 'payment_received', 'webhook_received']
      },
      {
        name: 'payload',
        type: 'object',
        required: false,
        description: 'Dados customizados do evento.'
      }
    ],
    responses: [
      {
        status: 201,
        label: 'Created',
        description: 'Evento disparado com sucesso.',
        example: { success: true, eventId: 'evt_789xyz' }
      }
    ],
    snippet: {
      curl: `curl -X POST https://api.fluxion.ai/v1/events -H "X-API-Key: flx_live_sua_chave_aqui" -H "Content-Type: application/json" -d '{"eventType":"user_signup"}'`,
      js: {
        nestjs: `import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class EventService {
  constructor(private readonly http: HttpService) {}

  async triggerEvent() {
    await this.http.axiosRef.post('https://api.fluxion.ai/v1/events', { eventType: 'user_signup' }, {
      headers: { 'X-API-Key': 'flx_live_sua_chave_aqui' }
    });
  }
}`,
        express: `app.post('/events', async (req, res) => {
  await axios.post('https://api.fluxion.ai/v1/events', req.body, {
    headers: { 'X-API-Key': 'flx_live_sua_chave_aqui' }
  });
  res.json({ ok: true });
});`,
        axios: `axios.post('https://api.fluxion.ai/v1/events', { eventType: 'user_signup' }, { headers: { 'X-API-Key': 'flx_live_sua_chave_aqui' } });`,
        fetch: `fetch('https://api.fluxion.ai/v1/events', { method: 'POST', headers: { 'X-API-Key': 'flx_live_sua_chave_aqui', 'Content-Type': 'application/json' }, body: JSON.stringify({ eventType: 'user_signup' }) });`
      },
      ts: `import axios from 'axios';
await axios.post('https://api.fluxion.ai/v1/events', { eventType: 'user_signup' }, { headers: { 'X-API-Key': 'KEY' } });`,
      java: {
        springBoot: `@Service
public class FluxionEventService {
    @Autowired
    private RestTemplate restTemplate;

    public void triggerEvent() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-API-Key", "flx_live_sua_chave_aqui");
        HttpEntity<Map<String, String>> request = new HttpEntity<>(Map.of("eventType", "user_signup"), headers);
        restTemplate.postForEntity("https://api.fluxion.ai/v1/events", request, String.class);
    }
}`,
        httpClient: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;

HttpClient client = HttpClient.newHttpClient();
HttpRequest req = HttpRequest.newBuilder()
    .uri(URI.create("https://api.fluxion.ai/v1/events"))
    .header("X-API-Key", "flx_live_sua_chave_aqui")
    .POST(HttpRequest.BodyPublishers.ofString("{\"eventType\":\"user_signup\"}"))
    .build();
client.send(req, HttpResponse.BodyHandlers.ofString());`
      },
      python: `import requests
requests.post('https://api.fluxion.ai/v1/events', json={'eventType': 'user_signup'}, headers={'X-API-Key': 'flx_live_sua_chave_aqui'})`,
      php: `// Use cURL in PHP`
    }
  },
  {
    id: 'messages-send',
    category: 'MESSAGES',
    title: 'Send WhatsApp & AI Message',
    method: 'POST',
    path: '/v1/messages',
    permission: 'messages:send',
    permissionDesc: 'Permite que a chave de API envie mensagens e acione a IA para disparo via WhatsApp / Email.',
    description: 'Recebe uma instrução do seu sistema externo, aciona o Agente de IA para gerar o conteúdo personalizado e realiza o disparo automático via WhatsApp ou E-mail para o cliente final.',
    bodyParams: [
      {
        name: 'channel',
        type: 'string',
        required: true,
        description: 'Canal de destino do disparo.',
        enumValues: ['whatsapp', 'email', 'sms']
      },
      {
        name: 'to',
        type: 'string',
        required: true,
        description: 'Número de telefone do cliente com código do país (ex: 5585999999999) ou e-mail.'
      },
      {
        name: 'message',
        type: 'string',
        required: true,
        description: 'Mensagem de instrução para a IA ou texto direto a ser enviado.'
      },
      {
        name: 'context',
        type: 'object',
        required: false,
        description: 'Objeto JSON com dados de contexto para a IA personalizar a mensagem (ex: nome do cliente, dados do pedido).'
      }
    ],
    responses: [
      {
        status: 201,
        label: 'Sent / Dispatched',
        description: 'Mensagem processada pela IA e enviada via WhatsApp com sucesso.',
        example: { 
          success: true, 
          messageId: 'msg_888whatsapp', 
          channel: 'whatsapp',
          to: '5585999999999',
          aiResponse: 'Olá Carlos! Seu pedido #123 foi atualizado para Em Trânsito. Acompanhe pelo link...',
          status: 'delivered' 
        }
      },
      {
        status: 401,
        label: 'Unauthorized',
        description: 'API Key inválida ou ausente no cabeçalho X-API-Key.',
        example: {
          statusCode: 401,
          message: 'Invalid API Key',
          error: 'Unauthorized'
        }
      }
    ],
    snippet: {
      curl: `curl -X POST https://api.fluxion.ai/v1/messages \\
  -H "X-API-Key: flx_live_sua_chave_aqui" \\
  -H "Content-Type: application/json" \\
  -d '{
    "channel": "whatsapp",
    "to": "5585999999999",
    "message": "Notifique o cliente Carlos sobre o envio do pedido #1042",
    "context": { "clientName": "Carlos", "orderId": "1042", "trackingUrl": "https://rastreio.com/1042" }
  }'`,
      js: {
        nestjs: `import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class WhatsappNotificationService {
  constructor(private readonly httpService: HttpService) {}

  async sendAiWhatsappMessage(to: string, clientName: string, orderId: string) {
    const url = 'https://api.fluxion.ai/v1/messages';
    const payload = {
      channel: 'whatsapp',
      to,
      message: \`Notifique o cliente \${clientName} sobre o envio do pedido #\${orderId}\`,
      context: { clientName, orderId }
    };

    const headers = { 'X-API-Key': 'flx_live_sua_chave_aqui' };
    const { data } = await firstValueFrom(this.httpService.post(url, payload, { headers }));
    return data;
  }
}`,
        express: `const express = require('express');
const axios = require('axios');
const app = express();

app.post('/notify-whatsapp', async (req, res) => {
  const { phone, clientName, orderId } = req.body;

  try {
    const response = await axios.post('https://api.fluxion.ai/v1/messages', {
      channel: 'whatsapp',
      to: phone,
      message: \`Notifique o cliente \${clientName} sobre o envio do pedido #\${orderId}\`,
      context: { clientName, orderId }
    }, {
      headers: { 'X-API-Key': 'flx_live_sua_chave_aqui' }
    });

    res.json({ success: true, result: response.data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});`,
        axios: `import axios from 'axios';

const sendWhatsappMessage = async () => {
  const { data } = await axios.post('https://api.fluxion.ai/v1/messages', {
    channel: 'whatsapp',
    to: '5585999999999',
    message: 'Notifique o cliente Carlos sobre o envio do pedido #1042',
    context: { clientName: 'Carlos', orderId: '1042' }
  }, {
    headers: { 'X-API-Key': 'flx_live_sua_chave_aqui' }
  });
  console.log(data);
};`,
        fetch: `fetch("https://api.fluxion.ai/v1/messages", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": "flx_live_sua_chave_aqui"
  },
  body: JSON.stringify({
    channel: "whatsapp",
    to: "5585999999999",
    message: "Notifique o cliente Carlos sobre o envio do pedido #1042",
    context: { clientName: "Carlos", orderId: "1042" }
  })
})
.then(res => res.json())
.then(console.log);`
      },
      ts: `import axios from 'axios';

const sendWhatsappAiMessage = async () => {
  const { data } = await axios.post('https://api.fluxion.ai/v1/messages', {
    channel: 'whatsapp',
    to: '5585999999999',
    message: 'Notifique o cliente Carlos sobre o envio do pedido #1042',
    context: { clientName: 'Carlos', orderId: '1042' }
  }, {
    headers: { 'X-API-Key': 'flx_live_sua_chave_aqui' }
  });
  console.log(data);
};`,
      java: {
        springBoot: `package com.empresa.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.util.Map;
import java.util.HashMap;

@Service
public class WhatsappNotificationService {

    private final RestTemplate restTemplate = new RestTemplate();

    public String sendAiWhatsappMessage(String toPhone, String clientName, String orderId) {
        String url = "https://api.fluxion.ai/v1/messages";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-API-Key", "flx_live_sua_chave_aqui");

        Map<String, Object> payload = new HashMap<>();
        payload.put("channel", "whatsapp");
        payload.put("to", toPhone);
        payload.put("message", "Notifique o cliente " + clientName + " sobre o envio do pedido #" + orderId);
        payload.put("context", Map.of("clientName", clientName, "orderId", orderId));

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);
        ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

        return response.getBody();
    }
}`,
        httpClient: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class FluxionWhatsAppExample {
    public static void main(String[] args) throws Exception {
        String json = """
            {
                "channel": "whatsapp",
                "to": "5585999999999",
                "message": "Notifique o cliente Carlos sobre o envio do pedido #1042",
                "context": { "clientName": "Carlos", "orderId": "1042" }
            }
            """;

        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("https://api.fluxion.ai/v1/messages"))
            .header("X-API-Key", "flx_live_sua_chave_aqui")
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(json))
            .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        System.out.println("Status Code: " + response.statusCode());
        System.out.println("Resposta da IA: " + response.body());
    }
}`
      },
      python: `import requests

url = "https://api.fluxion.ai/v1/messages"
headers = {
    "X-API-Key": "flx_live_sua_chave_aqui",
    "Content-Type": "application/json"
}
payload = {
    "channel": "whatsapp",
    "to": "5585999999999",
    "message": "Notifique o cliente Carlos sobre o envio do pedido #1042",
    "context": {"clientName": "Carlos", "orderId": "1042"}
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`,
      php: `$ch = curl_init('https://api.fluxion.ai/v1/messages');
$payload = json_encode(array(
    'channel' => 'whatsapp',
    'to' => '5585999999999',
    'message' => 'Notifique o cliente Carlos sobre o envio do pedido #1042',
    'context' => array('clientName' => 'Carlos', 'orderId' => '1042')
));

curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, array(
    'X-API-Key: flx_live_sua_chave_aqui',
    'Content-Type: application/json'
));
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);

$response = curl_exec($ch);
curl_close($ch);
echo $response;`
    }
  }
];
