# Python + Lógica — Cheat Sheet

Cheat sheet interativo de Python e lógica de programação, escrito em português brasileiro. Cobre desde variáveis e tipos até classes, herança e padrões modernos — com explicações didáticas lado a lado com exemplos de código.

![Preview](assets/preview.png)

---

## Recursos

- **15 seções** cobrindo variáveis, operadores, condicionais, loops, funções, strings, listas, dicionários, tuplas, sets, tratamento de erros, módulos, funções avançadas, classes e padrões úteis
- **Syntax highlighting** com Prism.js, tema dark personalizado nas cores do projeto
- **Busca em tempo real** — filtra cards por conceito, função ou trecho de código (debounce 150ms)
- **Botão "Copiar código"** injetado em todos os blocos de código com feedback visual
- **Barra de progresso de leitura** no topo da página
- **Botão "Voltar ao topo"** com aparição suave após 300px de scroll
- **Nav ativa por seção** — IntersectionObserver marca o link da seção visível
- **Header height dinâmico** — scroll-margin-top calculado em runtime, funciona em mobile
- **Scrollbars premium** minimalistas (6px globais, 4px em blocos de código)
- **Layout responsivo** para mobile, tablet e desktop
- **Acessibilidade** — skip link, aria-labels, role="search", foco visível em todos os interativos
- **Suporte a impressão/PDF** com tema claro e quebras de página adequadas
- Design dark premium com identidade visual consistente

---

## Tecnologias

**HTML5** · **CSS3** · **JavaScript ES6+** · **Prism.js 1.29** · **Google Fonts** (Space Mono + Sora)

Zero dependências de build · Zero frameworks · Abre direto no navegador

---

## Como rodar localmente

```bash
git clone https://github.com/seuusuario/python-logica-cheatsheet.git
cd python-logica-cheatsheet
```

Abra o arquivo `index.html` diretamente no navegador — não precisa de servidor.

> **Dica:** Para ter syntax highlighting funcionando offline, você precisará de conexão com a internet na primeira visita (Prism.js é carregado via CDN). Após isso, o browser cacheia.

---

## Como publicar no GitHub Pages

1. Crie um repositório no GitHub (ex: `python-logica-cheatsheet`)
2. Envie os arquivos para a branch `main`:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/seuusuario/python-logica-cheatsheet.git
   git push -u origin main
   ```
3. No repositório, vá em **Settings → Pages**
4. Em **Source**, selecione a branch `main` e a pasta `/ (root)`
5. Clique em **Save**
6. Aguarde ~1 minuto e acesse a URL gerada

---

## Estrutura do projeto

```
python-logica-cheatsheet/
├── index.html      # Estrutura HTML semântica (sem CSS/JS inline)
├── style.css       # Todos os estilos, organizados por blocos comentados
├── script.js       # Funcionalidades: busca, copiar, progresso, nav ativa
└── README.md       # Este arquivo
```

---

## Seções cobertas

| # | Seção | Conteúdo |
|---|-------|----------|
| 01 | Variáveis & Tipos | int, float, str, bool, list, dict, tuple, set |
| 02 | Operadores | Matemáticos, comparação, booleanos |
| 03 | Condicionais | if/elif/else, ternário, in/not in |
| 04 | Loops | for, while, break, continue, list comprehension |
| 05 | Funções | def, parâmetros padrão, *args, **kwargs, lambda |
| 06 | Strings | Fatiamento, f-strings, métodos essenciais |
| 07 | Listas | Indexação, métodos, funções built-in |
| 08 | Dicionários | CRUD, iteração, dict como contador |
| 09 | Tuplas & Sets | Imutabilidade, operações de conjunto |
| 10 | Erros | try/except/else/finally, raise, erros comuns |
| 11 | Módulos | math, random, datetime, os, json |
| 12 | Funções Avançadas | zip, map, filter |
| 13 | Classes | POO básico, herança, `__str__` |
| 14 | Padrões Úteis | Type hints, docstrings, walrus `:=` |
| 15 | Resumo Geral | Tabela completa de referência |

---

## Acesso

🔗 https://seuusuario.github.io/python-logica-cheatsheet/

---

*Feito por Eduardo Agnes Holmer*
