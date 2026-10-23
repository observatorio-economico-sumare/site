# Segurança e privacidade

1. Manter o repositório privado durante o desenvolvimento; ativar autenticação em duas etapas.
2. Não gravar senhas, cookies, tokens, .env, CPF ou outros dados pessoais no repositório.
3. Usar permissões mínimas do GitHub Actions. O workflow de auditoria usa apenas contents: read.
4. A interface não possui autenticação, banco de dados nem coleta de dados pessoais.
5. A publicação está desabilitada nesta etapa; não acionar GitHub Pages até a revisão dos indicadores.
6. Conferir código e dependências antes do deploy. O processamento usa somente a biblioteca padrão do Python.
7. Se futuramente houver formulários, análises de acesso ou serviços terceirizados, revisar LGPD e política de privacidade.
8. Verificar links, segurança de dependências, acessibilidade, privacidade e integridade dos indicadores antes de tornar o repositório público.
9. O site usa meta CSP como proteção complementar; cabeçalhos HTTP de segurança dependem da plataforma de hospedagem.
