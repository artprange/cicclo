# Cicclo

Demonstração de uma carteira fictícia para solicitar serviços de lavanderia,
desenvolvida com React Native, Expo, TypeScript e ASP.NET Core.

**[Acessar demonstração](https://cicclo-demo.onrender.com/)**

## Experimentar a demo

1. Abra a aplicação: a sessão começa com R$ 50,00.
2. Solicite uma lavagem por R$ 18,90: saldo de R$ 31,10.
3. Solicite uma secagem por R$ 20,90: saldo de R$ 10,20.
4. Tente outra solicitação: a API recusa por saldo insuficiente.
5. Use “Reiniciar demonstração” para restaurar o saldo inicial.

As solicitações são fictícias. Não há pagamentos reais nem acionamento
de máquinas físicas.

## Tecnologias

- React Native + Expo, com suporte a Web.
- TypeScript em modo estrito.
- ASP.NET Core / C# / .NET 10.
- xUnit para testes de domínio, integração e concorrência.
- Docker multi-stage para servir frontend e API na mesma origem.
- Render para hospedagem da demonstração.

## Executar localmente

Requisitos:

- Node.js 24 e npm.
- SDK .NET 10 compatível com o `global.json`.
- Docker, apenas para executar a aplicação empacotada.

Execute os comandos a partir da raiz do repositório, salvo indicação contrária.

### API

```bash
dotnet run \
  --project backend/Cicclo.Api/Cicclo.Api.csproj \
  --launch-profile http
```

A API fica disponível em `http://localhost:10000`.

- Health check: `http://localhost:10000/healthz`
- Catálogo: `http://localhost:10000/api/services`

### Frontend Web

Em outro terminal:

```bash
cd mobile
npm ci
cp .env.example .env.local
npm run web
```

Abra o endereço exibido pelo Expo. A configuração local da API é:

```dotenv
EXPO_PUBLIC_API_URL=http://localhost:10000
```

### Expo Go

Use uma versão do Expo Go compatível com o SDK do projeto.

No arquivo `mobile/.env.local`, substitua `localhost` pelo IP do computador
na rede local:

```dotenv
EXPO_PUBLIC_API_URL=http://SEU_IP_LOCAL:10000
```

Inicie a API na raiz do repositório:

```bash
dotnet run \
  --project backend/Cicclo.Api/Cicclo.Api.csproj \
  --launch-profile http \
  --urls http://0.0.0.0:10000
```

Em outro terminal:

```bash
cd mobile
npm start
```

Abra o projeto pelo Expo Go. Celular e computador devem estar na mesma rede,
com acesso à porta 10000. Recarregue o aplicativo após alterar a variável.

### Docker

Na raiz do repositório:

```bash
docker build --pull -t cicclo-demo .
docker run --rm -p 10000:10000 cicclo-demo
```

Abra `http://localhost:10000`.

O container serve a interface e a API na mesma origem. O build web publicado
utiliza caminhos relativos `/api/*`, sem depender da URL local de desenvolvimento.

## Testes e verificações

Na raiz:

```bash
dotnet test Cicclo.slnx
```

No diretório `mobile`:

```bash
npm run typecheck
env -u EXPO_PUBLIC_API_URL EXPO_NO_DOTENV=1 npm run build:web
```

Os testes do backend cobrem saldo inicial, compras, saldo insuficiente,
idempotência, isolamento de sessões, concorrência, reset e contratos HTTP.

O Dockerfile também executa os testes do backend, a verificação de tipos
e a exportação web durante o build.

## Arquitetura e decisões

O frontend consulta uma API real. Preços, saldo e validação das compras
pertencem exclusivamente ao servidor.

Os valores monetários são representados em centavos inteiros. A interface
apenas formata os valores recebidos para apresentação em reais.

O backend mantém sessões em memória, em um store singleton. Cada sessão
possui sincronização própria para tornar atômica a validação de saldo,
o débito e o registro da solicitação.

Cada intenção de compra recebe uma `Idempotency-Key`. Repetir a mesma chave
para o mesmo serviço devolve o resultado original sem nova cobrança.
Reutilizá-la para outro serviço resulta em conflito.

No navegador, apenas o identificador da sessão é guardado em `sessionStorage`.
O saldo é sempre consultado no servidor. No aplicativo nativo, o identificador
fica em memória.

O reset restaura a carteira da sessão e apaga seus registros de idempotência,
sem afetar outras sessões.

A interface usa componentes React Native e `StyleSheet`, com organização
por componente em `index.tsx`, `styles.ts` e `types.ts`, quando necessários.

## Endpoints

| Método | Rota                       | Finalidade           |
| ------ | -------------------------- | -------------------- |
| GET    | `/healthz`                 | Saúde do serviço     |
| GET    | `/api/services`            | Catálogo de serviços |
| POST   | `/api/demo/sessions`       | Criar sessão         |
| GET    | `/api/wallet`              | Consultar saldo      |
| POST   | `/api/orders`              | Solicitar serviço    |
| POST   | `/api/demo/sessions/reset` | Reiniciar sessão     |

Consulta de carteira, compra e reset utilizam o header `X-Demo-Session`.

Compras também exigem `Idempotency-Key` e um corpo JSON como:

```json
{
	"serviceId": "wash"
}
```

Os erros retornam status HTTP apropriado e um código identificável, como
`SESSION_NOT_FOUND`, `INSUFFICIENT_FUNDS` ou `IDEMPOTENCY_KEY_REUSED`.

## Limitações e tradeoffs

- Não há banco de dados ou persistência em arquivo.
- Reiniciar, republicar ou hibernar o processo apaga as sessões.
- Uma sessão perdida é tratada pelo frontend com recuperação da demonstração.
- A implantação deve manter uma única instância, pois o estado não é compartilhado.
- Sessões anônimas são uma conveniência de demonstração, não autenticação.
- Não há pagamentos reais, integração física com máquinas ou APK distribuído.
- O armazenamento em memória não implementa expiração automática de sessões.
- A solução não foi projetada para uso financeiro real.

Na análise de segurança realizada durante o empacotamento, o estágio de build
atualizado não apresentou vulnerabilidades altas ou críticas, mas manteve
ocorrências médias. Esse resultado é pontual e exige reavaliação conforme
as imagens e bases de vulnerabilidades são atualizadas.

## Uso de IA

O Codex foi utilizado como apoio para planejamento incremental, sugestões de
código no back-end, revisão, diagnóstico de erros, execução de verificações e documentação.

A implementação foi conduzida com revisão humana, ajustes de organização, estrutura da aplicação
e estilo, testes automatizados e validação do fluxo da aplicação.
