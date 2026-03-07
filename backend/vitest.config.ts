import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    fileParallelism: false,
    env: {
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/mydocs_test',
    },
    globalSetup: './test/globalSetup.ts',
  },
});
