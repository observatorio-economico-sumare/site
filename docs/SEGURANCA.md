# Segurança e privacidade

- O repositório é público. A publicação no GitHub Pages ocorre após validação bem-sucedida na branch `main`; o acionamento manual continua disponível.
- GitHub Actions de auditoria: permissões mínimas (`contents: read`). Deploy, somente se autorizado, recebe as permissões de Pages e identidade temporária.
- Não registrar senhas, tokens, credenciais, logs com dados pessoais, arquivos `.env` ou identificadores pessoais no repositório.
- O site é estático, sem cadastro ou login. O formulário externo “Fale conosco” utiliza o Notion, com acesso restrito às respostas e retenção de até 12 meses após a última interação, ressalvadas as hipóteses legais.
- As fontes Google Fonts são carregadas externamente e podem envolver dados técnicos de conexão. O aviso de privacidade está na página Institucional; a possibilidade de hospedar as fontes localmente pode ser avaliada futuramente.
- GitHub Pages também registra endereços IP para segurança conforme política do GitHub. Não afirmar ausência absoluta de tratamento de dados por terceiros.
- Meta CSP restringe scripts e conteúdo, mas não substitui cabeçalhos HTTP de segurança. Não adicionar HTML com dados externos via `innerHTML`; a renderização dos indicadores usa `textContent`.
- Conferir 2FA, configurações do repositório, permissões da instalação, proteção de branch (quando disponível), links e revisão independente antes de publicar.
- Dependências Python externas: nenhuma. JavaScript do site: sem frameworks e sem dependências npm.
