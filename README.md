# Manicure Expert

**Slogan:** Sua manicure onde voce estiver.

Primeira versao visual do sistema para conectar clientes a profissionais de manicure e pedicure com atendimento em domicilio.

## O que esta versao apresenta

- Landing page com identidade visual da marca.
- Busca de profissionais por endereco, servico, data e horario.
- Cards de profissionais com nota, distancia, status e preco.
- Area da profissional com status ativa/inativa.
- Lista de servicos e valores.
- Agenda de horarios disponiveis.
- Tela de gestao para administrar profissionais, usuarios, agendamentos e avaliacoes.
- Logo em SVG.
- Manifesto PWA para futura instalacao como app.

## Arquivos principais

- `index.html`: estrutura das telas.
- `styles.css`: design, cores e responsividade.
- `app.js`: interacoes de demonstracao.
- `assets/logo-manicure-expert.svg`: logo da marca.
- `manifest.webmanifest`: configuracao inicial para app instalavel.
- `supabase/migrations/001_initial_schema.sql`: estrutura inicial do banco.

## Proximos passos

1. Transformar esta interface em React ou Next.js.
2. Criar login de cliente, profissional e administrador.
3. Adicionar banco de dados com usuarios, profissionais, servicos e agenda.
4. Implementar geolocalizacao real por endereco.
5. Criar fluxo de agendamento com confirmacao.
6. Adicionar avaliacoes apos atendimento.
7. Preparar deploy na Vercel.
