<p align="center">
   <b>Using this package?</b> Please consider <a href="https://github.com/sponsors/arthurfiorette" target="_blank">donating</a> to support my open source work ❤️
  <br />
  <sup>
   Help medicus grow! Star and share this amazing repository with your friends and co-workers!
  </sup>
</p>

<br />

<p align="center" title="Medicus's logo">
  <a href="https://medicus.js.org" target="_blank" rel="noopener noreferrer">
    <img src="docs/public/medicus.svg" width="180" alt="Medicus logo" />
  </a>
</p>

<br />

<p align="center">
  <a title="MIT license" target="_blank" href="https://github.com/arthurfiorette/medicus/blob/main/LICENSE"><img alt="License" src="https://img.shields.io/github/license/arthurfiorette/medicus?color=bfb434"></a>
  <a title="Codecov" target="_blank" href="https://app.codecov.io/gh/arthurfiorette/medicus"><img alt="Codecov" src="https://img.shields.io/codecov/c/github/arthurfiorette/medicus?token=ML0KGCU0VM&color=d2a72d"></a>
  <a title="NPM Package" target="_blank" href="https://www.npmjs.com/package/medicus"><img alt="Downloads" src="https://img.shields.io/npm/dw/medicus?style=flat&color=de8f2e"></a>
  <a title="Bundle size" target="_blank" href="https://bundlephobia.com/package/medicus"><img alt="Bundlephobia" src="https://img.shields.io/bundlephobia/minzip/medicus/latest?style=flat&color=e87430"></a>
  <a title="Last Commit" target="_blank" href="https://github.com/arthurfiorette/medicus/commits/main"><img alt="Last commit" src="https://img.shields.io/github/last-commit/arthurfiorette/medicus?color=f15633"></a>
  <a title="Blazingly fast" target="_blank" href="https://twitter.com/acdlite/status/974390255393505280"><img src="https://img.shields.io/badge/blazingly-fast-fa3737"/></a>
  
</p>

<br />
<br />

# Medicus

> Flexible and agnostic health checks. Ensure the post-deployment health of your services.

<br />

Medicus is a comprehensive, agnostic health check library for Node.js. It provides an easy way to monitor the health of various services and integrates seamlessly with Fastify.

<br />

[Read the docs to **Learn More**.](https://arthur.run/medicus)

<br />
<br />

```ts
import { Medicus, HealthStatus } from 'medicus';

const medicus = new Medicus();

// Add health checkers
medicus.addChecker({
  database() {
    // Custom health logic
    return HealthStatus.HEALTHY;
  },
  cache() {
    // Simulate an unhealthy status
    return HealthStatus.UNHEALTHY;
  }
});

// Perform a health check
const result = await medicus.performCheck();
// {
//   status: 'UNHEALTHY',
//   services: {
//     database: { status: 'HEALTHY' },
//     cache: { status: 'UNHEALTHY' }
//   }
// }
```

<br />

## License

Licensed under the **MIT**. See [`LICENSE`](LICENSE) for more information.

<br />

## Star History

<a href="https://star-history.com/#arthurfiorette/medicus&Date">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=arthurfiorette/medicus&type=Date&theme=dark" />
    <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=arthurfiorette/medicus&type=Date" />
    <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=arthurfiorette/medicus&type=Date" />
  </picture>
</a>

<br />
<br />

## All Thanks To Our Contributors:

<a href="https://github.com/arthurfiorette/medicus/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=arthurfiorette/medicus" />
</a>

<br />
