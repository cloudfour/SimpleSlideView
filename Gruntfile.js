// Leaving the unused watch task here in case
// we need it again a near-future version.
module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      build: {
        src: 'src/simpleslideview.js',
        dest: 'lib/simpleslideview.min.js'
      }
    },
    watch: {
      scripts: {
        files: ['src/simpleslideview.js'],
        tasks: ['uglify']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('default', ['uglify']);

};