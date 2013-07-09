module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    coffee: {
      compile: {
        files: {
          'lib/jquery.simpleslideview.js': 'src/jquery.simpleslideview.coffee'
        }
      }
    },
    uglify: {
      build: {
        src: 'lib/jquery.simpleslideview.js',
        dest: 'lib/jquery.simpleslideview.min.js'
      }
    },
    watch: {
      scripts: {
        files: ['src/jquery.simpleslideview.coffee'],
        tasks: ['coffee', 'uglify']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-coffee');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('default', ['coffee', 'uglify', 'watch']);

};