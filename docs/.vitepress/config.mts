import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Medicus',
  description: 'A flexible and agnostic health check library for Node.js.',

  head: [['link', { rel: 'icon', href: '/medicus.svg', type: 'image/x-icon' }]],

  base: '/medicus/',

  themeConfig: {
    logo: '/medicus.svg',

    outline: 'deep',

    sidebar: [],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' },
      { icon: 'npm', link: 'https://npmjs.com/package/medicus' }
    ]
  }
});
