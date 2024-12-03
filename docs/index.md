---
layout: home

hero:
  name: 'Medicus'
  text: 'Flexible and agnostic health checks.'
  tagline: Ensure the post-deployment health of your APIs and Services.
  actions:
    - theme: brand
      text: Get Started
      link: get-started.md

    - theme: alt
      text: Integrations
      link: integrations.md

  image:
    src: /medicus.svg
    alt: Dna svg with yellow colors
    title: Medicus logo

features:
  - icon: 🏥
    title: Framework Agnostic
    details:
      Medicus is a pure Node.js implementation, free from dependencies on
      any specific library or framework, ensuring maximum compatibility.

  - icon: 🩺
    title: Better Safe Than Sorry
    details:
      Post-deployment reliability matters. Medicus provides a standardized
      API to help you monitor and ensure system health.

  - icon: 🧩
    title: Seamless Connectivity
    details:
      Medicus is built for versatility, supporting all types of applications
      and offering native integrations with many frameworks and platforms.

  - icon: 🔒
    title: Reliable by Design
    details:
      With robust error handling and detailed logging, Medicus ensures
      that your services remain transparent and maintainable, even under stress.

  - icon: 🌍
    title: Proven in Production
    details:
      Trusted by real-world companies, Medicus is already ensuring the
      health of production systems across diverse industries.

  - icon: 🛡️
    title: Secure by Default
    details:
      Protect sensitive health check details with built-in support for
      authentication, ensuring only authorized users can access diagnostic data.
---

<script setup>
import { VPTeamPage, VPTeamPageTitle } from 'vitepress/theme';

const companies = [
  {
    name: 'Clickmax',
    logo: '/companies/clickmax.svg',
    link: 'https://clickmax.io'
  },
  {
    name: 'Bilhon Tech',
    logo: '/companies/bilhon.webp',
    link: 'https://bilhon.com/'
  }
];
</script>

<VPTeamPageTitle>
  <template #title>Trusted by companies</template>
  <template #lead>Medicus is proudly powering a large ecosystem of organizations and products worldwide.</template>
</VPTeamPageTitle>

<div id="trusted-by-wrapper">
  <div id="trusted-by">
    <template v-for="company in companies">
      <a :href="company.link" :alt="company.name" target="_blank" :title="company.name">
        <img :src="company.logo" :alt="`${company.name} logo`" />
      </a>
    </template>
  </div>
  <small id="small-text">
    The logos displayed in this page are property of the respective organizations and they are not distributed under the same license as Medicus (MIT).
    <br />
    Want to be featured here? <a href="mailto:medicus@arthur.place">Mail us</a>!
  </small>
</div>
