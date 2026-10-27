# Checklist da primeira publicação (arquivo histórico)

**Atualização em 27/10/2026:** o site foi publicado em 24/10/2026. Este checklist preserva o registro da preparação inicial. Hoje, o GitHub Pages é atualizado automaticamente após testes aprovados na `main`, conforme `.github/workflows/deploy.yml`.

## Pré-condições
- [ ] Revisar interface no navegador com resoluções desktop e mobile, contraste e navegação por teclado.
- [ ] Revisar cientificamente as fichas dos dois indicadores, seus conceitos e a evidência primária.
- [ ] Confirmar texto institucional de independência e política de correções.
- [ ] Confirmar a política de privacidade (incluindo fontes Google e logs do GitHub Pages).
- [ ] Verificar que repositório não contém credenciais nem dados pessoais.
- [ ] Habilitar 2FA e, se disponível, proteção da branch `main`.
- [ ] Testes verdes em `Actions → OES | Validação`.

## Quando a fundadora autorizar publicação
1. No GitHub Free, tornar o repositório público (se esta for a opção adotada). GitHub Pages gratuito requer repositórios públicos.
2. Ir para `Settings → Pages → Build and deployment → Source: GitHub Actions`.
3. Ir para `Actions → OES | Publicação manual → Run workflow`. Digitar `PUBLICAR` exatamente.
4. Confirmar resultado do fluxo e testar a URL fornecida pelo GitHub, incluindo fichas e links.
5. Corrigir qualquer problema de fonte antes de divulgar o endereço.

Nenhuma rotina agenda publicação automática. A atualização automática das bases oficiais só será implementada após avaliação metodológica e aprovação.
