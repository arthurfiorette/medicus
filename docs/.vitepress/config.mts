import path from 'node:path';
import { transformerTwoslash } from '@shikijs/vitepress-twoslash';
import { createFileSystemTypesCache } from '@shikijs/vitepress-twoslash/cache-fs';
import { defineConfig } from 'vitepress';
import { description, version } from '../../package.json';

export default defineConfig({
  lang: 'en-US',
  title: 'Medicus',
  description,

  cleanUrls: true,
  appearance: true,
  lastUpdated: true,

  markdown: {
    lineNumbers: true,
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
            paths: {
              medicus: ['./src/index.ts']
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

    nav: [
      {
        text: '<img alt="github.com/medicus Org stars" src="https://img.shields.io/github/stars/arthurfiorette/medicus?style=flat&logo=github&label=Star%20us!&color=%239CBD88">',
        link: 'https://github.com/arthurfiorette/medicus',
        noIcon: true
      },
      {
        text: '',
        link: '#',
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
            text: 'Changelog',
            link: 'https://github.com/arthurfiorette/medicus/releases'
          },
          {
            text: 'Versions',
            link: 'https://npmjs.com/package/medicus?activeTab=versions'
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
          }
        ]
      },
      {
        base: '/guides/',
        text: 'Guides',
        items: [
          {
            text: 'Non exposed services',
            link: 'non-exposed-services.md'
          },
          {
            text: 'SQL Databases',
            link: 'sql-databases.md'
          },
          {
            text: 'Redis',
            link: 'redis.md'
          }
        ]
      },
      {
        base: '/integrations/',
        text: 'Integrations',
        link: 'index.md',
        items: [
          {
            text: 'Node',
            link: 'node.md'
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
            text: 'Open Telemetry',
            link: 'open-telemetry.md'
          }
        ]
      }
    ]
  },
  head: [['link', { rel: 'icon', href: '/medicus.svg', type: 'image/x-icon' }]]
});
