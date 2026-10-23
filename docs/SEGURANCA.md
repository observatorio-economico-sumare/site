# Segurança e privacidade

- Desenvolvimento no repositório privado. A publicação pública é **manual**, sem acionamento por push, e exige confirmação textual.
- GitHub Actions de auditoria: permissões mínimas (`contents: read`). Deploy, somente se autorizado, recebe as permissões de Pages e identidade temporária.
- Não registrar senhas, tokens, credenciais, logs com dados pessoais, arquivos `.env` ou identificadores pessoais no repositório.
- Interface estática, sem cadastro, cookies próprios, formulários, analytics, sistema de login ou armazenamento deliberado de dados pessoais.
- Recursos Google Fonts são carregados externamente nesta versão. A requisição pode transmitir dados de conexão ao provedor; **antes da abertura ao público, avaliar auto-hospedagem das fontes e política de privacidade**.
- GitHub Pages também registra endereços IP para segurança conforme política do GitHub. Não afirmar ausência absoluta de tratamento de dados por terceiros.
- Meta CSP restringe scripts e conteúdo, mas não substitui cabeçalhos HTTP de segurança. Não adicionar HTML com dados externos via `innerHTML`; a renderização dos indicadores usa `textContent`.
- Conferir 2FA, configurações do repositório, permissões da instalação, proteção de branch (quando disponível), links e revisão independente antes de publicar.
- Dependências Python externas: nenhuma. JavaScript do site: sem frameworks e sem dependências npm.
