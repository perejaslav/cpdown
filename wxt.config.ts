import { defineConfig } from 'wxt';

const extensionKey =
  'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAzcBS8nxHDZYVmVIPmUrKjkX6MgnlMKxH5Nj6hNCAtLO4c4eV4ZFL7YM3LDPQfx+b7sJzju/1P1BprHImjgTvMGtj4k2zn20UZ96BNg54fyRpURGBVLEjOFIVRVoO64nVmI8y5DT5qft0bFYcUo+qWpYKEusAM+wnTG1gRvNIIbFBnZ45i5sCfNDRhzrDUbed6FFdfGnD6IXup66oV1/WOsB93xWXDp9ghfEuMCetRcv1SEI4aLnpbPTtX444Ynbuo+rqS7uMI8Sv113MTsYU8kPXa/Gyz/+PYXqJBrNj+mA4s0jPGjGp3dXM8CbXySvx1WkFuBk1Ud6AdqnMUduQAQIDAQAB';

export default defineConfig({
  manifest: {
    name: 'cpdown',
    description: 'Copy webpages, YouTube subtitles, and X content as clean Markdown',
    version: '1.8.0',
    version_name: '1.8 alpha 1',
    key: extensionKey,
    permissions: ['activeTab', 'clipboardWrite', 'contextMenus', 'scripting', 'storage'],
    commands: {
      'copy-as-markdown': {
        description: 'Copy current page as clean markdown',
        suggested_key: {
          default: 'Ctrl+Shift+T',
          mac: 'Ctrl+T',
        },
      },
    },
    options_ui: {
      page: 'options.html',
      open_in_tab: false,
    },
  },
});
