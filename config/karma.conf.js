module.exports = function(config){
    config.set({
        basePath : '../',

        files : [
            'js/lib/**/*.js',
            'js/**/*.js',
            'js/test/unit/**/*.js'
        ],

        autoWatch : true,

        frameworks: ['jasmine'],

        browsers : ['Chrome'],

        plugins : [
            'karma-chrome-launcher',
            'karma-script-launcher',
            'karma-jasmine'
        ]
    });
};
