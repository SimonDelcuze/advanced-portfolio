import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import type { UserConfig } from 'vite';

const config: UserConfig = {
  plugins: [sveltekit(), tailwindcss()],
  optimizeDeps: {
    exclude: ['three/examples/jsm/objects/GroundProjectedSkybox']
  },
  ssr: {
    external: ['three/examples/jsm/objects/GroundProjectedSkybox']
  }
};

export default config;
