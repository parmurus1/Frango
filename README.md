<p align="center">
  <img src="public/icon.svg" width="112" alt="Mascote do Frangão" />
</p>

<h1 align="center">Frangão 🐔</h1>

<p align="center"><strong>Calistenia em casa, do ovo ao galo.</strong><br/>
Treinos guiados sem equipamento (nem barra!), exemplos animados de cada exercício e um frango que evolui junto com você.</p>

---

## O que tem no app

### 🏋️ Treinos completos
- **7 programas** com progressão semanal automática (as repetições e os tempos sobem a cada semana):
  | Programa | Para quem | Equipamento |
  |---|---|---|
  | 🥚 Do Ovo ao Pintinho | Nunca treinou | Nenhum |
  | 🐔 Frango Raiz | Iniciante/intermediário | **Nenhum** — nem barra |
  | ⚡ Expresso 10 | Sem tempo | Nenhum |
  | 🧱 Core de Aço | Abdômen e lombar | Nenhum |
  | 🪑 Casa Adaptada | Quer treinar costas sem barra | Cadeira, mesa, toalha |
  | 🏆 Rumo à Barra Fixa | Quer a primeira barra | Barra |
  | 🤸 Rumo à Parada de Mãos | Avançado | Nenhum (parede) |
- **Treino rápido**: gerador de treinos de 10/20/30 min por foco (corpo todo, empurrar, puxar, pernas, core), respeitando o seu nível e o que você tem em casa.
- **Recuperação Ativa**: 6 minutos de mobilidade para os dias de descanso (e que mantém a sua sequência).
- Aquecimento e alongamento automáticos.

### 📖 Biblioteca com 52 exercícios
Cada exercício tem **animação** (um bonequinho-frango mostrando o movimento, com câmera lenta), **passo a passo**, **dicas**, **erros comuns**, músculos trabalhados e a **escada de progressão** (ex.: flexão na parede → joelhos → normal → diamante → arqueiro).

Puxar sem barra também está coberto: Super-Homem, Y-T-W, anjo reverso, remada com toalha na porta, remada isométrica e remada invertida na mesa.

### ▶️ Player de treino guiado
Cronômetro com contagem regressiva, descanso automático, bipes, vibração, **voz do treinador** (pt-BR), aviso de "troque de lado", tela sempre ligada, e botões **⬇ mais fácil / ⬆ mais difícil** para trocar a variação no meio do treino.

### 🎮 Gamificação
- **XP e níveis** — o mascote evolui: Ovo → Pintinho → Frango → Frango Sarado → Galo → Galo Lendário.
- **Sequência de dias** 🔥 com bônus de XP, e **Ovo Protetor** 🛡️ para salvar a sequência se você faltar.
- **Missões diárias** (3 por dia) com recompensas.
- **33 conquistas** (primeira barra, 1.000 empurradas, galo madrugador…).
- **Milho** 🌽 como moeda para comprar acessórios na loja do **Galinheiro**: boné, óculos escuros, corrente de ouro, capa de herói, coroa, penas douradas…
- **Recordes pessoais**, calendário de treinos, histórico e o **Teste do Frangão** (flexões, agachamentos e prancha) para medir a evolução.

### 📱 Funciona como app
É um PWA: dá para **instalar na tela inicial** do celular, funciona **offline** e tem modo escuro.

### ☁️ Sincroniza entre aparelhos
Entrando com o e-mail (sem senha, por código), o progresso fica salvo no Supabase e aparece igual no celular e no PC. Treinou nos dois sem internet? Ao reconectar, os treinos dos dois aparelhos se somam. Sem conta, tudo continua funcionando só no aparelho, com backup em arquivo.

---

## Rodando localmente

Precisa do [Node.js](https://nodejs.org) 20 ou mais novo.

```bash
npm install
npm run dev        # abre em http://localhost:5173
```

Outros comandos:

```bash
npm test           # testes (dados, poses das animações, gamificação)
npm run build      # build de produção em dist/
npm run preview    # serve o build
```

## Sincronização com Supabase (opcional)

Sem isso o app funciona normalmente, só sem a opção de entrar com e-mail.

1. Crie um projeto grátis em [supabase.com](https://supabase.com).
2. **SQL Editor → New query**: cole o conteúdo de [`supabase/schema.sql`](supabase/schema.sql) e clique em **Run**. Isso cria a tabela `progress`, onde cada pessoa só lê e altera o próprio progresso.
3. **Authentication → Emails → Magic Link**: troque o texto do e-mail para mostrar o código, por exemplo:
   ```html
   <h2>Seu código do Frangão</h2>
   <p>Digite no app: <strong>{{ .Token }}</strong></p>
   <p>Ou toque aqui neste aparelho: <a href="{{ .ConfirmationURL }}">entrar</a></p>
   ```
4. **Authentication → URL Configuration**: em **Site URL** coloque o endereço do app (ex.: `https://frangao.vercel.app`) e adicione o mesmo em **Redirect URLs**.
5. **Project Settings → API Keys / Data API**: copie a **Project URL** e a **Publishable key** (ou a antiga *anon key*).
6. Cadastre as duas como variáveis de ambiente (veja [`.env.example`](.env.example)):
   - no Vercel: **Settings → Environment Variables**, depois **Redeploy**;
   - no PC: crie um `.env.local` com os valores e rode `npm run dev`.

O plano grátis do Supabase limita quantos e-mails de login saem por hora. Para mais que isso, configure um SMTP próprio em **Authentication → Emails → SMTP Settings**.

## Publicando no Vercel

1. Em [vercel.com/new](https://vercel.com/new), importe este repositório. O Vercel detecta o Vite sozinho (build `npm run build`, pasta `dist`).
2. Se for usar a sincronização, cadastre `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` antes do primeiro deploy.
3. No celular, abra o link e toque em **Adicionar à tela de início**.

## Publicando (GitHub Pages)

O workflow `.github/workflows/ci.yml` roda os testes em todo push e publica o site a cada push na `main`.
Só precisa ativar uma vez: **Settings → Pages → Source: GitHub Actions**. O app fica em
`https://<seu-usuario>.github.io/<nome-do-repo>/`.

## Estrutura

```
src/
  data/          exercícios (com as poses da animação), programas, frases
  lib/
    figure.ts    motor do boneco animado (cinemática inversa + enquadramento)
    gamification.ts  níveis, sequência, missões, conquistas, loja
    progress.ts  o que acontece ao terminar um treino (XP, recordes, missões…)
    workout.ts   montagem dos treinos e gerador de treino rápido
    store.tsx    estado do app, salvo no localStorage
    sync.ts      login por código e sincronização com o Supabase (e a junção entre aparelhos)
  components/    Mascote, boneco do exercício, componentes de UI
  pages/         telas
  test/          testes (vitest)
supabase/
  schema.sql     tabela e regras de segurança da sincronização
```

### Adicionando um exercício
Inclua um objeto em `src/data/exercises.ts`. A animação é descrita por poses-chave: onde fica o quadril, o ângulo do tronco e onde as mãos e os pés devem estar — cotovelos e joelhos são calculados sozinhos. Os testes verificam que braços e pernas alcançam os alvos e que nada atravessa o chão.

---

> ⚠️ O Frangão é educativo e não substitui orientação profissional. Se tiver dor, lesão ou alguma condição de saúde, procure um profissional antes de treinar.
