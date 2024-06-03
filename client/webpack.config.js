module.exports = {
    // Other webpack configuration options...
    resolve: {
        fallback: {
            "stream": require.resolve("stream-browserify"),
            "https": require.resolve("https-browserify"),
            "assert": require.resolve("assert/"),
            "util": require.resolve("util/"),
            "url": require.resolve("url/")
        }
    }
};
