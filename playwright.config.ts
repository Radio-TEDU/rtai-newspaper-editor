import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';
const executablePath=process.env.PLAYWRIGHT_EXECUTABLE_PATH??['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
export default defineConfig({
  testDir:'./tests',fullyParallel:false,workers:1,timeout:60000,
  use:{baseURL:'http://127.0.0.1:4173',viewport:{width:1440,height:1000},headless:true,launchOptions:{executablePath},trace:'retain-on-failure'},
  webServer:{command:'node scripts/serve-tests.mjs',url:'http://127.0.0.1:4173',reuseExistingServer:!process.env.CI,timeout:120000},
});
