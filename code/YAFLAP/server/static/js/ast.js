var makeElement = function (tagName) {
  var element = document.createElement(tagName)
  for (var i = 1; i < arguments.length; i++) {
    if (isArray(arguments[i])) {
      for (var j = 0; j < arguments[i].length; j++) {
        var child = typeof arguments[i][j] === 'string'
          ? document.createTextNode(arguments[i][j])
          : arguments[i][j]
        element.appendChild(child)
      }
    } else {
      var child = typeof arguments[i] === 'string'
        ? document.createTextNode(arguments[i])
        : arguments[i]
      element.appendChild(child)
    }
  }
  return element
}

var isArray = function (o) {
  return Object.prototype.toString.call(o) == '[object Array]'
}

var removeChildren = function (element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild)
  }
}

var treeShow = function (id, what) {
  if (!(what instanceof Node)) {
    what = document.createTextNode('' + what)
  }
  var div = document.getElementById(id)
  while (div.firstChild) {
    div.removeChild(div.firstChild)
  }
  div.appendChild(what)
}

// var repeat = function(s, n) {
//     var arr = [];
//     while (n-- > 0) {
//         arr.push(s);
//     }
//     return arr.join(' ');
// }
