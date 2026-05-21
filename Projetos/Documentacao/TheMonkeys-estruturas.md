---
tags: [desenvolvimento, documentacao, auto-gerado, startup, architecture, obsidian]
data_criacao: 2026-05-15
projeto: TheMonkeys
obsidian_vault_id: 21508890956d4fa2
obsidian_vault_path: D:/TheMonkeys-estruturas/TheMonkeys-estruturas
---

# TheMonkeys — Estrutura do cofre Obsidian

## Onde está esta nota (leia primeiro)

| O quê | Caminho exato |
|--------|-----------------|
| **Cofre Obsidian (id)** | `21508890956d4fa2` — pasta raiz **`D:\TheMonkeys-estruturas\TheMonkeys-estruturas`**. |
| **Caminho no vault (após reorganização)** | `18 - Documentações Técnicas/Projetos/Documentacao/TheMonkeys-estruturas` |
| **Arquivo no Windows** | `D:\TheMonkeys-estruturas\TheMonkeys-estruturas\18 - Documentações Técnicas\Projetos\Documentacao\TheMonkeys-estruturas.md` |
| **Cópia no repositório Git (TM-HAMBURGUERIA-FRONT)** | `Projetos/Documentacao/TheMonkeys-estruturas.md` na raiz do projeto (regra `agente-obsidian`). |

**Entrada do cofre:** abra [[mapa-do-cofre-start-here]] em `00 - Inbox`.

**URI Obsidian** (ajuste o nome do cofre se a lista mostrar outro rótulo):

`obsidian://open?vault=TheMonkeys-estruturas&file=18%20-%20Documenta%C3%A7%C3%B5es%20T%C3%A9cnicas%2FProjetos%2FDocumentacao%2FTheMonkeys-estruturas.md`

## Realocação das notas existentes (2026-05-15)

Todas as notas que estavam na raiz ou em pastas soltas foram movidas para a árvore numerada da skill:

| Antes (legado) | Depois |
|------------------|--------|
| `Infra/*` | `05 - Infraestrutura/` |
| `Agentes/*` | `06 - IA e Automação/Agentes/` |
| `Prompts/*` | `07 - Prompts/` |
| `GIHUB/` (typo) | `17 - DevOps/GitHub/` |
| `Projetos/Documentacao/*` | `18 - Documentações Técnicas/Projetos/Documentacao/` |
| `SubAgente de Backend.md` | `04 - Backend/subagente-backend.md` |
| `Template- The Monkey.md` | `22 - Templates/template-the-monkeys.md` |

**Hubs criados:** [[Hub Engenharia]], [[Hub Frontend]], [[Hub Backend]], [[Hub IA]], [[Hub Prompts]], [[Hub Skills]], [[Hub Infraestrutura]], [[Hub Arquitetura]], [[Hub Repositórios]].

**O que o agente fez:** operações no disco do cofre (mover pastas + criar hubs). Atualize o Obsidian (*Ctrl+R* ou reabra o cofre) se o explorador não refrescar.

## Objetivo

Definir a **árvore oficial de pastas** e os **hubs** do cofre Obsidian da startup, alinhados à skill do projeto `obsidian-documentation-vault-specialist` (hierarquia numerada, modularidade, navegação) e à regra Cursor `agente-obsidian` (notas técnicas sob `Projetos/Documentacao/` quando não houver outro caminho explícito).

## Contexto

- **Cofre Obsidian (oficial):** ID `21508890956d4fa2` — pasta `D:\TheMonkeys-estruturas\TheMonkeys-estruturas`. O plugin **Local REST API** opera sobre o cofre **aberto** no Obsidian; mantenha este cofre ativo ao usar o MCP.
- **Fonte de verdade no vault:** caminhos relativos ao cofre; a **mesma nota no Git** fica em `Projetos/Documentacao/TheMonkeys-estruturas.md` no repositório TM-HAMBURGUERIA-FRONT.
- **Convenção híbrida:** documentação de equipa em **`18 - Documentações Técnicas/Projetos/Documentacao/`** (mantém o segmento `Projetos/Documentacao` da regra Cursor) + **hubs** nas pastas `00`–`24`.

## Tecnologias

- Obsidian (Markdown, wikilinks `[[...]]`, tags `#tag`)
- MCP Obsidian (`user-obsidian`) para leitura/escrita conforme protocolo da skill

## Estrutura

### Árvore recomendada (skill — cofre completo)

```txt
00 - Inbox
01 - Startup
02 - Engenharia
03 - Frontend
04 - Backend
05 - Infraestrutura
06 - IA e Automação
07 - Prompts
08 - Skills
09 - MCPs
10 - Repositórios
11 - APIs
12 - Processos
13 - Produtos
14 - Design System
15 - Segurança
16 - Banco de Dados
17 - DevOps
18 - Documentações Técnicas
19 - Arquitetura
20 - Decisões Técnicas
21 - Roadmaps
22 - Templates
23 - Snippets
24 - Referências
99 - Arquivados
```

### Mapeamento TheMonkeys (mínimo)

| Área | Pasta sugerida | Conteúdo |
|------|----------------|----------|
| Startup / produto | `01 - Startup`, `13 - Produtos` | visão, squads, roadmap resumido |
| Engenharia | `02 - Engenharia` + hubs filhos | [[Hub Engenharia]] |
| Este repo (front) | `03 - Frontend`, `10 - Repositórios` | TM-HAMBURGUERIA-FRONT, padrões UI |
| APIs | `11 - APIs` | contratos, OpenAPI, exemplos |
| IA / Cursor | `06 - IA e Automação`, `07 - Prompts`, `08 - Skills`, `09 - MCPs` | prompts, skills, regras, MCPs |
| ADRs | `20 - Decisões Técnicas` | decisões arquiteturais |
| Rascunhos | `00 - Inbox` → triagem | nada permanente |
| Legado / lixo | `99 - Arquivados` | obsoleto, não apagar sem política |

### Hubs obrigatórios (criar ou manter)

- [[Hub Engenharia]]
- [[Hub Frontend]]
- [[Hub Backend]]
- [[Hub IA]]
- [[Hub Prompts]]
- [[Hub Skills]]
- [[Hub Infraestrutura]]
- [[Hub Arquitetura]]
- [[Hub Repositórios]]

## Fluxo

1. **Captura** em `00 - Inbox`.
2. **Classificar** por contexto (front, back, IA, etc.) e mover para a pasta numerada correspondente (MCP: ler nota → gravar no novo path → atualizar wikilinks → opcional remover origem).
3. **Registrar** decisões estáveis em `20 - Decisões Técnicas` e detalhe técnico em `18 - Documentações Técnicas` ou em `Projetos/Documentacao/` com links para os hubs.
4. **Arquivar** conteúdo obsoleto em `99 - Arquivados`.

## Regras

- Nomes de arquivo **descritivos** (kebab-case), evitando `teste.md`, `novo.md`, `temp.md`.
- Toda nota relevante: seções **Objetivo, Contexto, Tecnologias, Estrutura, Fluxo, Regras, Exemplos, Links Relacionados, Referências, Status** (template da skill).
- Frontmatter YAML em toda criação/atualização (regra `agente-obsidian`).
- Conectar notas com `[[Nome da Nota]]`; hubs listam filhos por área.
- Prioridade: conteúdo **crítico** (arquitetura, padrões, stacks, workflows, integrações, repos principais) antes de snippets e experimentos.

## Exemplos

### Hub Engenharia (esqueleto)

```markdown
# Hub Engenharia

## Frontend
- [[Hub Frontend]]

## Backend
- [[Hub Backend]]

## DevOps
- [[Hub Infraestrutura]]
```

## Links Relacionados

- Skill do projeto: `.cursor/skills/obsidian-documentation-vault-specialist/SKILL.md`
- Charter detalhado: `.cursor/skills/obsidian-documentation-vault-specialist/reference-charter.md`
- Regra Cursor: `.cursor/rules/agente-obsidian.mdc`

## Referências

- Internal: [[Hub Engenharia]], [[Hub IA]]
- Repositório front: TM-HAMBURGUERIA-FRONT (estrutura e stack no README do projeto, se existir)

## Status

- **v2** — Cofre reorganizado na árvore numerada da skill; hubs criados; notas antigas realocadas (ver tabela **Realocação**). Cópia Git mantida em `Projetos/Documentacao/TheMonkeys-estruturas.md` no repo.
