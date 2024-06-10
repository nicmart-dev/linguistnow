const path = require('path');

module.exports = {
    // Other webpack configuration options...
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'), // Alias for your source directory
            'components': path.resolve(__dirname, 'src/components'), // Alias for your components directory
            'utils': path.resolve(__dirname, 'src/lib/utils.js'), // Alias for your utils directory
            // Add more aliases if needed
        },
        fallback: {
            "stream": require.resolve("stream-browserify"),
            "https": require.resolve("https-browserify"),
            "assert": require.resolve("assert/"),
            "util": require.resolve("util/"),
            "url": require.resolve("url/")
        }
    }
};
