define(['Autometa', 'lib/ramda/ramda'], function (Autometa, R) {
  QUnit.module("./TestAutometa");

  var node = new Autometa.Node('CorrectNode', Autometa.nodeType.INIT_FINAL);
  var edge = new Autometa.Edge('CorrectNode', 'CorrectNode', ['a']);
  var nodeRecord = Autometa.NodeRecord.fromNode(node);
  var nodeRecordWithEdge = Autometa.NodeRecord.fromNode(node, [edge]);

  /* Empty */
  var emptyAutometa = [];

  var DFASamples = {
    simple: [nodeRecord],
    simpleWithEdge: [nodeRecordWithEdge],
    complex: [
      new Autometa.NodeRecord('Alpha', Autometa.nodeType.INITIAL, [
        new Autometa.Edge('Alpha', 'Beta', ['a']),
        new Autometa.Edge('Alpha', 'Gamma', ['b', 'r']),
      ]),
      new Autometa.NodeRecord('Beta', Autometa.nodeType.FINAL, [
        new Autometa.Edge('Beta', 'Alpha', ['a']),
        new Autometa.Edge('Beta', 'Gamma', ['b', 'r']),
      ]),
      new Autometa.NodeRecord('Gamma', Autometa.nodeType.NORMAL, [
        new Autometa.Edge('Gamma', 'Beta', ['a']),
        new Autometa.Edge('Gamma', 'Alpha', ['b', 'r'])
      ])
    ],
    acceptEmptyString: [new Autometa.NodeRecord('Alpha', Autometa.nodeType.INIT_FINAL, [])],
    closureOfCharA: [
      new Autometa.NodeRecord('Alpha', Autometa.nodeType.INIT_FINAL, [
        new Autometa.Edge('Alpha', 'Alpha', 'a')
      ])
    ]
  };

  var NFASamples = {
    simple: [
      new Autometa.NodeRecord('Alpha', Autometa.nodeType.INITIAL, [
        new Autometa.Edge('Alpha', 'Beta', ['a']),
      ]),
      new Autometa.NodeRecord('Beta', Autometa.nodeType.NORMAL, [
        new Autometa.Edge('Beta', 'Alpha', ['b']),
        new Autometa.Edge('Beta', 'Gamma', ['b', 'c'])
      ]),
      new Autometa.NodeRecord('Gamma', Autometa.nodeType.FINAL, [])
    ],

    hasEpsilon: [
      new Autometa.NodeRecord('Alpha', Autometa.nodeType.INITIAL, [
        new Autometa.Edge('Alpha', 'Beta', ['a', ''])
      ]),
      new Autometa.NodeRecord('Beta', Autometa.nodeType.NORMAL, [
        new Autometa.Edge('Beta', 'Alpha', ['b']),
        new Autometa.Edge('Beta', 'Gamma', ['c'])
      ]),
      new Autometa.NodeRecord('Gamma', Autometa.nodeType.FINAL, [])
    ],
    epsilonCycle: [
      new Autometa.NodeRecord('Alpha', Autometa.nodeType.INITIAL, [
        new Autometa.Edge('Alpha', 'Beta', [''])
      ]),
      new Autometa.NodeRecord('Beta', Autometa.nodeType.NORMAL, [
        new Autometa.Edge('Beta', 'Gamma', [''])
      ]),
      new Autometa.NodeRecord('Gamma', Autometa.nodeType.FINAL, [
        new Autometa.Edge('Gamma', 'Alpha', [''])
      ])
    ]
  }

  var IllegalSamples = {
    onlyNormalNodes: [
      new Autometa.NodeRecord('Alpha', Autometa.nodeType.NORMAL, [
        new Autometa.Edge('Alpha', 'Beta', ['a']),
        new Autometa.Edge('Alpha', 'Gamma', ['a'])
      ]),
      new Autometa.NodeRecord('Beta', Autometa.nodeType.NORMAL, []),
      new Autometa.NodeRecord('Gamma', Autometa.nodeType.NORMAL, []),
    ],
    noInitialNode: [
      new Autometa.NodeRecord('Alpha', Autometa.nodeType.NORMAL, [
        new Autometa.Edge('Alpha', 'Beta', ['a']),
        new Autometa.Edge('Alpha', 'Gamma', ['a'])
      ]),
      new Autometa.NodeRecord('Beta', Autometa.nodeType.FINAL, []),
      new Autometa.NodeRecord('Gamma', Autometa.nodeType.FINAL, []),
    ],
    noFinalNode: [
      new Autometa.NodeRecord('Alpha', Autometa.nodeType.INITIAL, [
        new Autometa.Edge('Alpha', 'Beta', ['a']),
        new Autometa.Edge('Alpha', 'Gamma', ['a'])
      ]),
      new Autometa.NodeRecord('Beta', Autometa.nodeType.NORMAL, []),
      new Autometa.NodeRecord('Gamma', Autometa.nodeType.NORMAL, []),
    ],
    multipleInitialNode: [
      new Autometa.NodeRecord('Alpha', Autometa.nodeType.NORMAL, [
        new Autometa.Edge('Alpha', 'Beta', ['a']),
        new Autometa.Edge('Alpha', 'Gamma', ['a'])
      ]),
      new Autometa.NodeRecord('Beta', Autometa.nodeType.INITIAL, []),
      new Autometa.NodeRecord('Gamma', Autometa.nodeType.INITIAL, []),
    ]
  };

  QUnit.test("Test function: nodeEquals", function(assert) {
    assert.equal(Autometa.nodeEquals({'key': 'Node A'}, {'key': 'Node B'}), false);
    assert.equal(Autometa.nodeEquals({'key': 'Node B'}, {'key': 'Node B'}), true);
    assert.throws(function() {
      Autometa.nodeEquals(undefined, {});
    });
  });

  QUnit.test("Test function: edgeEquals", function(assert) {
    assert.equal(Autometa.edgeEquals(
      new Autometa.Edge('Node A', 'Node B'),
      new Autometa.Edge('Node A', 'Node B')
    ), true);
    assert.equal(Autometa.edgeEquals(
      new Autometa.Edge('Node E', 'Node B'),
      new Autometa.Edge('Node A', 'Node B')
    ), false);
    assert.equal(Autometa.edgeEquals(
      new Autometa.Edge('Node A', 'Node E'),
      new Autometa.Edge('Node A', 'Node B'),
    ), false);
    assert.throws(function () {
      Autometa.edgeEquals(
        {'target': 'Node A' },
        {'source': 'Node A', 'target': 'Node B'}
      );
    });
  });
  QUnit.test("Test function: addNode", function (assert) {
    console.log(Autometa.addNode(node, emptyAutometa));
    assert.deepEqual(DFASamples['simple'], Autometa.addNode(node, emptyAutometa));
    assert.throws(function() {
      Autometa.addNode(node, DFASamples['simple']);
    });
  });

  QUnit.test('Test function: addEdge', function (assert) {
    let afterAddEdge = Autometa.addEdge(edge, DFASamples['simple']);
    assert.deepEqual(afterAddEdge, DFASamples['simpleWithEdge']);
    assert.throws(function() {
      Autometa.addEdge(edge, DFASamples['simpleWithEdge']);
    });
  });

  QUnit.test('Test function: changeEdge', function (assert) {
    let changedEdge = new Autometa.Edge('CorrectNode', 'CorrectNode', ['a', 'b', 'c']);
    let changedAuto = [Autometa.NodeRecord.fromNode(node, [changedEdge])];

    /* Normal case. */
    assert.deepEqual(
      Autometa.changeEdge({
        key: { source: 'CorrectNode', target: 'CorrectNode'},
        transition: ['a', 'b', 'c']
      }, DFASamples['simpleWithEdge']),
      changedAuto
    );

    /* Duplicated transition will be omitted.Therefore the result is same as the
    * first case.*/
    assert.deepEqual(
      Autometa.changeEdge({
        key: { source: 'CorrectNode', target: 'CorrectNode'},
        transition: ['a', 'a', 'b', 'b', 'c']
      }, DFASamples['simpleWithEdge']),
      changedAuto
    );

    /* Illegal transition elements, like boolean, number array, will be omitted.
    * Therefore the result is same as previous.*/
    assert.deepEqual(
      Autometa.changeEdge({
        key: { source: 'CorrectNode', target: 'CorrectNode'},
        transition: [3, 'a', 'b', 'c', false, [], {}]
      }, DFASamples['simpleWithEdge']),
      changedAuto
    );

    /* The key attribute is mandatory, since function requires it to search
     * the autometa. If it is not specified, the function will throws a exception.
     * */
    assert.throws(function () {
      Autometa.changeEdge({
        transition: ['a', 'b', 'c']
      });
    });

    /* Both source and target should specified, since the function only can search
     * one edge at one time. Modifying multiple edges does not support yet. */

    /* No source */
    assert.throws(function () {
      Autometa.changeEdge({
        key: {target: 'CorrectNode'},
        unknownAttrs: 'Just a illegal one.'
      });
    });

    /* No target */
    assert.throws(function () {
      Autometa.changeEdge({
        key: {source: 'CorrectNode'},
        unknownAttrs: false
      });
    });

    /* Unknown attributes will result in a exception. */
    assert.throws(function () {
      Autometa.changeEdge({
        key: {source: 'CorrectNode', target: 'CorrectNode'},
        unknownAttrs: false
      });
    });
  });

  QUnit.test('Test function: changeNode', function (assert) {
    let changedNode = new Autometa.Node('CorrectNode', Autometa.nodeType.FINAL);
    let changedAutoWithNode = [Autometa.NodeRecord.fromNode(changedNode, [])];
    let changedAutoWithEdge = [Autometa.NodeRecord.fromNode(changedNode, [edge])];

    /* Two normal cases */
    assert.deepEqual(Autometa.changeNode({
        key: 'CorrectNode',
        type: Autometa.nodeType.FINAL
      }, DFASamples['simple'])
    , changedAutoWithNode);

    assert.deepEqual(Autometa.changeNode({
        key: 'CorrectNode',
        type: Autometa.nodeType.FINAL
      }, DFASamples['simpleWithEdge'])
    , changedAutoWithEdge);

    /* Exceptions */
    /* If node does not exists, throw a exception. */
    assert.throws(() => {
      Autometa.changeNode({
        key: 'Mr. 404!',
        type: Autometa.nodeType.FINAL
      }, DFASamples['simple']);
    });

    /* If key is not specified, throw a exception. */
    assert.throws(() => {
      Autometa.changeNode({
        type: Autometa.nodeType.FINAL
      }, DFASamples['simple']);
    });

    /* If there are unknown attributes, throw a exception. */
    assert.throws(() => {
      Autometa.changeNode({
        key: 'CorrectNode',
        unknownAttrs: 'Evil Unknown Attribute!'
      }, DFASamples['simple']);
    });
  });

  QUnit.test('Test function: removeEdge', function (assert) {

    /* Normal case 1 */
    /* This is the only difference between DFASamples['simple'] and DFASamples['simpleWithEdge']. */
    let deletedAutometaWithEdge = Autometa.removeEdge({
      source: 'CorrectNode',
      target: 'CorrectNode'
    }, DFASamples['simpleWithEdge']);
    assert.deepEqual(deletedAutometaWithEdge, DFASamples['simple']);

    /* Exceptions */

    /* Following 2 cases: omitting source or target. It will cause a exception */
    assert.throws(() => {
      Autometa.removeEdge({
        source: 'CorrectNode'
      }, DFASamples['simpleWithEdge']);
    });

    assert.throws(() => {
      Autometa.removeEdge({
        target: 'CorrectNode'
      }, DFASamples['simpleWithEdge']);
    });

    /* If deleting node does not exists, throw a exception. */
    assert.throws(() => {
      Autometa.removeEdge({
        source: 'Mr. Not Found!',
        target: 'Mr. Not Found!'
      }, DFASamples['simpleWithEdge']);
    })
  });

  QUnit.test('Test function: removeNode', function (assert) {

    /* Normal case 1 */
    let deletedAutometaWithNode = Autometa.removeNode("CorrectNode", DFASamples['simple']);
    assert.deepEqual(deletedAutometaWithNode, emptyAutometa);
    let deletedAutometaWithEdge = Autometa.removeNode("CorrectNode", DFASamples['simpleWithEdge']);
    assert.deepEqual(deletedAutometaWithEdge, emptyAutometa);

    /* Exceptions */

    /* If deleting node does not exists, throw a exception. */
    assert.throws(() => {
      Autometa.removeEdge({
        source: 'Mr. Not Found!',
        target: 'Mr. Not Found!'
      }, DFASamples['simple']);
    })
  });
  QUnit.test('Test function: hasNode', function(assert) {
    /* normal case */
    assert.equal(Autometa.hasNode('CorrectNode', emptyAutometa), false);
    assert.equal(Autometa.hasNode('CorrectNode', DFASamples['simple']), true);
    assert.equal(Autometa.hasNode(node, DFASamples['simple']), true);

    /* test incorect input */
    assert.equal(Autometa.hasNode({}, DFASamples['simple']), undefined);
    assert.equal(Autometa.hasNode(3, DFASamples['simple']), undefined);
  });

  QUnit.test('Test function: hasEdge', function(assert) {
    assert.equal(Autometa.hasEdge(edge.key, DFASamples['simpleWithEdge']), true);
    assert.equal(Autometa.hasEdge(new Autometa.Edge('A', 'B', []).key, DFASamples['simpleWithEdge']), false);
  });

  QUnit.test('Test function: findEdge', function (assert) {
    /* Normal case 1: find by source. */
    assert.deepEqual(Autometa.findEdge({ source: 'CorrectNode' }, DFASamples['simpleWithEdge']), edge);
    assert.deepEqual(Autometa.findEdge({ source: 'Alpha' }, DFASamples['complex']), [
      new Autometa.Edge('Alpha', 'Beta', ['a']),
      new Autometa.Edge('Alpha', 'Gamma', ['b', 'r'])
    ]);
    /* Normal case 2: find by target. */
    assert.deepEqual(Autometa.findEdge({ target: 'CorrectNode' }, DFASamples['simpleWithEdge']), edge);
    assert.deepEqual(Autometa.findEdge({ target: 'Alpha' }, DFASamples['complex']), [
      new Autometa.Edge('Beta', 'Alpha', ['a']),
      new Autometa.Edge('Gamma', 'Alpha', ['b', 'r'])
    ]);
    /* Normal case 3: find all edges */
    assert.deepEqual(Autometa.findEdge(null, DFASamples['simpleWithEdge']), edge);
    assert.deepEqual(Autometa.findEdge(null, DFASamples['complex']), [
      new Autometa.Edge('Alpha', 'Beta', ['a']),
      new Autometa.Edge('Alpha', 'Gamma', ['b', 'r']),
      new Autometa.Edge('Beta', 'Alpha', ['a']),
      new Autometa.Edge('Beta', 'Gamma', ['b', 'r']),
      new Autometa.Edge('Gamma', 'Beta', ['a']),
      new Autometa.Edge('Gamma', 'Alpha', ['b', 'r'])
    ]);

    /* Normal case 4: find by key */
    assert.deepEqual(Autometa.findEdge({ source: 'CorrectNode', target: 'CorrectNode' }, DFASamples['simpleWithEdge']), edge);
    assert.equal(Autometa.findEdge({ source: 'Not Exists', target: 'Not Exists' }, DFASamples['simpleWithEdge']), undefined);

    /* Error case: query object is empty. */
    assert.equal(Autometa.findEdge({}, DFASamples['simpleWithEdge']), undefined);
  });

  QUnit.test("Test function: findNode", function (assert) {
    /* Normal case */
    assert.deepEqual(Autometa.findNode("CorrectNode", DFASamples['simple']), node);
    assert.deepEqual(Autometa.findNode(null, DFASamples['complex']), [
      new Autometa.Node('Alpha', Autometa.nodeType.INITIAL),
      new Autometa.Node('Beta', Autometa.nodeType.FINAL),
      new Autometa.Node('Gamma', Autometa.nodeType.NORMAL)
    ]);
    assert.equal(Autometa.findNode("Not Exists", DFASamples['simpleWithEdge']), undefined);
  });

  QUnit.test("Test function: getAutometaType", function (assert) {
    /* DFA Cases */
    assert.ok(Autometa.getAutometaType(DFASamples['simple']) === Autometa.autometaType.DFA);
    assert.ok(Autometa.getAutometaType(DFASamples['simpleWithEdge']) === Autometa.autometaType.DFA);
    assert.ok(Autometa.getAutometaType(DFASamples['complex']) === Autometa.autometaType.DFA);

    /* NFA Cases */
    assert.ok(Autometa.getAutometaType(NFASamples['simple']) === Autometa.autometaType.NFA);
    assert.ok(Autometa.getAutometaType(NFASamples['hasEpsilon']) === Autometa.autometaType.NFA);

    /* IllegalSamples */
    assert.ok(Autometa.getAutometaType(IllegalSamples['onlyNormalNodes']) === Autometa.autometaType.INVALID);
    assert.ok(Autometa.getAutometaType(IllegalSamples['noInitialNode']) === Autometa.autometaType.INVALID);
    assert.ok(Autometa.getAutometaType(IllegalSamples['noFinalNode']) === Autometa.autometaType.INVALID);
    assert.ok(Autometa.getAutometaType(IllegalSamples['multipleInitialNode']) === Autometa.autometaType.INVALID);
  });

  QUnit.test("Test function: match", function (assert) {
    /* Normal seccessful cases */
    /* DFA */
    assert.ok(Autometa.matchWholeString('a', DFASamples['complex']) === Autometa.matchResult.OK);
    assert.ok(Autometa.matchWholeString('brbrba', DFASamples['complex']) === Autometa.matchResult.OK);
    assert.ok(Autometa.matchWholeString('', DFASamples['acceptEmptyString']) === Autometa.matchResult.OK);
    assert.ok(Autometa.matchWholeString('aaaaaaaaaaaaaaaaaa', DFASamples['closureOfCharA']) === Autometa.matchResult.OK);

    /* NFA */
    assert.ok(Autometa.matchWholeString('ab', NFASamples['simple']) === Autometa.matchResult.OK);
    assert.ok(Autometa.matchWholeString('ababababac', NFASamples['simple']) === Autometa.matchResult.OK);
    assert.ok(Autometa.matchWholeString('c', NFASamples['hasEpsilon']) === Autometa.matchResult.OK);
    assert.ok(Autometa.matchWholeString('abc', NFASamples['hasEpsilon']) === Autometa.matchResult.OK);
    assert.ok(Autometa.matchWholeString('', NFASamples['epsilonCycle']) === Autometa.matchResult.OK);

    /* Normal failed cases */
    /* DFA */
    assert.ok(Autometa.matchWholeString('bar', DFASamples['complex']) === Autometa.matchResult.FAILED);
    assert.ok(Autometa.matchWholeString('aa', DFASamples['complex']) === Autometa.matchResult.FAILED);
    assert.ok(Autometa.matchWholeString('not empty', DFASamples['acceptEmptyString']) === Autometa.matchResult.FAILED);
    assert.ok(Autometa.matchWholeString('hello!', DFASamples['closureOfCharA']) === Autometa.matchResult.FAILED);

    /* NFA */
    assert.ok(Autometa.matchWholeString('abc', NFASamples['simple']) === Autometa.matchResult.FAILED);
    assert.ok(Autometa.matchWholeString('a', NFASamples['simple']) === Autometa.matchResult.FAILED);
    assert.ok(Autometa.matchWholeString('a', NFASamples['hasEpsilon']) === Autometa.matchResult.FAILED);
    assert.ok(Autometa.matchWholeString('abcd', NFASamples['hasEpsilon']) === Autometa.matchResult.FAILED);
    assert.ok(Autometa.matchWholeString('abcd', NFASamples['epsilonCycle']) === Autometa.matchResult.FAILED);
    assert.ok(Autometa.matchWholeString('a', NFASamples['epsilonCycle']) === Autometa.matchResult.FAILED);

    /* NFA: contain epsilon cycle. */

    /* Matching a invalid autometa will return unknown. */
    assert.ok(Autometa.matchWholeString('abc', IllegalSamples['onlyNormalNodes']) === Autometa.matchResult.UNKNOWN);
    assert.ok(Autometa.matchWholeString('abc', IllegalSamples['noInitialNode']) === Autometa.matchResult.UNKNOWN);
    assert.ok(Autometa.matchWholeString('abc', IllegalSamples['noFinalNode']) === Autometa.matchResult.UNKNOWN);
    assert.ok(Autometa.matchWholeString('abc', IllegalSamples['multipleInitialNode']) === Autometa.matchResult.UNKNOWN);

  });

});
