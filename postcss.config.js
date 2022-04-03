module.exports = {
  plugins: [
    require('postcss-sort-media-queries')({ sort: 'mobile-first' }),
    require('autoprefixer'),
    require('cssnano')({ preset: ['default', { discardComments: { removeAll: true } }] }),
  ],
};
