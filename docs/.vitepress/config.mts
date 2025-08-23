import path from 'node:path';
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

  vite: {
    plugins: [
      llmstxt({
        domain: 'https://medicus.js.org',
        description,
        title: 'Medicus'
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
            types: [path.resolve('docs/.vitepress/globals.d.ts')]
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
            text: 'Checkers',
            link: 'checkers.md'
          },
          {
            text: 'Error logger',
            link: 'error-logger.md'
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
            text: 'Non exposed services',
            link: 'non-exposed-services.md',
            todo: true
          },
          {
            text: 'SQL Databases',
            link: 'sql-databases.md',
            todo: true
          },
          {
            text: 'Redis',
            link: 'redis.md',
            todo: true
          }
        ])
      },
      {
        text: 'llms.txt',
        link: 'llms.txt'
      },
      {
        text: 'llms-full.txt',
        link: 'llms-full.txt'
      }
    ]
  },
  head: [
    [
      'link',
      {
        rel: 'icon',
        href: '/medicus.svg',
        type: 'image/x-icon'
      }
    ],

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
