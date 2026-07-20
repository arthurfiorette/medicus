import path from 'node:path';
import { buildEndGenerateOpenGraphImages } from '@nolebase/vitepress-plugin-og-image/vitepress';
import { transformerTwoslash } from '@shikijs/vitepress-twoslash';
import { createFileSystemTypesCache } from '@shikijs/vitepress-twoslash/cache-fs';
import { defineConfig } from 'vitepress';
import llmstxt from 'vitepress-plugin-llms';
import { description, version } from '../../package.json';

export default defineConfig({
  lang: 'en-US',
  title: 'Medicus',
  description,

  cleanUrls: true,
  appearance: true,
  lastUpdated: true,

  sitemap: {
    hostname: 'https://medicus.js.org'
  },

  // Per-page canonical + Open Graph tags. Canonicals matter here because the
  // llms plugin deploys raw .md twins next to every .html page.
  transformPageData(pageData) {
    const canonicalUrl = `https://medicus.js.org/${pageData.relativePath}`
      .replace(/index\.md$/, '')
      .replace(/\.md$/, '');

    pageData.frontmatter.head ??= [];
    pageData.frontmatter.head.push(
      ['link', { rel: 'canonical', href: canonicalUrl }],
      ['meta', { property: 'og:url', content: canonicalUrl }],
      [
        'meta',
        {
          property: 'og:title',
          content: pageData.title ? `${pageData.title} | Medicus` : 'Medicus'
        }
      ],
      ['meta', { property: 'og:description', content: pageData.description || description }]
    );

    // Pages outside the sidebar don't get a per-page card from the og-image
    // plugin, so fall back to the pre-rendered home card (docs/public/og-home.png)
    if (pageData.relativePath === 'index.md' || pageData.relativePath === 'integrations/index.md') {
      pageData.frontmatter.head.push([
        'meta',
        { property: 'og:image', content: 'https://medicus.js.org/og-home.png' }
      ]);
    }
  },

  // Renders a social media card (og:image / twitter:image) per page
  async buildEnd(siteConfig) {
    await buildEndGenerateOpenGraphImages({
      baseUrl: 'https://medicus.js.org',
      category: {
        byPathPrefix: [
          { prefix: '/integrations', text: 'Integrations' },
          { prefix: '/guides', text: 'Guides' },
          { prefix: '/', text: 'Documentation' }
        ],
        fallbackWithFrontmatter: true
      }
    })(siteConfig);
  },

  vite: {
    plugins: [
      llmstxt({
        domain: 'https://medicus.js.org',
        description,
        title: 'Medicus',
        // Placeholder page, noise for AI consumers
        ignoreFiles: ['todo.md']
      })
    ]
  },

  markdown: {
    typographer: true,

    theme: {
      dark: 'everforest-dark',
      light: 'everforest-light'
    },

    codeTransformers: [
      transformerTwoslash({
        jsdoc: true,
        explicitTrigger: false,

        typesCache: createFileSystemTypesCache({
          dir: path.resolve('docs/.vitepress/cache/shiki')
        }),

        twoslashOptions: {
          compilerOptions: {
            baseUrl: path.resolve('src'),
            paths: {
              medicus: ['./index.ts'],
              'medicus/*': ['./integrations/*']
            },
            types: [
              path.resolve('docs/.vitepress/globals.d.ts'),
              path.resolve('node_modules/@types/node')
            ]
          }
        }
      })
    ]
  },

  themeConfig: {
    logo: '/medicus.svg',

    outline: 'deep',

    externalLinkIcon: true,

    editLink: {
      pattern: 'https://github.com/arthurfiorette/medicus/edit/main/docs/:path'
    },

    search: {
      provider: 'local'
    },

    carbonAds: {
      code: 'CEBDT27Y',
      placement: 'vuejsorg'
    },

    nav: [
      {
        text: '<img alt="github.com/medicus Org stars" src="https://img.shields.io/github/stars/arthurfiorette/medicus?style=flat&logo=github&label=Star%20us!&color=%239CBD88">',
        link: 'https://github.com/arthurfiorette/medicus',
        noIcon: true
      },
      {
        text: 'Get started',
        link: 'get-started.md'
      },
      {
        text: 'Integrations',
        link: 'integrations.md'
      },
      {
        text: version,
        items: [
          {
            text: 'Releases',
            link: 'https://github.com/arthurfiorette/medicus/releases'
          },
          {
            text: 'Issues',
            link: 'https://github.com/arthurfiorette/medicus/issues'
          }
        ]
      }
    ],

    footer: {
      message: 'Released under the MIT License',
      copyright: `Copyright © ${new Date().getFullYear()} - Arthur Fiorette & Medicus Contributors`
    },

    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/arthurfiorette/medicus'
      },
      {
        icon: 'npm',
        link: 'https://npmjs.com/package/medicus'
      },
      {
        icon: 'x',
        link: 'https://x.com/arthurfiorette'
      }
    ],

    sidebar: [
      {
        base: '/',
        text: 'Introduction',
        items: [
          {
            text: 'Get started',
            link: 'get-started.md'
          },
          {
            text: 'AI Support',
            link: 'ai-support.md'
          },
          {
            text: 'Checkers',
            link: 'checkers.md'
          },
          {
            text: 'Logger',
            link: 'logger.md'
          },
          {
            text: 'Debug view',
            link: 'debug-view.md'
          },
          {
            text: 'Background Checks',
            link: 'background-checks.md'
          },
          {
            text: 'Plugins',
            link: 'plugins.md'
          }
        ]
      },
      {
        base: '/integrations/',
        text: 'Integrations',
        link: 'index.md',
        items: mapSideItems([
          {
            text: 'Node',
            link: 'node.md'
          },
          {
            text: 'HTTP',
            link: 'http.md'
          },
          {
            text: 'Fastify',
            link: 'fastify.md'
          },
          {
            text: 'Hono',
            link: 'hono.md'
          },
          {
            text: 'TanStack Start',
            link: 'tanstack-start.md'
          },
          {
            text: 'Avvio',
            link: 'avvio.md'
          },
          {
            text: 'Pino',
            link: 'pino.md'
          }
        ])
      },
      {
        base: '/guides/',
        text: 'Guides',
        items: mapSideItems([
          {
            text: 'Background Workers',
            link: 'background-workers.md'
          },
          {
            text: 'SQL Databases',
            link: 'sql-databases.md'
          },
          {
            text: 'Key-Value Stores',
            link: 'key-value-stores.md'
          }
        ])
      }
    ]
  },
  head: [
    [
      'link',
      {
        rel: 'icon',
        href: '/medicus.svg',
        type: 'image/svg+xml'
      }
    ],

    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: 'Medicus' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:site', content: '@arthurfiorette' }],

    [
      'script',
      {
        defer: '',
        'data-domain': 'medicus.js.org',
        src: 'https://metrics.arthur.one/js/script.js'
      },
      '/* This site metrics are public available at https://metrics.arthur.one/medicus.js.org */'
    ]
  ]
});

function mapSideItems(items: { link?: string; text: string; todo?: boolean }[]) {
  return (
    items
      .map((item) => {
        if (item.todo) {
          item.text = `🚧 ${item.text}`;
          item.link = '../../../../todo.md';
        }

        return item;
      })
      // alphabetical
      .sort((a, b) => a.text.localeCompare(b.text, 'en', { sensitivity: 'base' }))
      // done first
      .sort((a, b) => (a.todo === b.todo ? 0 : a.todo ? 1 : -1))
  );
}
