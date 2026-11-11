# Configuração do Supabase — Motorsport Hub

O projeto usa Supabase Auth para o login privado e uma tabela com Row Level Security (RLS) para armazenar os dados de cada usuário.

## 1. Criar o projeto

1. Crie um projeto em https://supabase.com/dashboard.
2. Escolha uma região próxima (South America / São Paulo, se disponível).
3. Guarde a senha do banco em um local seguro.

## 2. Criar a tabela protegida

1. No painel do Supabase, abra **SQL Editor**.
2. Crie uma consulta e cole todo o conteúdo de [supabase/schema.sql](./supabase/schema.sql).
3. Execute a consulta.

As políticas RLS garantem que uma conta só consiga ler e alterar as linhas cujo `user_id` corresponde ao próprio usuário autenticado.

## 3. Criar somente a conta do administrador

1. Em **Authentication → Sign In / Providers**, confirme que o provedor **Email** está habilitado.
2. Em **Authentication → Settings**, desative a criação pública de novas contas (Allow new users to sign up).
3. Em **Authentication → Users**, use **Add user** para criar seu e-mail e senha de administrador.

Não há tela pública de cadastro no Motorsport Hub.

## 4. Configurar o GitHub Pages

No repositório GitHub, abra **Settings → Secrets and variables → Actions** e crie estes *Repository secrets*:

- `NEXT_PUBLIC_SUPABASE_URL`: Project URL exibida em **Project Settings → API**.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: chave pública **anon** do projeto.

Use somente a chave pública anon/publishable no frontend. **Nunca** coloque a chave `service_role` em variáveis `NEXT_PUBLIC_*`, no código ou no navegador.

Depois de salvar os secrets, abra **Actions**, selecione **Deploy MOTORSPORT HUB to GitHub Pages** e clique em **Run workflow** para gerar o site com as configurações.

## 5. Primeiro acesso e importação dos dados

Entre pelo navegador em que os dados antigos estão salvos. Na primeira autenticação, o app procura os dados locais antigos e importa pilotos, transferências, calendário e resultados para a nuvem, caso ainda não existam registros para essa conta.

Depois da importação, o Supabase passa a ser a fonte principal dos dados. A importação não apaga os dados antigos do navegador.

## Observações

- O site continua hospedado no GitHub Pages; o Supabase fornece autenticação e banco de dados.
- A URL do projeto e a chave anon são necessárias no momento do build estático, por isso ficam nos secrets do GitHub Actions.
- Não compartilhe sua senha do Supabase nem a chave `service_role`.
