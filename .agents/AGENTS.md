# 🚀 FluxionIA — Especificação de Arquitetura, Design, Segurança e Engenharia

> **Documento operacional para agentes de desenvolvimento**
>
> Este documento define como o frontend da FluxionIA deve ser construído, mantido, auditado e evoluído.
>
> **Regra principal:** preservar a arquitetura, identidade visual, segurança e padrões existentes antes de introduzir mudanças.

---

# 1. Princípios Fundamentais

A FluxionIA é uma plataforma enterprise de produtividade, automação com IA, CRM, documentos, workflows e integração com ferramentas de desenvolvimento.

O frontend deve priorizar:

1. **Clareza**
2. **Consistência**
3. **Segurança**
4. **Manutenibilidade**
5. **Performance**
6. **Acessibilidade**
7. **Responsividade**
8. **Experiência profissional**
9. **Dados reais**
10. **Previsibilidade**

O objetivo não é apenas produzir uma interface visualmente bonita.

O objetivo é produzir uma aplicação:

> **profissional, previsível, segura, rápida, acessível e sustentável para evolução contínua.**

---

# 2. Regras para o Agente

## 2.1 Antes de modificar qualquer coisa

O agente deve:

1. Inspecionar o código existente.
2. Identificar componentes reutilizáveis.
3. Verificar dependências instaladas.
4. Verificar padrões já utilizados no projeto.
5. Verificar contratos da API antes de assumir estruturas de dados.
6. Verificar Design Tokens existentes.
7. Verificar se já existe solução para o problema.
8. Identificar impactos em outras páginas/componentes.
9. Fazer a menor alteração necessária.

Não substituir uma implementação existente simplesmente porque existe uma alternativa considerada "melhor".

---

## 2.2 Não fazer refatorações oportunistas

Durante uma tarefa específica, não modificar arquivos ou sistemas não relacionados apenas porque podem ser melhorados.

Evitar:

* reescrever páginas inteiras sem necessidade;
* trocar bibliotecas;
* migrar o sistema de estilos;
* alterar o sistema de autenticação;
* alterar contratos da API;
* trocar arquitetura;
* instalar novas dependências;
* remover dependências;
* reorganizar todo o projeto.

Se uma mudança arquitetural for realmente necessária:

1. explicar o problema;
2. explicar a solução;
3. listar arquivos afetados;
4. explicar impactos;
5. apresentar alternativas;
6. aguardar aprovação quando a mudança for significativa.

---

# 3. Regras de Integridade dos Dados

## 3.1 Nunca inventar dados

O frontend deve trabalhar somente com:

* dados retornados pela API;
* dados fornecidos pelo usuário;
* dados calculados de maneira determinística;
* estados internos da aplicação.

Nunca criar dados fictícios para fazer uma interface parecer completa.

Não utilizar:

```text
mock data
fake data
dummy data
placeholder data
hardcoded records
```

em funcionalidades reais.

Se uma API ainda não existir, deixar isso explícito.

---

## 3.2 Não mascarar falhas da API

Uma falha de API não deve ser convertida silenciosamente em:

```text
[]
```

ou:

```text
0
```

ou:

```text
"Nenhum resultado"
```

quando isso não representa a realidade.

Diferenciar:

```text
loading
success
empty
error
unauthorized
forbidden
offline
```

---

# 4. Segurança do Frontend

## 4.1 Regra fundamental

> **O frontend nunca é uma autoridade de segurança.**

Tudo que estiver no navegador pode ser inspecionado ou manipulado pelo usuário.

Portanto:

* não confiar em roles fornecidas pelo frontend;
* não confiar em permissões calculadas exclusivamente no frontend;
* não confiar em preços;
* não confiar em IDs enviados pelo cliente;
* não confiar em flags de segurança;
* não confiar em validações exclusivamente client-side.

A autorização real deve ocorrer no backend.

---

## 4.2 Secrets

Nunca colocar no frontend:

* senhas;
* private keys;
* database credentials;
* tokens administrativos;
* secrets de serviços;
* credenciais internas;
* API keys privadas;
* credenciais que deveriam permanecer no servidor.

Tudo que fizer parte do bundle do Vite deve ser considerado potencialmente público.

Variáveis `VITE_*` não devem conter secrets privados.

---

## 4.3 Dados sensíveis

A API não deve retornar dados sensíveis apenas porque "o frontend não os utiliza".

Evitar receber no browser:

```text
passwordHash
privateKey
internalSecret
serviceCredential
databaseCredential
```

ou informações internas que não sejam necessárias para a operação atual.

---

## 4.4 XSS

Evitar:

```text
dangerouslySetInnerHTML
innerHTML
outerHTML
eval
new Function
```

sempre que possível.

Quando HTML externo precisar ser renderizado:

1. validar a origem;
2. sanitizar o conteúdo;
3. limitar as capacidades permitidas;
4. documentar a necessidade.

Conteúdo vindo de usuários, APIs, documentos ou IA deve ser tratado como **não confiável**.

---

## 4.5 Console

Nunca registrar em produção:

```text
access tokens
refresh tokens
senhas
API keys
cookies
credenciais
dados pessoais desnecessários
respostas completas contendo informações sensíveis
```

Remover `console.log()` de debugging antes da produção quando ele expuser informações desnecessárias.

---

# 5. Autenticação

Toda comunicação autenticada com o backend deve utilizar:

```text
services/api.ts
```

por meio do wrapper:

```text
authFetch
```

O wrapper deve centralizar:

* autenticação;
* tratamento de 401;
* renovação de sessão quando aplicável;
* prevenção de loops de refresh;
* tratamento de falha de refresh;
* encerramento de sessão quando necessário.

Não duplicar lógica de autenticação em páginas individuais.

Nenhum componente deve implementar sua própria estratégia de refresh.

---

# 6. Autorização

O frontend pode controlar a visibilidade da interface:

```tsx
{canDelete && <DeleteButton />}
```

mas isso é apenas UX.

O backend deve validar novamente:

```text
usuário
↓
sessão
↓
workspace/tenant
↓
role
↓
permissão
↓
recurso
↓
ação
```

Nunca considerar:

```text
if (isAdmin)
```

no frontend como mecanismo de segurança.

---

# 7. Execução de Terminal

A FluxionIA possui integração com terminal local.

Essa é uma área de alto risco.

## Regras obrigatórias

Nunca executar comandos arbitrários no sistema sem considerar:

* autenticação;
* autorização;
* origem do comando;
* confirmação do usuário;
* timeout;
* limite de recursos;
* tratamento de argumentos;
* escaping;
* contexto de execução;
* auditoria;
* isolamento/sandbox quando aplicável;
* tratamento do output;
* exposição de secrets.

A IA nunca deve receber autoridade implícita para executar qualquer comando simplesmente porque conseguiu gerar o texto do comando.

Fluxo recomendado:

```text
Usuário/IA solicita ação
        ↓
Validação
        ↓
Política de segurança
        ↓
Autorização
        ↓
Confirmação quando necessária
        ↓
Execução
        ↓
Auditoria
        ↓
Resultado
```

---

# 8. Arquitetura Frontend

Stack principal:

* React 19
* TypeScript
* Vite
* React Router 7
* Framer Motion
* `@hello-pangea/dnd`
* TipTap
* XYFlow
* `react-markdown`
* `react-syntax-highlighter`
* Vanilla CSS
* CSS Custom Properties / Design Tokens

Backend:

* NestJS
* Node.js
* PostgreSQL
* Prisma
* Passport JWT
* Google OAuth 2.0
* Google Generative AI
* OpenAI SDK

---

# 9. Hierarquia de Arquitetura

A estrutura conceitual deve seguir:

```text
Design Tokens
      ↓
Primitives
      ↓
Reusable Components
      ↓
Feature Components
      ↓
Patterns
      ↓
Pages
```

Exemplo:

```text
Button
Input
Modal
Toast
Tooltip
Tabs
Table
Skeleton
EmptyState
        ↓
LeadCard
AIMessage
ProjectCard
KanbanCard
        ↓
LeadsPage
ProjectsPage
AiChatPage
```

Não criar componentes duplicados quando já existir um componente equivalente.

---

# 10. Componentes

Componentes devem possuir responsabilidade clara.

Evitar componentes que simultaneamente:

* fazem requests;
* controlam múltiplos formulários;
* possuem dezenas de estados;
* renderizam várias telas;
* possuem regras de negócio complexas;
* manipulam diretamente diversos serviços.

Páginas grandes devem ser divididas por responsabilidade.

Exemplo:

```text
pages/settings/
├── SettingsPage.tsx
├── components/
│   ├── ProfileSettings.tsx
│   ├── SecuritySettings.tsx
│   ├── ApiSettings.tsx
│   └── IntegrationSettings.tsx
└── hooks/
```

Um arquivo possuir muitas linhas não significa automaticamente que ele possui um problema de performance.

Avaliar separadamente:

* tamanho;
* responsabilidade;
* coesão;
* reuso;
* testabilidade;
* dependências;
* re-renders;
* complexidade.

---

# 11. Comunicação com API

Sempre utilizar:

```text
services/api.ts
```

Não espalhar lógica de autenticação por componentes.

Requests devem possuir:

* tratamento de loading;
* tratamento de erro;
* tratamento de sucesso;
* cancelamento quando necessário;
* prevenção de duplicação;
* atualização consistente do estado.

---

# 12. Requests e Concorrência

Evitar:

## N+1

Não fazer:

```text
GET /project
GET /project/column/1
GET /project/column/2
GET /project/column/3
GET /project/column/4
```

quando o domínio exige os dados agregados.

Quando apropriado, preferir endpoint agregado:

```text
GET /projects/:id
```

retornando:

```text
project
 ├── columns
 │    ├── cards
 │    ├── cards
 │    └── cards
```

A decisão sobre agregação deve ser coordenada com o backend.

---

## 12.1 Double Submit

Toda operação mutável deve impedir submissões acidentais duplicadas.

Exemplo:

```tsx
<button disabled={isSubmitting}>
```

Durante uma operação:

```text
idle
↓
submitting
↓
success / error
```

Evitar múltiplos POST/PUT/PATCH/DELETE causados por duplo clique.

---

## 12.2 Race Conditions

Quando filtros ou buscas podem gerar requests concorrentes, utilizar:

```text
AbortController
```

ou mecanismo equivalente.

Exemplo:

```text
Busca A
   ↓
Busca B
   ↓
Busca A termina depois
```

O resultado antigo não deve sobrescrever o resultado mais recente.

---

# 13. Estados de Interface

Todo componente dependente de dados externos deve considerar:

```text
LOADING
SUCCESS
EMPTY
ERROR
RETRY
UNAUTHORIZED
FORBIDDEN
```

Quando aplicável:

```text
SUBMITTING
SAVING
SAVED
OFFLINE
STALE
DISABLED
```

Nunca deixar a interface simplesmente vazia enquanto uma operação está ocorrendo.

---

# 14. Empty States

Empty State não deve ser apenas:

```text
Nenhum resultado.
```

Quando houver uma ação clara, utilizar:

```text
Título
Descrição
CTA principal
```

Exemplo:

```text
Você ainda não possui projetos.

Crie seu primeiro projeto para começar a organizar
seu trabalho.

[ Criar projeto ]
```

Utilizar componente reutilizável:

```text
EmptyState
```

---

# 15. Feedback de Operações

Evitar:

```javascript
alert()
```

Utilizar o sistema de Toast da aplicação.

Operações devem comunicar:

```text
Sucesso
Erro
Processando
Salvando
Copiado
Excluído
Atualizado
```

Para operações destrutivas, utilizar confirmação quando necessário.

---

# 16. Formulários

Formulários devem possuir:

* labels acessíveis;
* validação;
* estado de submitting;
* mensagens de erro;
* prevenção de double submit;
* feedback de sucesso;
* feedback de falha.

Para `FormData`:

> Nunca definir manualmente `Content-Type: application/json`.

Quando o body for `FormData`, permitir que o navegador configure o `multipart/form-data` com sua boundary.

---

# 17. Design System

## Paleta principal

```css
--bg-primary: #09090B;
--bg-secondary: #111113;
--border-subtle: rgba(255, 255, 255, 0.05);
--accent: #E2A336;
--accent-muted: rgba(226, 163, 54, 0.12);
--text-primary: #ECECEC;
--text-secondary: #A1A1AA;
```

Azul corporativo:

```text
#2563EB
#3B82F6
```

Utilizado pontualmente para foco e estados específicos.

---

# 18. Tipografia

Corpo:

```text
Inter
14–16px
line-height: 1.55–1.65
```

Títulos principais:

```text
Instrument Serif
```

A tipografia deve criar hierarquia sem excesso de tamanhos ou pesos.

---

# 19. Direção Visual

Estética:

> **Quiet Luxury / Dark Enterprise**

Referências conceituais:

* Claude
* ChatGPT
* Linear
* Stripe
* Vercel

A FluxionIA não deve copiar visualmente nenhuma dessas marcas.

Utilizá-las apenas como referência de:

* simplicidade;
* densidade;
* hierarquia;
* acabamento;
* consistência.

---

# 20. Anti-Genérico

Evitar:

* gradientes chamativos;
* glow neon;
* excesso de sombras;
* excesso de cards;
* bordas em todas as áreas;
* excesso de badges;
* chips desnecessários;
* ícones decorativos sem função;
* avatares genéricos de robôs;
* ilustrações genéricas de IA;
* interfaces visualmente "AI-generated".

Mensagens da IA devem fluir naturalmente no canvas.

Não transformar cada resposta em um card.

---

# 21. Espaçamento e Hierarquia

Priorizar:

```text
alinhamento
↓
espaçamento
↓
hierarquia
↓
contraste
↓
decoração
```

Não tentar resolver uma interface ruim adicionando:

* cores;
* sombras;
* gradientes;
* bordas;
* animações.

Se a hierarquia estiver ruim, corrigir a estrutura primeiro.

---

# 22. Animações

Utilizar Framer Motion quando a animação melhorar:

* feedback;
* transição;
* continuidade;
* compreensão espacial.

Evitar animações decorativas excessivas.

Não animar tudo.

Animações devem ser:

* rápidas;
* discretas;
* consistentes;
* interrompíveis quando apropriado.

---

# 23. Responsividade

A aplicação deve funcionar em:

```text
Desktop grande
Desktop
Notebook
Tablet
Mobile
```

Evitar layouts dependentes de valores rígidos.

Quando a interface precisar ocupar a viewport em dispositivos móveis, preferir:

```css
100dvh
```

em vez de assumir que:

```css
100vh
```

representa corretamente a viewport visível.

Testar especialmente:

* sidebar;
* tabelas;
* modais;
* formulários;
* Kanban;
* editor;
* terminal;
* gráficos;
* menus;
* filtros.

---

# 24. Acessibilidade

Acessibilidade é requisito de qualidade, não detalhe visual.

Componentes interativos devem:

* funcionar com teclado;
* possuir foco visível;
* possuir nome acessível;
* utilizar HTML semântico;
* possuir labels;
* comunicar erros;
* respeitar contraste;
* não depender apenas de cor;
* possuir `aria-label` quando necessário;
* manter ordem lógica de foco.

Botões que possuem apenas ícone devem possuir nome acessível.

---

# 25. Performance

Verificar:

* bundle size;
* code splitting;
* lazy loading;
* carregamento de rotas;
* imagens;
* fontes;
* requests duplicadas;
* requests N+1;
* renderizações desnecessárias;
* listas grandes;
* virtualização quando realmente necessária;
* cache;
* prefetch;
* Core Web Vitals.

Não utilizar `memo`, `useMemo` ou `useCallback` indiscriminadamente.

Otimização deve ser baseada em evidência.

---

# 26. Dados no Frontend

Não colocar no frontend:

```text
regras de negócio secretas
credenciais
secrets
permissões como autoridade
valores financeiros confiáveis
configurações internas sensíveis
```

O frontend pode possuir:

```text
UI configuration
public configuration
feature flags não sensíveis
design tokens
rotas
labels
```

mas a autoridade permanece no backend.

---

# 27. Cache e Estado

Evitar estado global sem necessidade.

Antes de criar estado global, perguntar:

```text
Isso realmente precisa existir fora do componente?
```

Separar conceitualmente:

```text
UI State
Server State
Authentication State
Form State
Local State
```

Não duplicar dados do servidor em vários estados sem necessidade.

---

# 28. Módulos

## Dashboard

Arquivo:

```text
DashboardPage.tsx
```

Responsabilidades:

* métricas reais;
* Projects;
* In Progress;
* Completed;
* atividade recente;
* `getLogs()`;
* loading;
* empty;
* error.

Não utilizar números fictícios.

---

## Projetos / Kanban

Arquivo:

```text
ProjectsPage.tsx
```

Visão mestre:

* grid responsivo;
* pasta em destaque âmbar;
* data de criação;
* exclusão discreta no hover.

Visão detalhe:

* colunas;
* tarefas;
* prioridades;
* prazos;
* drag-and-drop;
* ações Git.

Operações destrutivas devem possuir confirmação apropriada.

---

## AI Chat

Arquivo:

```text
AiChatPage.tsx
```

Características:

* largura aproximada de 740px;
* interface minimalista;
* Markdown;
* syntax highlighting;
* copiar;
* feedback positivo/negativo;
* Toast;
* textarea multiline;
* auto resize;
* `Enter` para enviar;
* `Shift + Enter` para nova linha.

Comandos de terminal devem respeitar todas as regras de segurança definidas neste documento.

---

## Terminal / GitHub

Arquivo:

```text
GitPage.tsx
```

Terminal:

* histórico;
* ArrowUp;
* ArrowDown;
* Tab;
* comando `ai <pedido>`;
* tratamento de erros;
* timeout;
* segurança.

GitHub:

* integração REST;
* usuário;
* repositórios;
* públicos/privados conforme autorização;
* estrelas.

Credenciais do GitHub nunca devem ser expostas desnecessariamente ao frontend.

---

## Documentos

Arquivo:

```text
DocsPage.tsx
```

Utilizar:

```text
TipTap
```

Suportar:

* rich text;
* autosave;
* debounce;
* listagem;
* workspace;
* exportação PDF.

Autosave deve possuir:

```text
saving
saved
error
```

e não sobrescrever silenciosamente alterações concorrentes.

---

## CRM / Leads

Arquivo:

```text
LeadsPage.tsx
```

Suportar:

* captura;
* qualificação por IA;
* filtros;
* origem;
* prioridade;
* salvamento;
* detalhes.

Filtros devem cancelar requests obsoletas quando necessário.

---

## Automations

Arquivo:

```text
AutomationsPage.tsx
```

Utilizar:

```text
XYFlow
```

para:

* triggers;
* actions;
* conexões;
* visualização;
* edição;
* validação.

---

## Settings

Arquivo:

```text
SettingsPage.tsx
```

Gerenciar:

* perfil;
* temas;
* API Keys;
* integrações;
* segurança.

API keys devem ser tratadas como dados sensíveis.

Não exibir uma chave completa depois de armazenada, quando a arquitetura permitir mascaramento.

---

# 29. Qualidade de Código

Todo código adicionado deve ser validado.

Obrigatório:

```bash
npx tsc --noEmit
```

Quando scripts existirem no projeto, executar também:

```bash
npm run lint
npm run build
npm test
```

ou equivalentes definidos pelo projeto.

Não considerar uma alteração concluída apenas porque o código "parece correto".

---

# 30. Testes

Alterações importantes devem possuir testes adequados.

Priorizar testes para:

* autenticação;
* permissões;
* formulários;
* operações destrutivas;
* criação/edição;
* filtros;
* requests;
* estados de erro;
* componentes críticos;
* fluxos principais.

Para mudanças visuais importantes, validar também no navegador.

---

# 31. Auditoria no Navegador

Quando disponível, utilizar ferramentas de browser/DevTools para verificar o sistema realmente executando.

Inspecionar:

```text
DOM
Console
Network
Requests
Responses
Storage
Performance
Layout
Responsive
```

Não considerar uma interface correta apenas porque o código parece correto.

---

# 32. Critérios de Aceite

Uma tarefa só está concluída quando:

### Funcionalidade

* funciona conforme solicitado;
* utiliza dados reais;
* trata erros;
* trata loading;
* trata empty state;
* não gera duplicações.

### Segurança

* não expõe secrets;
* não confia no frontend para autorização;
* não registra dados sensíveis;
* não introduz XSS conhecido;
* não aumenta desnecessariamente a superfície de ataque.

### Design

* respeita Design Tokens;
* respeita identidade visual;
* mantém hierarquia;
* não introduz UI genérica;
* funciona nos breakpoints relevantes.

### Engenharia

* TypeScript sem erros;
* sem imports mortos;
* sem código temporário;
* sem mocks acidentais;
* sem duplicação desnecessária;
* arquitetura coerente.

### Performance

* sem requests obviamente duplicadas;
* sem N+1 evitável;
* sem renderização desnecessária evidente;
* sem assets desnecessariamente pesados.

### Acessibilidade

* teclado;
* foco;
* labels;
* semântica;
* contraste;
* nomes acessíveis.

---

# 33. Pendências Conhecidas

## HIGH

### 1. Assets com caminho relativo [CONCLUÍDO]

Arquivos:

```text
LoginPage.tsx
RegisterPage.tsx
DashboardLayout.tsx
```

Status:

```text
CONCLUÍDO: Substituído por importação estática via Vite (`import logoImg from '../assets/logo.png'`).
```

---

### 2. N+1 no Kanban [CONCLUÍDO]

Arquivos:

```text
back/src/projects/projects.service.ts
front/src/services/projects.ts
front/src/pages/ProjectsPage.tsx
```

Status:

```text
CONCLUÍDO: O endpoint `GET /projects/:id` (findOne) no backend agora retorna o grafo hierárquico aninhado completo (`boards.columns.cards`, tags, assignees ordenados por `position: 'asc'`). O frontend `handleOpenProject` consome `projectsApi.getById(id)` em apenas 1 requisição em vez de disparar uma chamada por coluna.
```

---

### 3. Double Submit [CONCLUÍDO]

Arquivos:

```text
ProjectsPage.tsx
LeadsPage.tsx
SettingsPage.tsx
```

Status:

```text
CONCLUÍDO: Adicionados controles de estado (`isSubmittingProject`, `isSubmittingCard`, `savingLeadId`, `saving`) e desabilitação de botões/inputs em todas as mutações.
```

---

### 4. Componentes monolíticos [CONCLUÍDO]

Arquivos:

```text
front/src/pages/SettingsPage.tsx
front/src/pages/settings/components/*
```

Status:

```text
CONCLUÍDO: SettingsPage.tsx foi refatorado e modularizado. As abas foram extraídas para componentes coesos (`AccountTab`, `NotificationsTab`, `SecurityTab`, `AppearanceTab`, `RegionTab`, `ConnectionsTab`, `BillingTab`, `AdvancedTab`, `HelpTab`) na pasta `front/src/pages/settings/components/`.
```

---

# 34. Prioridade Média

### 5. Substituir `alert()` [CONCLUÍDO]

Arquivos:

```text
LoginPage.tsx
LeadsPage.tsx
ApiKeysPage.tsx
ApiTesterPage.tsx
ApiTester.tsx
```

Status:

```text
CONCLUÍDO: Substituídas todas as chamadas por `useToast()` do ToastContext centralizado (`toast.success`, `toast.error`, `toast.info`).
```

---

### 6. EmptyState [CONCLUÍDO]

Arquivos:

```text
front/src/components/ui/EmptyState.tsx
front/src/components/ui/EmptyState.css
DocsPage.tsx
LeadsPage.tsx
GithubDashboardPage.tsx
DashboardPage.tsx
```

Status:

```text
CONCLUÍDO: Componente reutilizável `EmptyState` construído respeitando os tokens de Quiet Luxury / Dark Enterprise e integrado em todas as páginas para estados de busca vazia, listas vazias e ausência de dados.
```

---

### 7. Dynamic Viewport [CONCLUÍDO]

Arquivos:

```text
Auth.css
Dashboard.css
Docs.css
AiChat.css
Git.css
Settings.css
DashboardLayout.css
Modal.css
```

Status:

```text
CONCLUÍDO: Adicionado `100dvh` / `calc(100dvh - ...)` em conjunto com `100vh` para garantir perfeita visualização responsiva em navegadores mobile com barras dinâmicas.
```

---

### 8. Cancelamento de Requests [CONCLUÍDO]

Arquivos:

```text
LeadsPage.tsx
GithubDashboardPage.tsx
DocsPage.tsx
```

Status:

```text
CONCLUÍDO: `AbortController` integrado em buscas de leads, listagem de repositórios do GitHub e autosave com debounce (800ms) com cancelamento ao desmontar ou trocar de contexto.
```

---

# 35. Prioridade Baixa

### 9. Clipboard Feedback [CONCLUÍDO]

Arquivos:

```text
ApiKeysPage.tsx
AiChatPage.tsx
GitPage.tsx
```

Status:

```text
CONCLUÍDO: Feedback unificado via `toast.success('Copiado para a área de transferência!')` e estados visuais transitórios nos botões.
```

---

### 10. Acessibilidade de botões de ícone [CONCLUÍDO]

Arquivos:

```text
ProjectsPage.tsx
AutomationsPage.tsx
AiChatPage.tsx
SettingsPage.tsx
ApiKeysPage.tsx
```

Status:

```text
CONCLUÍDO: `aria-label`s atribuídos a todos os botões de ação com ícones puros (excluir card, voltar, alternar senha, executar código, copiar, fechar modal).
```

---

# 36. Regras de Ouro

Antes de implementar qualquer alteração, o agente deve perguntar:

```text
1. Existe uma solução já existente?
2. Estou duplicando um componente?
3. Estou duplicando lógica?
4. Estou inventando dados?
5. Estou expondo dados que não deveriam estar no frontend?
6. Estou confiando no frontend para segurança?
7. Estou criando uma request desnecessária?
8. Estou criando uma condição de race?
9. Estou quebrando responsividade?
10. Estou quebrando acessibilidade?
11. Estou violando o Design System?
12. Estou alterando algo fora do escopo?
```

Se qualquer resposta for "sim", corrigir a abordagem antes de implementar.

---

# 37. Workflow Obrigatório do Agente

Para tarefas não triviais:

```text
ANALISAR
   ↓
ENTENDER CONTEXTO
   ↓
INSPECIONAR CÓDIGO
   ↓
IDENTIFICAR IMPACTOS
   ↓
PLANEJAR
   ↓
IMPLEMENTAR
   ↓
TYPECHECK
   ↓
LINT / TESTS
   ↓
BUILD
   ↓
TESTAR NO BROWSER
   ↓
REVISAR SEGURANÇA
   ↓
REVISAR UX/UI
   ↓
ENTREGAR
```

Para alterações críticas:

```text
ANALISAR
   ↓
EXPLICAR RISCO
   ↓
PROPOR SOLUÇÃO
   ↓
AGUARDAR APROVAÇÃO
   ↓
IMPLEMENTAR
```

---

# 38. Regra Final

A FluxionIA não deve ser tratada como um projeto onde:

> "se funciona, está pronto."

Uma feature só está pronta quando:

```text
Funciona
   +
É segura
   +
É compreensível
   +
É acessível
   +
É responsiva
   +
É performática
   +
É testável
   +
É consistente
   +
É sustentável
```

**Nunca sacrificar segurança ou integridade dos dados para obter velocidade de implementação.**

**Nunca sacrificar usabilidade para obter complexidade visual.**

**Nunca adicionar complexidade arquitetural sem necessidade real.**

**Preferir soluções simples, explícitas, reutilizáveis e verificáveis.**

---

# 39. Integração Global de Notificações via WhatsApp (Evolution API)

O sistema deve integrar o envio de notificações e alertas via WhatsApp em múltiplos módulos do ecossistema FluxionIA / OrbSync:

1. **Kanban e Projetos**:
   - Sempre que um card ou tarefa for movimentado entre colunas (ex: *Em Progresso*, *Revisão*, *Concluído*), notificar a equipe ou responsáveis via WhatsApp.
2. **Documentos e Arquivos**:
   - Ao gerar, atualizar ou enviar documentos para a equipe, enviar aviso no WhatsApp com resumo/link do documento.
3. **Integração com Git e Commits**:
   - Ao realizar commits, pushes ou eventos em repositórios vinculados, notificar a equipe de desenvolvimento no WhatsApp.
4. **CRM e Leads**:
   - Ao capturar ou qualificar novos leads, enviar notificação imediata para o responsável pelo WhatsApp.
5. **Padrão de Execução**:
   - Toda notificação via WhatsApp deve utilizar a camada centralizada (`whatsapp.service.ts`), tratando falhas de envio de forma assíncrona para nunca interromper ou travar a experiência principal da interface.

