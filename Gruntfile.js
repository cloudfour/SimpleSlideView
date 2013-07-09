module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    coffee: {
      compile: {
        files: {
          'lib/simpleslideview.js': 'src/simpleslideview.coffee'
        }
      }
    },
    uglify: {
      build: {
        src: 'lib/simpleslideview.js',
        dest: 'lib/simpleslideview.min.js'
      }
    },
    watch: {
      scripts: {
        files: ['src/simpleslideview.coffee'],
        tasks: ['coffee', 'uglify']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-coffee');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('default', ['coffee', 'uglify', 'watch']);

};