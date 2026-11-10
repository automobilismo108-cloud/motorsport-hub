# MOTORSPORT HUB — MVP 0.1

Protótipo web de gerenciamento de automobilismo, inicialmente com a Fórmula 1 2026.

## Requisitos
- Node.js 20.9 ou superior
- npm
- (Opcional nesta etapa) projeto Supabase para persistência

## Executar localmente

```bash
npm install
npm run dev
```

Abra http://localhost:3000.

## O que já funciona
- Dashboard com 11 equipes e 22 pilotos de referência da F1 2026.
- Navegação entre visão geral, pilotos, equipes e mercado.
- Busca de pilotos.
- Formulário para simular transferência.
- Validação de limite de dois titulares por equipe.
- Histórico de movimentações na sessão do navegador.

**Limitação importante:** a transferência nesta versão altera somente o estado em memória do navegador. Recarregar a página restaura os dados iniciais. A integração com PostgreSQL/Supabase e o motor de negociação automático são próximas etapas.

## Banco de dados
O arquivo `database/schema.sql` cria a estrutura relacional no PostgreSQL/Supabase.

1. Crie um projeto Supabase.
2. Abra SQL Editor.
3. Cole e execute `database/schema.sql`.
4. A próxima etapa será conectar a interface ao banco usando variáveis de ambiente e políticas RLS.

## Dados de referência
A lista inicial representa as 11 equipes e os 22 pilotos inscritos na temporada 2026, conforme a lista oficial de participantes da FIA para o GP da Austrália de 2026. Confirme a situação contratual e eventuais substituições antes de usar os dados para decisões ou publicação. O protótipo não importa automaticamente dados externos.

Fonte: https://www.fia.com/system/files/decision-document/2026_australian_grand_prix_-_entry_list_v2.pdf
Referência complementar: https://www.formula1.com/en/drivers

## Próximas etapas
1. Conectar Supabase e persistir cadastros/movimentações.
2. Implementar autenticação e políticas de acesso.
3. Criar contratos reais com fontes, datas de validade e nível de verificação.
4. Implementar motor de mercado: orçamento, desempenho, idade, potencial, vagas, preferências e probabilidade de aceite.
5. Adicionar campeonatos/categorias adicionais sem alterar o modelo central.
