(function() {

  QUnit.config.autostart = false;

  require.config({
      baseUrl: "../scripts",
  });
  var testModules = [
    "./TestAutometa.js"
  ];

  require(testModules, function() {
    QUnit.load();
    QUnit.start();
  });
}());
